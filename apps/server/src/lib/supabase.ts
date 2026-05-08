import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Service role key has full access, bypasses RLS.
// NEVER expose this to the client. Use only on the server.
export const supabaseAdmin = createClient(
  process.env['SUPABASE_URL']!,
  process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

/**
 * Verify a user JWT from an incoming request and return the user.
 * Use this in route middleware to authenticate API calls from the mobile app.
 */
export async function getUserFromToken(bearerToken: string) {
  const { data, error } = await supabaseAdmin.auth.getUser(bearerToken);
  if (error || !data.user) return null;
  return data.user;
}
