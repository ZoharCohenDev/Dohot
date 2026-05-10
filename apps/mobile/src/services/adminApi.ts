import { supabase } from '@/lib/supabase';
import type { Profession, UserRole } from '@dohot/shared';

const SERVER_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000';

export interface AdminUser {
  id: string;
  username: string;
  full_name: string;
  phone: string | null;
  profession: Profession;
  role: UserRole;
  subscription_expiration_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateUserInput {
  username: string;
  password: string;
  full_name: string;
  phone?: string;
  profession: Profession;
  role: UserRole;
  subscription_expiration_date?: string;
}

export interface UpdateUserInput {
  full_name?: string;
  phone?: string;
  profession?: Profession;
  role?: UserRole;
  subscription_expiration_date?: string | null;
  is_active?: boolean;
  password?: string;
}

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${data.session?.access_token ?? ''}`,
    'Content-Type': 'application/json',
  };
}

export async function adminListUsers(): Promise<AdminUser[]> {
  const headers = await authHeaders();
  const res = await fetch(`${SERVER_URL}/api/admin/users`, { headers });
  const json = await res.json() as { users?: AdminUser[]; error?: string };
  if (!res.ok) throw new Error(json.error ?? 'Failed to load users');
  return json.users ?? [];
}

export async function adminCreateUser(input: CreateUserInput): Promise<AdminUser> {
  const headers = await authHeaders();
  const res = await fetch(`${SERVER_URL}/api/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  const json = await res.json() as { user?: AdminUser; error?: string };
  if (!res.ok) throw new Error(json.error ?? 'Failed to create user');
  return json.user!;
}

export async function adminDeleteUser(id: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${SERVER_URL}/api/admin/users/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const json = await res.json() as { error?: string };
    throw new Error(json.error ?? 'Failed to delete user');
  }
}

export async function adminUpdateUser(id: string, input: UpdateUserInput): Promise<AdminUser> {
  const headers = await authHeaders();
  const res = await fetch(`${SERVER_URL}/api/admin/users/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(input),
  });
  const json = await res.json() as { user?: AdminUser; error?: string };
  if (!res.ok) throw new Error(json.error ?? 'Failed to update user');
  return json.user!;
}
