import axios from 'axios';

async function createVercelDeployment(websiteId: string, pages: any[]) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error('VERCEL_TOKEN is not configured');
  }

  const response = await axios.post(
    'https://api.vercel.com/v13/deployments',
    {
      name: `deployment-${Date.now()}`,
      files: pages.map(page => ({
        file: `pages/${page.name}.html`,
        data: generatePageHtml(page),
      })),
      projectId: websiteId,
      target: 'production',
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const deployment = response.data;
  return {
    url: deployment.url,
    id: deployment.id,
  };
}

import type { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { websiteId, pages } = req.body;

    const deployment = await createVercelDeployment(websiteId, pages);

    return res.status(200).json({ 
      success: true, 
      deploymentUrl: deployment.url 
    });
  } catch (error) {
    console.error('Deployment error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to deploy website' 
    });
  }
}

// Helper function to generate HTML for each page
function generatePageHtml(page: any) {
  // Implement your HTML generation logic here
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${page.name}</title>
      </head>
      <body>
        ${JSON.stringify(page.blocks)}
      </body>
    </html>
  `;
}