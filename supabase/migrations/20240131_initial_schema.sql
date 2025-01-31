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