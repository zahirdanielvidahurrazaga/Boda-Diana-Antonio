import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Download, Camera, Users, SmilePlus, Loader2 } from 'lucide-react';
import { supabase, traerFotos, traerReacciones, rutaEnBucket, type Photo } from '@/lib/supabase';
import { EMOJIS } from '@/lib/useLikes';
import { EVENT } from '@/lib/event';

export default function AdminPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  // foto → emoji → cuántas reacciones
  const [reacciones, setReacciones] = useState<Record<string, Record<string, number>>>({});
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) fetchAll();
  }, [isAuthenticated]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === EVENT.adminCode) {
      setIsAuthenticated(true);
    } else {
      setAuthError(true);
      setPasscode('');
      setTimeout(() => setAuthError(false), 2500);
    }
  };

  const fetchAll = async () => {
    // Todas las fotos y reacciones, paginadas (la API corta en 1,000).
    const [fotos, filas] = await Promise.all([traerFotos(), traerReacciones()]);
    setLoadError(!fotos || !filas);
    if (fotos) setPhotos(fotos);
    if (filas) {
      const conteo: Record<string, Record<string, number>> = {};
      for (const r of filas) {
        const e = r.emoji || '❤️';
        (conteo[r.photo_id] ??= {})[e] = (conteo[r.photo_id]?.[e] ?? 0) + 1;
      }
      setReacciones(conteo);
    }
    setLoading(false);
  };

  // Al volver a la pestaña, traer lo nuevo que subieron mientras tanto.
  useEffect(() => {
    if (!isAuthenticated) return;
    const alVolver = () => { if (!document.hidden) fetchAll(); };
    document.addEventListener('visibilitychange', alVolver);
    return () => document.removeEventListener('visibilitychange', alVolver);
  }, [isAuthenticated]);

  const handleDelete = async (photo: Photo) => {
    try {
      const { error } = await supabase.from('photos').delete().match({ id: photo.id });
      if (error) throw error;
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      // También el archivo, para que el enlace de la foto deje de funcionar.
      const ruta = rutaEnBucket(photo.url, EVENT.bucket);
      if (ruta) {
        const { error: errArchivo } = await supabase.storage.from(EVENT.bucket).remove([ruta]);
        if (errArchivo) alert('La foto ya no aparece en la galería, pero su archivo no se pudo borrar del almacenamiento. Avísale a Zahir.');
      }
    } catch (err) {
      alert(`Error al eliminar: ${err instanceof Error ? err.message : 'desconocido'}`);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleDownloadAll = async () => {
    if (photos.length === 0) return;
    setDownloading(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      let fallidas = 0;
      for (let i = 0; i < photos.length; i++) {
        try {
          const res = await fetch(photos[i].url);
          if (!res.ok) throw new Error(String(res.status));
          const blob = await res.blob();
          const ext = blob.type.includes('png') ? 'png' : 'jpg';
          zip.file(`${photos[i].guest_name.replace(/[\\/:*?"<>|]+/g, '-')}_${i + 1}.${ext}`, blob);
        } catch {
          fallidas++; // si una foto falla, seguimos con las demás
        }
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BodaDianaAntonio_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60_000); // Safari la necesita viva un rato
      if (fallidas > 0) alert(`El ZIP se descargó, pero ${fallidas} foto(s) no se pudieron incluir. Intenta de nuevo con buena conexión.`);
    } catch {
      alert('Error al generar el ZIP. Intenta de nuevo.');
    } finally {
      setDownloading(false);
    }
  };

  const totalDe = (foto: string) => Object.values(reacciones[foto] ?? {}).reduce((a, b) => a + b, 0);
  const totalReacciones = photos.reduce((a, p) => a + totalDe(p.id), 0);

  const stats = [
    { label: 'Fotos', value: photos.length, icon: Camera },
    { label: 'Invitados', value: new Set(photos.map(p => p.guest_name)).size, icon: Users },
    { label: 'Reacciones', value: totalReacciones, icon: SmilePlus },
  ];

  /* ── Puerta ── */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm space-y-10 text-center"
        >
          <div>
            <h2 className="text-3xl font-heading italic text-[var(--foreground)]/85 mb-2">Panel</h2>
            <p className="font-script text-[var(--accent-dark)] text-2xl leading-none">
              {EVENT.nombre}
            </p>
          </div>
          <form onSubmit={handleAuth} className="space-y-6">
            <input
              type="password"
              inputMode="numeric"
              placeholder="Código de acceso"
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              className="w-full bg-transparent border-b border-[var(--silver)]/40 py-4 text-center text-xl outline-none focus:border-[var(--accent)]/70 transition-all placeholder:text-[var(--muted-foreground)]/55 text-[var(--foreground)] font-heading"
            />
            {authError && (
              <p className="text-[9px] tracking-[0.25em] uppercase text-red-400 font-sans">
                Código incorrecto
              </p>
            )}
            <button
              type="submit"
              className="w-full py-4 text-[10px] font-bold tracking-[0.25em] uppercase font-sans border border-[var(--silver)]/40 text-[var(--muted-foreground)] hover:border-[var(--accent)]/60 hover:text-[var(--accent-dark)] transition-all"
            >
              Entrar
            </button>
          </form>
          <a href="/#" className="block text-[8.5px] tracking-[0.3em] uppercase text-[var(--muted-foreground)]/70 hover:text-[var(--accent-dark)] transition-colors font-sans">
            ← Volver a la galería
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header
        className="sticky top-0 z-30 w-full border-b border-[var(--silver)]/20"
        style={{
          background: 'rgba(246,239,233,0.92)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        }}
      >
        <div className="max-w-6xl mx-auto px-5 py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading italic text-[var(--foreground)]/85 text-lg leading-tight">Panel</h1>
              <p className="text-[8px] tracking-[0.35em] uppercase text-[var(--muted-foreground)]/70 font-sans mt-0.5">
                Boda de {EVENT.nombre}
              </p>
            </div>
            <a
              href="/#"
              className="text-[8.5px] tracking-[0.25em] uppercase text-[var(--muted-foreground)]/75 hover:text-[var(--accent-dark)] transition-colors font-sans border border-[var(--silver)]/30 px-4 py-2"
            >
              ← Galería
            </a>
          </div>

          <button
            onClick={handleDownloadAll}
            disabled={downloading || photos.length === 0}
            className="w-full py-2.5 flex items-center justify-center gap-2 text-[9px] font-bold tracking-[0.2em] uppercase font-sans border border-[var(--silver)]/35 hover:border-[var(--accent)]/60 transition-all disabled:opacity-40 text-[var(--muted-foreground)]"
          >
            {downloading
              ? <><Loader2 size={12} className="animate-spin" /><span>Generando ZIP...</span></>
              : <><Download size={12} /><span>Descargar todo ({photos.length})</span></>
            }
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-7">
        <div className="grid grid-cols-3 gap-3 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="border border-[var(--silver)]/25 p-4 text-center"
            >
              <stat.icon className="w-4 h-4 text-[var(--accent)]/60 mx-auto mb-2" />
              <p className="text-2xl font-heading text-[var(--foreground)]/85">{stat.value}</p>
              <p className="text-[8px] tracking-[0.2em] uppercase text-[var(--muted-foreground)]/70 mt-1 font-sans">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {loadError && (
          <p className="mb-6 text-center text-[11px] text-red-500/80 font-sans">
            No se pudo cargar todo (¿sin conexión?). Recarga la página.
          </p>
        )}

        {loading ? (
          <p className="text-center text-[var(--muted-foreground)]/65 font-sans text-sm py-20">Cargando fotos...</p>
        ) : photos.length === 0 ? (
          <p className="text-center text-[var(--muted-foreground)]/65 font-heading italic text-xl py-20">Sin fotos aún.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.6) }}
                className="relative group aspect-[4/5] bg-[var(--muted)] overflow-hidden"
              >
                <img
                  src={photo.url}
                  alt={photo.guest_name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Reacciones de esta foto: las 3 más usadas y el total */}
                {totalDe(photo.id) > 0 && (
                  <div
                    className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full pointer-events-none"
                    style={{ background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(8px)' }}
                  >
                    <span className="text-[11px] leading-none">
                      {EMOJIS.filter(e => reacciones[photo.id]?.[e])
                        .sort((a, b) => (reacciones[photo.id][b] ?? 0) - (reacciones[photo.id][a] ?? 0))
                        .slice(0, 3).join('')}
                    </span>
                    <span className="text-[10px] text-white/90 font-sans tabular-nums leading-none">
                      {totalDe(photo.id)}
                    </span>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent opacity-100 [@media(hover:hover)]:opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pointer-events-none">
                  <p className="text-[8px] tracking-[0.2em] uppercase text-white/70 font-sans">De</p>
                  <p className="text-white font-heading italic text-sm">{photo.guest_name}</p>
                  {photo.message && (
                    <p className="text-white/80 text-xs mt-0.5" style={{ fontFamily: 'Caveat, cursive' }}>
                      "{photo.message}"
                    </p>
                  )}
                </div>

                {deleteConfirm === photo.id ? (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 p-4">
                    <p className="text-white text-xs text-center font-sans">¿Eliminar esta foto?</p>
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleDelete(photo)}
                        className="flex-1 py-2 bg-red-500/80 text-white text-[9px] font-bold tracking-wider uppercase font-sans"
                      >
                        Sí, eliminar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="flex-1 py-2 bg-white/20 text-white text-[9px] font-bold tracking-wider uppercase font-sans"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(photo.id)}
                    aria-label="Eliminar foto"
                    className="absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center text-white/90 hover:text-red-400 transition-colors opacity-100 [@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
