import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, getGuestKey, type PhotoLike } from './supabase';

/**
 * Corazones de las fotos.
 *
 * Cada invitado puede dar un solo corazón por foto (y quitarlo). No hace falta
 * que se registre: se le asigna una llave anónima guardada en su teléfono.
 *
 * El contador se pinta al instante y después se guarda; si el guardado falla
 * se revierte, para que nadie vea un corazón que en realidad no se registró.
 */
export function useLikes() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<Set<string>>(new Set());
  const guestKey = useRef(getGuestKey());

  const fetchLikes = useCallback(async () => {
    const { data, error } = await supabase.from('photo_likes').select('photo_id, guest_key');
    if (error) return;

    const nextCounts: Record<string, number> = {};
    const nextMine = new Set<string>();
    for (const row of data ?? []) {
      nextCounts[row.photo_id] = (nextCounts[row.photo_id] ?? 0) + 1;
      if (row.guest_key === guestKey.current) nextMine.add(row.photo_id);
    }
    setCounts(nextCounts);
    setMine(nextMine);
  }, []);

  useEffect(() => {
    fetchLikes();

    const channel = supabase
      .channel('realtime:photo_likes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photo_likes' }, payload => {
        const row = payload.new as PhotoLike;
        // Los nuestros ya los pintamos de inmediato, no los contamos dos veces
        if (row.guest_key === guestKey.current) return;
        setCounts(prev => ({ ...prev, [row.photo_id]: (prev[row.photo_id] ?? 0) + 1 }));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'photo_likes' }, payload => {
        // Requiere REPLICA IDENTITY FULL en la tabla — ver supabase/schema.sql
        const row = payload.old as Partial<PhotoLike>;
        if (!row.photo_id || row.guest_key === guestKey.current) return;
        setCounts(prev => ({ ...prev, [row.photo_id!]: Math.max(0, (prev[row.photo_id!] ?? 1) - 1) }));
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

  const toggle = useCallback(async (photoId: string) => {
    const liked = mine.has(photoId);

    const applyLocal = (on: boolean) => {
      setMine(prev => {
        const next = new Set(prev);
        if (on) next.add(photoId); else next.delete(photoId);
        return next;
      });
      setCounts(prev => ({
        ...prev,
        [photoId]: Math.max(0, (prev[photoId] ?? 0) + (on ? 1 : -1)),
      }));
    };

    applyLocal(!liked);

    const { error } = liked
      ? await supabase.from('photo_likes').delete().match({ photo_id: photoId, guest_key: guestKey.current })
      : await supabase.from('photo_likes').insert({ photo_id: photoId, guest_key: guestKey.current });

    if (error) {
      applyLocal(liked); // revertimos: no se guardó
      console.error('[useLikes]', error.message);
    }
  }, [mine]);

  return { counts, mine, toggle };
}
