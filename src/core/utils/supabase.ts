import { createClient } from '@supabase/supabase-js';

// Validate environment variables
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create a single Supabase client for interacting with your database
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface PageData {
  id: string;
  name: string;
  blocks: any[];
  website_id?: string;
  created_at?: string;
  updated_at?: string;
}

export const savePageData = async (pageData: PageData) => {
  const { data, error } = await supabase
    .from('pages')
    .upsert({
      id: pageData.id,
      name: pageData.name,
      blocks: pageData.blocks,
      updated_at: new Date().toISOString()
    })
    .select();

  if (error) throw error;
  return data;
};

export const getPages = async () => {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as PageData[];
};