-- Create eco_tasks table
create table if not exists public.eco_tasks (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text not null,
    points integer not null check (points >= 1 and points <= 100),
    completed boolean default false,
    user_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.eco_tasks enable row level security;

-- Create policies
create policy "Users can view their own tasks"
    on public.eco_tasks for select
    using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
    on public.eco_tasks for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
    on public.eco_tasks for update
    using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger handle_eco_tasks_updated_at
    before update on public.eco_tasks
    for each row
    execute function public.handle_updated_at();

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  total_recycled_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_co2_saved_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Create recycling_data table
CREATE TABLE public.recycling_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  material_type TEXT NOT NULL CHECK (material_type IN ('plastic', 'paper', 'glass', 'metal')),
  weight_kg DECIMAL(10,2) NOT NULL CHECK (weight_kg > 0),
  co2_saved_kg DECIMAL(10,2) NOT NULL CHECK (co2_saved_kg >= 0)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recycling_data ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for recycling_data
CREATE POLICY "Users can view own recycling data"
  ON public.recycling_data
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recycling data"
  ON public.recycling_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recycling data"
  ON public.recycling_data
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recycling data"
  ON public.recycling_data
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update profile totals
CREATE OR REPLACE FUNCTION public.update_profile_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET 
      total_recycled_kg = total_recycled_kg + NEW.weight_kg,
      total_co2_saved_kg = total_co2_saved_kg + NEW.co2_saved_kg
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET 
      total_recycled_kg = total_recycled_kg - OLD.weight_kg,
      total_co2_saved_kg = total_co2_saved_kg - OLD.co2_saved_kg
    WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for updating profile totals
CREATE TRIGGER on_recycling_data_inserted
  AFTER INSERT ON public.recycling_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_totals();

CREATE TRIGGER on_recycling_data_deleted
  AFTER DELETE ON public.recycling_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_totals(); 