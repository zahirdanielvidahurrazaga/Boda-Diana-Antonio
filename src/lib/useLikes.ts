import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { supabase, getGuestKey, type PhotoLike } from './supabase';

/** Las reacciones de la barra, como las de una historia de Instagram. El corazón va primero. */
export const EMOJIS = ['❤️', '😍', '🥹', '😂', '👏', '🔥', '🥂', '💃'] as const;
export const CORAZON = '❤️';

type Fila = { id: string; photo_id: string; guest_key: string; emoji: string };
type Conteo = Record<string, Record<string, number>>; // foto → emoji → cuántas
type Mias = Record<string, Set<string>>;              // foto → emojis que di yo

const clave = (foto: string, emoji: string) => `${foto}|${emoji}`;
const PAGINA = 1000; // tope de filas por consulta de la API de Supabase

/**
 * Reacciones de las fotos (el corazón es una más: el emoji '❤️').
 *
 * Cada invitado puede dar cada emoji una vez por foto y quitarlo. No hace falta
 * que se registre: se le asigna una llave anónima guardada en su teléfono.
 *
 * Cómo se mantiene al día sin desfasarse (revisión de Codex, 9-oct):
 *  · Todo se guarda como FILAS por id (no contadores sueltos): un INSERT que
 *    llega por tiempo real y la misma fila en una recarga no se cuentan doble.
 *  · Los borrados se resuelven por id: con RLS activado, Supabase manda en el
 *    aviso de DELETE solo la llave primaria (sin photo_id ni emoji).
 *  · Lo mío se pinta al instante como "pendiente" y se vuelve fila real cuando
 *    la base responde; si falla, el pendiente se descarta.
 *  · Mientras una reacción está en camino, otro toque a la MISMA se ignora (así
 *    dar y quitar muy rápido no se guarda al revés).
 *  · La carga pagina de 1,000 en 1,000.
 */
export function useLikes() {
  const [filas, setFilas] = useState<Map<string, Fila>>(new Map());
  // Intención local mientras la base responde: true = dando, false = quitando.
  const [pendientes, setPendientes] = useState<Map<string, boolean>>(new Map());
  const enCamino = useRef<Set<string>>(new Set());
  const guestKey = useRef(getGuestKey());

  const fetchLikes = useCallback(async () => {
    const todas = new Map<string, Fila>();
    for (let desde = 0; ; desde += PAGINA) {
      const { data, error } = await supabase.from('photo_likes')
        .select('id, photo_id, guest_key, emoji').order('id').range(desde, desde + PAGINA - 1);
      if (error) return; // sin red: se queda lo que había
      for (const r of data ?? []) todas.set(r.id, { ...r, emoji: r.emoji || CORAZON });
      if (!data || data.length < PAGINA) break;
    }
    setFilas(todas);
  }, []);

  useEffect(() => {
    fetchLikes();

    const channel = supabase
      .channel('realtime:photo_likes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photo_likes' }, payload => {
        const r = payload.new as PhotoLike;
        setFilas(prev => {
          if (prev.has(r.id)) return prev;
          const next = new Map(prev);
          next.set(r.id, { id: r.id, photo_id: r.photo_id, guest_key: r.guest_key, emoji: r.emoji || CORAZON });
          return next;
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'photo_likes' }, payload => {
        const id = (payload.old as Partial<PhotoLike>).id;
        if (!id) { fetchLikes(); return; }
        setFilas(prev => {
          if (!prev.has(id)) return prev;
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      })
      .subscribe();

    // Red de seguridad por si el realtime se cae en medio de la fiesta
    const poll = setInterval(fetchLikes, 45_000);
    const onVisible = () => { if (!document.hidden) fetchLikes(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchLikes]);

  // Conteos y "las mías" salen de las filas + lo pendiente.
  const { reacciones, mias } = useMemo(() => {
    const conteo: Conteo = {};
    const propias: Mias = {};
    for (const f of filas.values()) {
      (conteo[f.photo_id] ??= {})[f.emoji] = (conteo[f.photo_id]?.[f.emoji] ?? 0) + 1;
      if (f.guest_key === guestKey.current) (propias[f.photo_id] ??= new Set()).add(f.emoji);
    }
    for (const [k, dando] of pendientes) {
      const [foto, emoji] = k.split('|');
      const ya = propias[foto]?.has(emoji) ?? false;
      if (dando && !ya) {
        (conteo[foto] ??= {})[emoji] = (conteo[foto]?.[emoji] ?? 0) + 1;
        (propias[foto] ??= new Set()).add(emoji);
      } else if (!dando && ya) {
        conteo[foto][emoji] = Math.max(0, (conteo[foto][emoji] ?? 1) - 1);
        propias[foto].delete(emoji);
      }
    }
    return { reacciones: conteo, mias: propias };
  }, [filas, pendientes]);

  /** Da o quita una reacción. Devuelve true solo si quedó DADA y guardada (para festejar). */
  const reaccionar = useCallback(async (photoId: string, emoji: string) => {
    const k = clave(photoId, emoji);
    if (enCamino.current.has(k)) return false; // ya va una en camino para esta misma
    enCamino.current.add(k);
    const tenia = mias[photoId]?.has(emoji) ?? false;
    setPendientes(prev => new Map(prev).set(k, !tenia));

    let ok = false;
    if (tenia) {
      const { data, error } = await supabase.from('photo_likes').delete()
        .match({ photo_id: photoId, guest_key: guestKey.current, emoji }).select('id');
      ok = !error;
      if (ok) setFilas(prev => {
        const next = new Map(prev);
        for (const r of data ?? []) next.delete(r.id);
        return next;
      });
    } else {
      const { data, error } = await supabase.from('photo_likes')
        .insert({ photo_id: photoId, guest_key: guestKey.current, emoji }).select('id').single();
      ok = !error && Boolean(data);
      if (ok) setFilas(prev => new Map(prev).set(data!.id, { id: data!.id, photo_id: photoId, guest_key: guestKey.current, emoji }));
      // Ya existía (otro teléfono con la misma llave, o una carrera): la base manda.
      if (error?.code === '23505') fetchLikes();
    }
    if (!ok) console.error('[useLikes] no se guardó la reacción');

    setPendientes(prev => { const next = new Map(prev); next.delete(k); return next; });
    enCamino.current.delete(k);
    return ok && !tenia;
  }, [mias, fetchLikes]);

  // Lo de siempre (el corazón), para el botón de cada Polaroid y el doble tap.
  const counts = useMemo<Record<string, number>>(
    () => Object.fromEntries(Object.entries(reacciones).map(([f, c]) => [f, c[CORAZON] ?? 0])), [reacciones]);
  const mine = useMemo(() => new Set(Object.entries(mias).filter(([, s]) => s.has(CORAZON)).map(([f]) => f)), [mias]);
  const toggle = useCallback((photoId: string) => reaccionar(photoId, CORAZON), [reaccionar]);

  return { counts, mine, toggle, reacciones, mias, reaccionar };
}
