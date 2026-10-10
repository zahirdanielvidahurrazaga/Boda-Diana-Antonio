import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export type Photo = {
  id: string;
  created_at: string;
  url: string;
  guest_name: string;
  event_id: string;
  width?: number;
  height?: number;
  message?: string | null;
};

export type PhotoLike = {
  id: string;
  photo_id: string;
  guest_key: string;
  /** La reacción; el corazón es '❤️' */
  emoji?: string;
  created_at: string;
};

/**
 * Identificador anónimo y estable de este dispositivo.
 * Sirve para que cada invitado pueda dar un solo corazón por foto
 * y quitarlo si se arrepiente — sin pedirle que se registre.
 */
export function getGuestKey(): string {
  const KEY = 'guest_key';
  let key = localStorage.getItem(KEY);
  if (!key) {
    key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(KEY, key);
  }
  return key;
}

const PAGINA = 1000; // tope de filas por consulta de la API de Supabase

/**
 * TODAS las fotos, de la más nueva a la más vieja, de 1,000 en 1,000.
 * Devuelve null si falla la red (para conservar lo que ya se veía).
 */
export async function traerFotos(): Promise<Photo[] | null> {
  // Por id: si alguien sube mientras se pagina, una fila puede repetirse entre páginas.
  const todas = new Map<string, Photo>();
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await supabase.from('photos').select('*')
      .order('created_at', { ascending: false }).order('id')
      .range(desde, desde + PAGINA - 1);
    if (error) return null;
    for (const f of data ?? []) todas.set(f.id, f);
    if (!data || data.length < PAGINA) return [...todas.values()];
  }
}

/** Todas las reacciones (solo foto y emoji), de 1,000 en 1,000. null si falla. */
export async function traerReacciones(): Promise<{ photo_id: string; emoji: string }[] | null> {
  const todas = new Map<string, { photo_id: string; emoji: string }>();
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await supabase.from('photo_likes').select('id, photo_id, emoji')
      .order('id').range(desde, desde + PAGINA - 1);
    if (error) return null;
    for (const r of data ?? []) todas.set(r.id, r);
    if (!data || data.length < PAGINA) return [...todas.values()];
  }
}

/** Ruta del archivo dentro del bucket a partir de su URL pública. */
export function rutaEnBucket(url: string, bucket: string): string | null {
  const marca = `/object/public/${bucket}/`;
  const i = url.indexOf(marca);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marca.length).split('?')[0]);
}
