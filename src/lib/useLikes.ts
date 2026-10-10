import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { supabase, getGuestKey, type PhotoLike } from './supabase';

/** Las reacciones de la barra, como las de una historia de Instagram. El corazón va primero. */
export const EMOJIS = ['❤️', '😍', '🥹', '😂', '👏', '🔥', '🥂', '💃'] as const;
export const CORAZON = '❤️';

type Fila = { id: string; photo_id: string; guest_key: string; emoji: string };
type Conteo = Record<string, Record<string, number>>; // foto → emoji → cuántas

const PAGINA = 1000; // tope de filas por consulta de la API de Supabase

/**
 * Reacciones de las fotos — UNA por persona por foto, como en Instagram.
 * El corazón es una más (el emoji '❤️'). Elegir otro emoji REEMPLAZA al que
 * tenía (UPDATE de la misma fila); tocar el mismo lo quita.
 *
 * Cómo se mantiene al día sin desfasarse:
 *  · Todo se guarda como FILAS por id: un aviso en tiempo real y la misma fila
 *    en una recarga no se cuentan doble.
 *  · Los borrados se resuelven por id: con RLS activado, Supabase manda en el
 *    aviso de DELETE solo la llave primaria.
 *  · Lo mío se pinta al instante como "pendiente" hasta que la base responde;
 *    mientras va en camino, otro toque en la misma foto se ignora.
 *  · La carga pagina de 1,000 en 1,000.
 */
export function useLikes() {
  const [filas, setFilas] = useState<Map<string, Fila>>(new Map());
  // Mi intención por foto mientras la base responde: emoji, o null = quitar.
  const [pendientes, setPendientes] = useState<Map<string, string | null>>(new Map());
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

    const poner = (r: PhotoLike) => setFilas(prev => {
      const next = new Map(prev);
      next.set(r.id, { id: r.id, photo_id: r.photo_id, guest_key: r.guest_key, emoji: r.emoji || CORAZON });
      return next;
    });

    const channel = supabase
      .channel('realtime:photo_likes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photo_likes' }, p => poner(p.new as PhotoLike))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'photo_likes' }, p => poner(p.new as PhotoLike))
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

  // Conteos por emoji, total por foto y MI reacción por foto (filas + pendiente).
  const { reacciones, totales, mia } = useMemo(() => {
    const conteo: Conteo = {};
    const total: Record<string, number> = {};
    const propia: Record<string, string> = {};
    const sumar = (foto: string, emoji: string, d: number) => {
      (conteo[foto] ??= {})[emoji] = Math.max(0, (conteo[foto]?.[emoji] ?? 0) + d);
      total[foto] = Math.max(0, (total[foto] ?? 0) + d);
    };
    for (const f of filas.values()) {
      sumar(f.photo_id, f.emoji, 1);
      if (f.guest_key === guestKey.current) propia[f.photo_id] = f.emoji;
    }
    for (const [foto, quiero] of pendientes) {
      const tengo = propia[foto];
      if (tengo === quiero || (tengo === undefined && quiero === null)) continue;
      if (tengo) sumar(foto, tengo, -1);
      if (quiero) { sumar(foto, quiero, 1); propia[foto] = quiero; } else delete propia[foto];
    }
    return { reacciones: conteo, totales: total, mia: propia };
  }, [filas, pendientes]);

  /**
   * Reacciona con `emoji`: si era la mía, la quita; si tenía otra, la cambia.
   * Devuelve true solo si quedó PUESTA y guardada (para festejar).
   */
  const reaccionar = useCallback(async (photoId: string, emoji: string) => {
    if (enCamino.current.has(photoId)) return false; // ya va una en camino para esta foto
    enCamino.current.add(photoId);
    const tengo = mia[photoId];
    const quiero = tengo === emoji ? null : emoji;
    setPendientes(prev => new Map(prev).set(photoId, quiero));

    const miFila = [...filas.values()].find(f => f.photo_id === photoId && f.guest_key === guestKey.current);
    let ok = false;
    if (quiero === null) {
      const { error } = await supabase.from('photo_likes').delete().match({ photo_id: photoId, guest_key: guestKey.current });
      ok = !error;
      if (ok && miFila) setFilas(prev => { const n = new Map(prev); n.delete(miFila.id); return n; });
    } else if (tengo && miFila) {
      const { data, error } = await supabase.from('photo_likes').update({ emoji: quiero }).eq('id', miFila.id).select('id');
      ok = !error && (data?.length ?? 0) > 0;
      if (ok) setFilas(prev => new Map(prev).set(miFila.id, { ...miFila, emoji: quiero }));
      // La quité desde otra pestaña antes del cambio: la base manda.
      else if (!error) fetchLikes();
    } else {
      const { data, error } = await supabase.from('photo_likes')
        .insert({ photo_id: photoId, guest_key: guestKey.current, emoji: quiero }).select('id').single();
      ok = !error && Boolean(data);
      if (ok) setFilas(prev => new Map(prev).set(data!.id, { id: data!.id, photo_id: photoId, guest_key: guestKey.current, emoji: quiero }));
      // Ya había una (otro teléfono con la misma llave o una carrera): la base manda.
      if (error?.code === '23505') fetchLikes();
    }
    if (!ok) console.error('[useLikes] no se guardó la reacción');

    setPendientes(prev => { const n = new Map(prev); n.delete(photoId); return n; });
    enCamino.current.delete(photoId);
    return ok && quiero !== null;
  }, [mia, filas, fetchLikes]);

  // El botón de cada Polaroid: el total de reacciones y la mía (si tengo).
  // Tocarlo da corazón si no tengo nada, o quita la que tenga.
  const toggle = useCallback((photoId: string) => reaccionar(photoId, mia[photoId] ?? CORAZON), [reaccionar, mia]);

  return { reacciones, totales, mia, toggle, reaccionar };
}
