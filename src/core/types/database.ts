export interface Website {
  id: string;
  name: string;
  domain?: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
  settings?: Record<string, any>;
  published: boolean;
  blocks?: any[];
  theme?: any;
}

export interface User {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  role: 'admin' | 'user';
  settings?: Record<string, any>;
}

export interface Domain {
  id: string;
  domain: string;
  website_id: string;
  ssl_status?: 'pending' | 'active' | 'failed';
  created_at: string;
  updated_at?: string;
  status: 'active' | 'inactive';
}

export interface Pages {
  id: string;
  name: string;
  blocks: string;
  website_id: string;
  created_at: string;
  updated_at?: string;
}