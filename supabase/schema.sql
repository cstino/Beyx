-- BeyManager X Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  xp integer default 0,
  level integer default 1,
  avatar_url text,
  created_at timestamptz default now()
);

-- Blades table (Base Parts)
create table public.blades (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null, -- Attack, Defense, Stamina, Balance
  weight numeric not null,
  tier text check (tier in ('S', 'A', 'B', 'C', 'D')),
  description text,
  image_url text,
  created_at timestamptz default now()
);

-- Ratchets table
create table public.ratchets (
  id uuid default uuid_generate_v4() primary key,
  name text not null, -- e.g., "9-60"
  sides integer not null,
  height integer not null,
  created_at timestamptz default now()
);

-- Bits table
create table public.bits (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null,
  tip_shape text,
  created_at timestamptz default now()
);

-- User Collections (Owned parts)
create table public.user_collections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  part_type text not null, -- 'blade', 'ratchet', 'bit'
  part_id uuid not null,
  added_at timestamptz default now()
);

-- Combos table
create table public.combos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  blade_id uuid references public.blades(id),
  ratchet_id uuid references public.ratchets(id),
  bit_id uuid references public.bits(id),
  is_favorite boolean default false,
  created_at timestamptz default now()
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.blades enable row level security;
alter table public.ratchets enable row level security;
alter table public.bits enable row level security;
alter table public.user_collections enable row level security;
alter table public.combos enable row level security;

-- Public tables (read only for all)
create policy "Allow public read on parts" on public.blades for select using (true);
create policy "Allow public read on ratchets" on public.ratchets for select using (true);
create policy "Allow public read on bits" on public.bits for select using (true);

-- User specific tables
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can view their own collection" on public.user_collections for select using (auth.uid() = user_id);
create policy "Users can manage their own collection" on public.user_collections for all using (auth.uid() = user_id);

create policy "Users can view their own combos" on public.combos for select using (auth.uid() = user_id);
create policy "Users can manage their own combos" on public.combos for all using (auth.uid() = user_id);
