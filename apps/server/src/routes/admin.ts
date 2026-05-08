import { Router, type Request, type Response, type NextFunction } from 'express';
import { supabaseAdmin, getUserFromToken } from '../lib/supabase';

export const adminRouter = Router();

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
