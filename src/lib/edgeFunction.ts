import { supabase } from '@/integrations/supabase/client';

/**
 * Call a Supabase edge function using direct fetch.
 * Bypasses supabase.functions.invoke() which sends an apikey header
 * that's incompatible with newer Supabase projects using ES256 JWTs.
 */
export async function invokeEdgeFunction(
  functionName: string,
  body: Record<string, unknown>,
  options?: { requireAuth?: boolean }
): Promise<{ data: any; error: any }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${anonKey}`,
  };

  if (options?.requireAuth !== false) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  }

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return { data, error: new Error(data.error || `Error ${res.status}`) };
    }
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}
