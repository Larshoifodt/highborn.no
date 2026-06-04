-- Kjør dette i Supabase SQL Editor (supabase.com → ditt prosjekt → SQL Editor)
-- Trygt å kjøre selv om tabellen og policies allerede finnes

create table if not exists tasks (
  id           uuid default gen_random_uuid() primary key,
  title        text not null,
  description  text,
  submitted_by text,
  label        text default '',
  starred      boolean default false,
  matrix_x     float,
  matrix_y     float,
  created_at   timestamptz default now()
);

alter table tasks add column if not exists label        text default '';
alter table tasks add column if not exists starred      boolean default false;
alter table tasks add column if not exists matrix_x     float;
alter table tasks add column if not exists matrix_y     float;

alter table tasks enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='tasks' and policyname='Alle kan lese') then
    create policy "Alle kan lese"  on tasks for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='tasks' and policyname='Alle kan sende') then
    create policy "Alle kan sende" on tasks for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='tasks' and policyname='Alle kan endre') then
    create policy "Alle kan endre" on tasks for update using (true);
  end if;
end $$;
