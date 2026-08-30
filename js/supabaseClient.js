/**
 * Supabase Client Initialization & Authentication Engine
 */

export const SUPABASE_URL = "https://tjoocmfpyzxvqgcfmcgr.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqb29jbWZweXp4dnFnY2ZtY2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMDkxMTUsImV4cCI6MjEwMzY4NTExNX0.XAT1JufbWRAtBDRXK7YGBhsOx5QyxJNEQ4fg9sNMICI";

let supabaseClient = null;

export function getSupabase() {
  if (supabaseClient) return supabaseClient;

  if (window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      return supabaseClient;
    } catch (e) {
      console.error('Error initializing Supabase client:', e);
    }
  }
  return null;
}

// Authentication Helpers
export async function getCurrentUser() {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data: { user } } = await sb.auth.getUser();
    return user;
  } catch (e) {
    console.error('Error getting current user:', e);
    return null;
  }
}

export async function signUpWithEmail(email, password) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase client not initialized');
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email, password) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase client not initialized');
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}

// Real-Time Group Sync Helpers
export async function syncGroupToSupabase(group) {
  const sb = getSupabase();
  if (!sb || !group || !group.id) return false;

  try {
    const { error } = await sb
      .from('contri_groups')
      .upsert({
        id: group.id,
        name: group.name,
        payload: group,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.warn('Supabase upsert notice:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Realtime sync fallback:', e);
    return false;
  }
}

export async function fetchGroupFromSupabase(groupId) {
  const sb = getSupabase();
  if (!sb || !groupId) return null;

  try {
    const { data, error } = await sb
      .from('contri_groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error || !data) return null;
    return data.payload;
  } catch (e) {
    console.warn('Error fetching group from Supabase:', e);
    return null;
  }
}

export function subscribeToGroupChanges(groupId, onUpdate) {
  const sb = getSupabase();
  if (!sb || !groupId) return null;

  try {
    const channel = sb
      .channel(`group-realtime-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contri_groups',
          filter: `id=eq.${groupId}`
        },
        (payload) => {
          if (payload.new && payload.new.payload) {
            onUpdate(payload.new.payload);
          }
        }
      )
      .subscribe();

    return channel;
  } catch (e) {
    console.warn('Realtime subscription notice:', e);
    return null;
  }
}
