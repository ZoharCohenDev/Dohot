import { Router, type Request, type Response, type NextFunction } from 'express';
import { supabaseAdmin, getUserFromToken } from '../lib/supabase';

export const adminRouter = Router();

function toDateOnlyString(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfCurrentMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function isValidUsername(username: string) {
  return username.length >= 3 && username.length <= 50 && /^[a-z0-9_.-]+$/.test(username);
}

// ─── requireAdmin middleware ──────────────────────────────────────────────────

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }
  const token = header.slice(7);
  const user = await getUserFromToken(token);
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  const { data } = await supabaseAdmin
    .from('business_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (data?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  req.userId = user.id;
  next();
}

// ─── GET /api/admin/status ────────────────────────────────────────────────────

adminRouter.get('/status', requireAdmin, async (_req, res) => {
  const now = new Date();
  const today = toDateOnlyString(now);
  const expiringSoonEnd = toDateOnlyString(addDays(now, 7));
  const monthStart = startOfCurrentMonth(now).toISOString();

  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .select('role, subscription_expiration_date, is_active, created_at');

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const profiles = data ?? [];
  const stats = profiles.reduce(
    (acc, profile) => {
      if (profile.is_active === true) acc.activeUsers += 1;
      if (profile.is_active === false) acc.inactiveUsers += 1;
      if (profile.role === 'admin') acc.admins += 1;
      if (profile.role === 'technician') acc.technicians += 1;
      if (profile.created_at && profile.created_at >= monthStart) acc.newUsersThisMonth += 1;

      const expirationDate = profile.subscription_expiration_date;
      if (expirationDate) {
        if (expirationDate >= today) acc.validSubscriptions += 1;
        if (expirationDate < today) acc.expiredSubscriptions += 1;
        if (expirationDate >= today && expirationDate <= expiringSoonEnd) acc.expiringSoon += 1;
      }

      return acc;
    },
    {
      totalUsers: profiles.length,
      activeUsers: 0,
      inactiveUsers: 0,
      admins: 0,
      technicians: 0,
      validSubscriptions: 0,
      expiredSubscriptions: 0,
      expiringSoon: 0,
      newUsersThisMonth: 0,
    },
  );

  res.json(stats);
});

// ─── GET /api/admin/expiring?days=7 ───────────────────────────────────────────

adminRouter.get('/expiring', requireAdmin, async (req, res) => {
  const rawDays = Array.isArray(req.query.days) ? req.query.days[0] : req.query.days;
  const days = rawDays === undefined ? 7 : Number(rawDays);

  if (!Number.isInteger(days) || days < 1 || days > 90) {
    res.status(400).json({ error: 'days must be a number between 1 and 90' });
    return;
  }

  const now = new Date();
  const today = toDateOnlyString(now);
  const endDate = toDateOnlyString(addDays(now, days));

  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .select('id, username, full_name, phone, profession, role, subscription_expiration_date, is_active')
    .gte('subscription_expiration_date', today)
    .lte('subscription_expiration_date', endDate)
    .order('subscription_expiration_date', { ascending: true });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const users = data ?? [];
  res.json({
    days,
    count: users.length,
    users,
  });
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────

adminRouter.get('/users', requireAdmin, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .select('id, username, full_name, phone, profession, role, subscription_expiration_date, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ users: data ?? [] });
});

// ─── GET /api/admin/users/check-username?username=<username> ─────────────────

adminRouter.get('/users/check-username', requireAdmin, async (req, res) => {
  const rawUsername = Array.isArray(req.query.username) ? req.query.username[0] : req.query.username;

  if (rawUsername === undefined) {
    res.status(400).json({ error: 'username is required' });
    return;
  }

  if (typeof rawUsername !== 'string') {
    res.status(400).json({ error: 'Invalid username' });
    return;
  }

  const username = rawUsername.trim().toLowerCase();

  if (!username) {
    res.status(400).json({ error: 'username is required' });
    return;
  }

  if (!isValidUsername(username)) {
    res.status(400).json({ error: 'Invalid username' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .select('id, username')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const exists = Boolean(data);
  res.json({
    username,
    exists,
    available: !exists,
  });
});

// ─── POST /api/admin/users ────────────────────────────────────────────────────

adminRouter.post('/users', requireAdmin, async (req, res) => {
  const { username, password, full_name, phone, profession, role, subscription_expiration_date } = req.body as {
    username: string;
    password: string;
    full_name: string;
    phone?: string;
    profession: string;
    role: 'admin' | 'technician';
    subscription_expiration_date?: string;
  };

  if (!username || !password || !full_name || !profession) {
    res.status(400).json({ error: 'username, password, full_name and profession are required' });
    return;
  }

  const email = `${username.toLowerCase().trim()}@dohot.app`;

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    res.status(400).json({ error: authError?.message ?? 'Failed to create auth user' });
    return;
  }

  const userId = authData.user.id;

  // Upsert profile — the handle_new_user trigger may have already inserted a
  // skeleton row, so we upsert to overwrite it with the full admin-supplied data.
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('business_profiles')
    .upsert({
      id: userId,
      username: username.toLowerCase().trim(),
      full_name,
      business_name: full_name,
      phone: phone ?? null,
      profession,
      role,
      subscription_expiration_date: subscription_expiration_date ?? null,
      is_active: true,
    })
    .select()
    .single();

  if (profileError) {
    // Roll back auth user if profile insert fails
    await supabaseAdmin.auth.admin.deleteUser(userId);
    res.status(500).json({ error: profileError.message });
    return;
  }

  res.status(201).json({ user: profile });
});

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────

adminRouter.delete('/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params as { id: string };

  if (id === req.userId) {
    res.status(400).json({ error: 'Cannot delete your own account' });
    return;
  }

  // Hard-delete the auth user; cascade removes business_profiles when FK is set.
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

  if (authError) {
    // Related documents block hard-delete — soft-delete the profile instead.
    const { error: softError } = await supabaseAdmin
      .from('business_profiles')
      .update({ is_active: false })
      .eq('id', id);
    if (softError) {
      res.status(500).json({ error: softError.message });
      return;
    }
    res.json({ deleted: true, soft: true });
    return;
  }

  // Belt-and-suspenders: remove profile row if no cascade was configured.
  await supabaseAdmin.from('business_profiles').delete().eq('id', id);

  res.json({ deleted: true });
});

// ─── PATCH /api/admin/users/:id ───────────────────────────────────────────────

adminRouter.patch('/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params as { id: string };
  const { full_name, phone, profession, role, subscription_expiration_date, is_active, password } = req.body as {
    full_name?: string;
    phone?: string;
    profession?: string;
    role?: 'admin' | 'technician';
    subscription_expiration_date?: string | null;
    is_active?: boolean;
    password?: string;
  };

  // Update password if provided
  if (password) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
  }

  const updates: Record<string, unknown> = {};
  if (full_name !== undefined) updates['full_name'] = full_name;
  if (phone !== undefined) updates['phone'] = phone;
  if (profession !== undefined) updates['profession'] = profession;
  if (role !== undefined) updates['role'] = role;
  if (subscription_expiration_date !== undefined) updates['subscription_expiration_date'] = subscription_expiration_date;
  if (is_active !== undefined) updates['is_active'] = is_active;

  if (Object.keys(updates).length === 0 && !password) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  if (Object.keys(updates).length > 0) {
    const { data, error } = await supabaseAdmin
      .from('business_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ user: data });
    return;
  }

  // Password-only update — return current profile
  const { data } = await supabaseAdmin
    .from('business_profiles')
    .select()
    .eq('id', id)
    .single();

  res.json({ user: data });
});
