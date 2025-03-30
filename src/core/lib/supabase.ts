import { createClient } from '@supabase/supabase-js';

// Validate environment variables
if (!import.meta.env.VITE_PUBLIC_SUPABASE_URL || !import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variables: VITE_PUBLIC_SUPABASE_URL or VITE_PUBLIC_SUPABASE_ANON_KEY');
}

// Create a single Supabase client for interacting with your database
export const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
);

// Helper functions for database operations
export const getWebsites = async () => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('websites')
    .select('*')
    .eq('user_id', user.data.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getWebsiteById = async (id: string) => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('websites')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.data.user.id)
    .single();

  if (error) throw error;
  return data;
};

export const createWebsite = async (websiteData: any) => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');

  // Check if website with same name exists for this user
  const { data: existingWebsite } = await supabase
    .from('websites')
    .select('id')
    .eq('name', websiteData.name)
    .eq('user_id', user.data.user.id)
    .single();

  if (existingWebsite) {
    throw new Error('A website with this name already exists');
  }

  const { data, error } = await supabase
    .from('websites')
    .insert([{ ...websiteData, user_id: user.data.user.id }])
    .select();

  if (error) {
    if (error.code === '23505') { // PostgreSQL unique constraint violation
      throw new Error('A website with this name already exists');
    }
    throw error;
  }
  return data[0];
};

export const updateWebsite = async (id: string, updates: any) => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('websites')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.data.user.id)
    .select();

  if (error) throw error;
  return data[0];
};

export const deleteWebsite = async (id: string) => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('websites')
    .delete()
    .eq('id', id)
    .eq('user_id', user.data.user.id);

  if (error) throw error;
  return true;
};