import { Router, type Request, type Response, type NextFunction } from 'express';
import { supabaseAdmin, getUserFromToken } from '../lib/supabase';
import { logger } from '../lib/logger';

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

function startOfServerDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isValidUsername(username: string) {
  return username.length >= 3 && username.length <= 50 && /^[a-z0-9_.-]+$/.test(username);
}

function normalizeUsernameInput(value: unknown) {
  if (typeof value !== 'string') return null;
  return value.trim().toLowerCase();
}

async function findProfileByUsername(username: string) {
  return supabaseAdmin
    .from('business_profiles')
    .select('id, username, full_name, phone, profession, role, subscription_expiration_date, is_active, created_at, updated_at')
    .eq('username', username)
    .maybeSingle();
}

// ─── requireAdmin middleware ──────────────────────────────────────────────────

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    logger.warn({ method: req.method, path: req.path }, 'Admin auth failed: missing Authorization header');
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }
  const token = header.slice(7);
  const user = await getUserFromToken(token);
  if (!user) {
    logger.warn({ method: req.method, path: req.path }, 'Admin auth failed: invalid or expired token');
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  const { data } = await supabaseAdmin
    .from('business_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (data?.role !== 'admin') {
    logger.warn({ userId: user.id, role: data?.role, path: req.path }, 'Admin auth failed: insufficient role');
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

// ─── GET /api/admin/today ─────────────────────────────────────────────────────

adminRouter.get('/today', requireAdmin, async (_req, res) => {
  const now = new Date();
  const todayStart = startOfServerDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const date = toDateOnlyString(todayStart);

  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .select('username, full_name, profession, role, created_at')
    .gte('created_at', todayStart.toISOString())
    .lt('created_at', tomorrowStart.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const users = data ?? [];
  res.json({
    date,
    count: users.length,
    users,
  });
});

// ─── GET /api/admin/analytics ─────────────────────────────────────────────────

adminRouter.get('/analytics', requireAdmin, async (_req, res) => {
  const now = new Date();
  const last7DaysStart = addDays(now, -7).toISOString();
  const monthStart = startOfCurrentMonth(now).toISOString();

  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .select('profession, role, is_active, created_at');

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const analytics = (data ?? []).reduce(
    (acc, profile) => {
      if (profile.profession) {
        acc.byProfession[profile.profession] = (acc.byProfession[profile.profession] ?? 0) + 1;
      }
      if (profile.role) {
        acc.byRole[profile.role] = (acc.byRole[profile.role] ?? 0) + 1;
      }
      if (profile.is_active === true) acc.byActiveStatus.active += 1;
      if (profile.is_active === false) acc.byActiveStatus.inactive += 1;
      if (profile.created_at && profile.created_at >= last7DaysStart) acc.newUsersLast7Days += 1;
      if (profile.created_at && profile.created_at >= monthStart) acc.newUsersThisMonth += 1;

      return acc;
    },
    {
      byProfession: {} as Record<string, number>,
      byRole: {} as Record<string, number>,
      byActiveStatus: {
        active: 0,
        inactive: 0,
      },
      newUsersLast7Days: 0,
      newUsersThisMonth: 0,
    },
  );

  res.json(analytics);
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

// ─── GET /api/admin/users/find?username=<username> ────────────────────────────

adminRouter.get('/users/find', requireAdmin, async (req, res) => {
  const rawUsername = Array.isArray(req.query.username) ? req.query.username[0] : req.query.username;
  logger.info({ rawUsername }, 'Admin: received username query param');

  const searchTerm = normalizeUsernameInput(rawUsername);
  logger.info({ searchTerm }, 'Admin: normalized search term');

  if (!searchTerm) {
    res.status(400).json({ error: 'username is required' });
    return;
  }

  if (searchTerm.length < 2) {
    res.status(400).json({ error: 'Search term must be at least 2 characters' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .select('id, username, full_name, phone, profession, role, subscription_expiration_date, is_active, created_at, updated_at')
    .ilike('username', `%${searchTerm}%`)
    .limit(10);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const users = data ?? [];
  logger.info({ count: users.length, searchTerm }, 'Admin: number of users found');

  res.json({ users });
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

  logger.info({ username: username.toLowerCase().trim(), role, profession }, 'Admin: creating user');

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    logger.error({ err: authError, username }, 'Admin: auth user creation failed');
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
    logger.error({ err: profileError, username, userId }, 'Admin: profile upsert failed, auth user rolled back');
    res.status(500).json({ error: profileError.message });
    return;
  }

  logger.info({ username: username.toLowerCase().trim(), userId, role, profession }, 'Admin: user created');
  res.status(201).json({ user: profile });
});

// ─── PATCH /api/admin/users/:username/extend ──────────────────────────────────

adminRouter.patch('/users/:username/extend', requireAdmin, async (req, res) => {
  const username = normalizeUsernameInput(req.params['username']);
  const rawDays = (req.body as { days?: unknown }).days;

  if (!username || !isValidUsername(username)) {
    res.status(400).json({ error: 'Invalid username' });
    return;
  }

  if (typeof rawDays !== 'number' || !Number.isInteger(rawDays) || rawDays < 1 || rawDays > 365) {
    res.status(400).json({ error: 'days must be an integer between 1 and 365' });
    return;
  }

  const days = rawDays;

  const { data: user, error: findError } = await findProfileByUsername(username);

  if (findError) {
    res.status(500).json({ error: findError.message });
    return;
  }

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const today = toDateOnlyString(new Date());
  const baseDate = user.subscription_expiration_date && user.subscription_expiration_date >= today
    ? new Date(`${user.subscription_expiration_date}T00:00:00.000Z`)
    : new Date(`${today}T00:00:00.000Z`);
  const subscription_expiration_date = toDateOnlyString(addDays(baseDate, days));

  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .update({ subscription_expiration_date })
    .eq('username', username)
    .select('username, full_name, subscription_expiration_date, is_active')
    .single();

  if (error) {
    logger.error({ err: error, username }, 'Admin: subscription extend DB update failed');
    res.status(500).json({ error: error.message });
    return;
  }

  logger.info({ username, addedDays: days, newExpiration: subscription_expiration_date }, 'Admin: subscription extended');
  res.json({
    user: data,
    addedDays: days,
  });
});

// ─── PATCH /api/admin/users/:username/disable ─────────────────────────────────

adminRouter.patch('/users/:username/disable', requireAdmin, async (req, res) => {
  const username = normalizeUsernameInput(req.params['username']);

  if (!username || !isValidUsername(username)) {
    res.status(400).json({ error: 'Invalid username' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .update({ is_active: false })
    .eq('username', username)
    .select('username, full_name, is_active')
    .maybeSingle();

  if (error) {
    logger.error({ err: error, username }, 'Admin: user disable DB update failed');
    res.status(500).json({ error: error.message });
    return;
  }

  if (!data) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  logger.info({ username }, 'Admin: user disabled');
  res.json({ user: data });
});

// ─── PATCH /api/admin/users/:username/activate ────────────────────────────────

adminRouter.patch('/users/:username/activate', requireAdmin, async (req, res) => {
  const username = normalizeUsernameInput(req.params['username']);

  if (!username || !isValidUsername(username)) {
    res.status(400).json({ error: 'Invalid username' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .update({ is_active: true })
    .eq('username', username)
    .select('username, full_name, is_active')
    .maybeSingle();

  if (error) {
    logger.error({ err: error, username }, 'Admin: user activate DB update failed');
    res.status(500).json({ error: error.message });
    return;
  }

  if (!data) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  logger.info({ username }, 'Admin: user activated');
  res.json({ user: data });
});

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────

adminRouter.delete('/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params as { id: string };

  if (id === req.userId) {
    res.status(400).json({ error: 'Cannot delete your own account' });
    return;
  }

  logger.info({ targetUserId: id }, 'Admin: deleting user');

  // Hard-delete the auth user; cascade removes business_profiles when FK is set.
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

  if (authError) {
    // Related documents block hard-delete — soft-delete the profile instead.
    logger.warn({ err: authError, targetUserId: id }, 'Admin: hard delete failed, falling back to soft delete');
    const { error: softError } = await supabaseAdmin
      .from('business_profiles')
      .update({ is_active: false })
      .eq('id', id);
    if (softError) {
      logger.error({ err: softError, targetUserId: id }, 'Admin: soft delete also failed');
      res.status(500).json({ error: softError.message });
      return;
    }
    logger.info({ targetUserId: id }, 'Admin: user soft-deleted');
    res.json({ deleted: true, soft: true });
    return;
  }

  // Belt-and-suspenders: remove profile row if no cascade was configured.
  await supabaseAdmin.from('business_profiles').delete().eq('id', id);

  logger.info({ targetUserId: id }, 'Admin: user hard-deleted');
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
