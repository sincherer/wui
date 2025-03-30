import { createClient, User } from '@supabase/supabase-js';

// Validate environment variables
if (!import.meta.env.VITE_PUBLIC_SUPABASE_URL || !import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variables: VITE_PUBLIC_SUPABASE_URL or VITE_PUBLIC_SUPABASE_ANON_KEY');
}

// Create a single Supabase client for interacting with your database
export const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
);

// Authentication functions
export const signUpWithEmail = async (
    email: string,
    password: string,
    p0: { role: string }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: p0, // Include metadata (e.g., role)
      },
    });
    if (error) throw error;
    return data;
  };

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper functions for database operations
export const getWebsites = async () => {
  const { data, error } = await supabase
    .from('websites')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getWebsiteById = async (id: string) => {
  const { data, error } = await supabase
    .from('websites')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createWebsite = async (websiteData: any) => {
  const { data, error } = await supabase
    .from('websites')
    .insert([websiteData])
    .select();

  if (error) throw error;
  return data[0];
};

export const updateWebsite = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('websites')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
};

export const deleteWebsite = async (id: string) => {
  const { error } = await supabase
    .from('websites')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

// Page-related helper functions
export const getPages = async (websiteId: string) => {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('website_id', websiteId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

export const createPage = async (pageData: any) => {
  const { data, error } = await supabase
    .from('pages')
    .insert([pageData])
    .select();

  if (error) throw error;
  return data[0];
};

export const updatePage = async (pageId: string, updates: any) => {
  const { data, error } = await supabase
    .from('pages')
    .update(updates)
    .eq('id', pageId)
    .select();

  if (error) throw error;
  return data[0];
};

export const deletePage = async (pageId: string, websiteId: string) => {
  const { error } = await supabase
    .from('pages')
    .delete()
    .eq('id', pageId)
    .eq('website_id', websiteId);

  if (error) throw error;
  return true;
};