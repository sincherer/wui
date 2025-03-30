import { supabase } from '../core/utils/supabase';

export async function publishToVercel(websiteId: string) {
  try {
    // Get website data from Supabase
    const { data: website, error: websiteError } = await supabase
      .from('websites')
      .select('*')
      .eq('id', websiteId)
      .single();

    if (websiteError) throw websiteError;

    // Get all pages for the website
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('*')
      .eq('website_id', websiteId);

    if (pagesError) throw pagesError;

    // Make API call to your deployment service
    const response = await fetch('/api/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        websiteId,
        website,
        pages,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to deploy website');
    }

    // Update website deployment status
    await supabase
      .from('websites')
      .update({ last_deployed: new Date().toISOString() })
      .eq('id', websiteId);

    return await response.json();
  } catch (error) {
    console.error('Error publishing to Vercel:', error);
    throw error;
  }
}