-- Run once in Supabase → SQL Editor (or via Supabase CLI migration)

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  category text not null default 'Policy analysis',
  body text not null,
  author text not null default 'Naru Desk',
  read_time text not null default '8 min read',
  thumbnail text,
  thumbnail_alt text,
  featured boolean not null default false,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_published_at_idx
  on public.articles (published_at desc nulls last);

create or replace function public.set_articles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists articles_updated_at on public.articles;
create trigger articles_updated_at
  before update on public.articles
  for each row execute function public.set_articles_updated_at();

alter table public.articles enable row level security;

drop policy if exists "Public read published articles" on public.articles;
create policy "Public read published articles"
  on public.articles
  for select
  to anon, authenticated
  using (published = true);

-- Optional: allow authenticated users to manage articles via Supabase Studio (service role bypasses RLS)
