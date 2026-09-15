create table if not exists public.music_tracks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  audio_url text not null,
  status text not null default 'pending_review' check (status in ('pending_review', 'published', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.users add column if not exists wallet_network text;

alter table public.music_tracks enable row level security;
create policy "Artists can view their own tracks" on public.music_tracks
  for select using (auth.uid() = artist_id);
create policy "Artists can submit their own tracks" on public.music_tracks
  for insert with check (auth.uid() = artist_id);
