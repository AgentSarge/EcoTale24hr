-- Create company_profiles table
create table if not exists public.company_profiles (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    industry text not null,
    region text not null,
    recycling_rate numeric(5,2) default 0 check (recycling_rate >= 0 and recycling_rate <= 100),
    co2_saved numeric(10,2) default 0,
    top_recycled_product text,
    competitor_alerts jsonb default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references auth.users(id) on delete cascade not null unique
);

-- Create sustainability_goals table
create table if not exists public.sustainability_goals (
    id uuid default gen_random_uuid() primary key,
    company_id uuid references public.company_profiles(id) on delete cascade not null,
    title text not null,
    target_date timestamp with time zone not null,
    target_value numeric(10,2) not null,
    current_value numeric(10,2) default 0,
    metric text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create recycling_events table for tracking individual recycling activities
create table if not exists public.recycling_events (
    id uuid default gen_random_uuid() primary key,
    company_id uuid references public.company_profiles(id) on delete cascade not null,
    material_type text not null,
    weight numeric(10,2) not null,
    location point,
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create competitor_alerts table
create table if not exists public.competitor_alerts (
    id uuid default gen_random_uuid() primary key,
    company_id uuid references public.company_profiles(id) on delete cascade not null,
    competitor_name text not null,
    alert_type text not null,
    description text not null,
    region text not null,
    severity text not null,
    is_resolved boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    resolved_at timestamp with time zone
);

-- Create audit_logs table for compliance
create table if not exists public.audit_logs (
    id uuid default gen_random_uuid() primary key,
    company_id uuid references public.company_profiles(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    action text not null,
    details jsonb not null,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.company_profiles enable row level security;
alter table public.sustainability_goals enable row level security;
alter table public.recycling_events enable row level security;
alter table public.competitor_alerts enable row level security;
alter table public.audit_logs enable row level security;

-- Create policies
create policy "Users can view their own company profile"
    on public.company_profiles for select
    using (auth.uid() = user_id);

create policy "Users can update their own company profile"
    on public.company_profiles for update
    using (auth.uid() = user_id);

create policy "Users can view their company's sustainability goals"
    on public.sustainability_goals for select
    using (exists (
        select 1 from public.company_profiles
        where id = sustainability_goals.company_id
        and user_id = auth.uid()
    ));

create policy "Users can manage their company's sustainability goals"
    on public.sustainability_goals for all
    using (exists (
        select 1 from public.company_profiles
        where id = sustainability_goals.company_id
        and user_id = auth.uid()
    ));

create policy "Users can view their company's recycling events"
    on public.recycling_events for select
    using (exists (
        select 1 from public.company_profiles
        where id = recycling_events.company_id
        and user_id = auth.uid()
    ));

create policy "Users can view their company's competitor alerts"
    on public.competitor_alerts for select
    using (exists (
        select 1 from public.company_profiles
        where id = competitor_alerts.company_id
        and user_id = auth.uid()
    ));

create policy "Users can view their company's audit logs"
    on public.audit_logs for select
    using (exists (
        select 1 from public.company_profiles
        where id = audit_logs.company_id
        and user_id = auth.uid()
    ));

-- Create functions for audit logging
create or replace function public.create_audit_log()
returns trigger as $$
begin
    insert into public.audit_logs (
        company_id,
        user_id,
        action,
        details,
        ip_address,
        user_agent
    ) values (
        NEW.company_id,
        auth.uid(),
        TG_OP,
        row_to_json(NEW),
        inet_client_addr(),
        current_setting('request.headers')::json->>'user-agent'
    );
    return NEW;
end;
$$ language plpgsql security definer;

-- Create triggers for audit logging
create trigger audit_sustainability_goals
    after insert or update or delete on public.sustainability_goals
    for each row execute function public.create_audit_log();

create trigger audit_recycling_events
    after insert or update or delete on public.recycling_events
    for each row execute function public.create_audit_log();

create trigger audit_competitor_alerts
    after insert or update or delete on public.competitor_alerts
    for each row execute function public.create_audit_log(); 