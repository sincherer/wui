-- Create tables for the Supabase database

-- Users table (handled by Supabase Auth, extending with custom fields)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  role text check (role in ('admin', 'user')) default 'user',
  settings jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Websites table
create table public.websites (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  domain text,
  user_id uuid references public.profiles(id) on delete cascade not null,
  settings jsonb default '{}',
  published boolean default false,
  blocks jsonb default '[]',
  theme jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.websites enable row level security;

-- Create policies
create policy "Users can view their own websites."
  on websites for select
  using ( auth.uid() = user_id );

create policy "Users can create their own websites."
  on websites for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own websites."
  on websites for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own websites."
  on websites for delete
  using ( auth.uid() = user_id );

-- Domains table
create table public.domains (
  id uuid default uuid_generate_v4() primary key,
  domain text not null unique,
  website_id uuid references public.websites(id) on delete cascade not null,
  ssl_status text check (ssl_status in ('pending', 'active', 'failed')) default 'pending',
  status text check (status in ('active', 'inactive')) default 'inactive',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.domains enable row level security;

-- Create policies
create policy "Users can view their own domains."
  on domains for select
  using (
    website_id in (
      select id from websites
      where user_id = auth.uid()
    )
  );

create policy "Users can create domains for their websites."
  on domains for insert
  with check (
    website_id in (
      select id from websites
      where user_id = auth.uid()
    )
  );

create policy "Users can update their own domains."
  on domains for update
  using (
    website_id in (
      select id from websites
      where user_id = auth.uid()
    )
  );

create policy "Users can delete their own domains."
  on domains for delete
  using (
    website_id in (
      select id from websites
      where user_id = auth.uid()
    )
  );

-- Create functions and triggers for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Add triggers
create trigger handle_updated_at
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on public.websites
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on public.domains
  for each row
  execute procedure public.handle_updated_at();