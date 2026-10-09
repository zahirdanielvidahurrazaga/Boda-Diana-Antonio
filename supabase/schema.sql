-- ============================================================
--  Galería de la boda de Diana & Antonio — 17 oct 2026
--  Pegar completo en el SQL Editor de Supabase. Es idempotente:
--  se puede volver a correr sin romper nada.
-- ============================================================

-- ─────────────────────────── FOTOS ───────────────────────────
create table if not exists public.photos (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  url         text not null,
  guest_name  text not null,
  event_id    text not null default 'diana-antonio-boda-2026',
  width       int,
  height      int,
  message     text
);

create index if not exists photos_created_at_idx on public.photos (created_at desc);

alter table public.photos enable row level security;

-- La galería es pública a propósito: los invitados no se registran,
-- entran escaneando el QR de la mesa.
drop policy if exists "photos_select_all" on public.photos;
create policy "photos_select_all" on public.photos for select using (true);

drop policy if exists "photos_insert_all" on public.photos;
create policy "photos_insert_all" on public.photos for insert with check (true);

-- Necesario para el panel de administración (/#admin), que corre en el navegador.
drop policy if exists "photos_delete_all" on public.photos;
create policy "photos_delete_all" on public.photos for delete using (true);


-- ────────────────────────── CORAZONES ─────────────────────────
create table if not exists public.photo_likes (
  id          uuid primary key default gen_random_uuid(),
  photo_id    uuid not null references public.photos(id) on delete cascade,
  guest_key   text not null,
  created_at  timestamptz not null default now(),
  unique (photo_id, guest_key)          -- un corazón por invitado por foto
);

create index if not exists photo_likes_photo_id_idx on public.photo_likes (photo_id);

-- Sin esto, el aviso de DELETE en tiempo real llega sin photo_id
-- y los contadores no bajarían al quitar un corazón.
alter table public.photo_likes replica identity full;

alter table public.photo_likes enable row level security;

drop policy if exists "likes_select_all" on public.photo_likes;
create policy "likes_select_all" on public.photo_likes for select using (true);

drop policy if exists "likes_insert_all" on public.photo_likes;
create policy "likes_insert_all" on public.photo_likes for insert with check (true);

drop policy if exists "likes_delete_all" on public.photo_likes;
create policy "likes_delete_all" on public.photo_likes for delete using (true);


-- ────────────────────────── TIEMPO REAL ───────────────────────
-- Para que las fotos y los corazones aparezcan solos, sin recargar.
do $$
begin
  begin
    alter publication supabase_realtime add table public.photos;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.photo_likes;
  exception when duplicate_object then null;
  end;
end $$;


-- ──────────────────────────── STORAGE ─────────────────────────
insert into storage.buckets (id, name, public)
values ('boda-photos', 'boda-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "communion_read" on storage.objects;
create policy "communion_read" on storage.objects
  for select using (bucket_id = 'boda-photos');

drop policy if exists "communion_write" on storage.objects;
create policy "communion_write" on storage.objects
  for insert with check (bucket_id = 'boda-photos');

drop policy if exists "communion_delete" on storage.objects;
create policy "communion_delete" on storage.objects
  for delete using (bucket_id = 'boda-photos');


-- ───────────────────── REACCIONES (como historia de IG) ─────────────────────
-- photo_likes guarda TODAS las reacciones: el corazón es simplemente el emoji
-- '❤️'. Cada invitado puede dar cada emoji una vez por foto (y quitarlo).
alter table public.photo_likes add column if not exists emoji text not null default '❤️';

-- Antes era un corazón por invitado por foto; ahora uno por EMOJI.
alter table public.photo_likes drop constraint if exists photo_likes_photo_id_guest_key_key;
create unique index if not exists photo_likes_una_por_emoji on public.photo_likes (photo_id, guest_key, emoji);

-- Solo los emojis de la barra (que nadie meta texto cualquiera con la llave pública).
alter table public.photo_likes drop constraint if exists photo_likes_emoji_valido;
alter table public.photo_likes add constraint photo_likes_emoji_valido
  check (emoji in ('❤️', '😍', '🥹', '😂', '👏', '🔥', '🥂', '💃'));
