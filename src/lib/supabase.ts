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
