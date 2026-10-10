import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Download, Camera, Users, Heart, Loader2 } from 'lucide-react';
import { supabase, type Photo } from '@/lib/supabase';
import { EVENT } from '@/lib/event';

export default function AdminPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [likeTotals, setLikeTotals] = useState<Record<string, number>>({});
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
    setLoading(true);
    try {
      const [photosRes, likesRes] = await Promise.all([
        supabase.from('photos').select('*').order('created_at', { ascending: false }),
        // Solo corazones: las demás reacciones (emojis) no cuentan como corazón.
        supabase.from('photo_likes').select('photo_id').eq('emoji', '❤️').limit(10000),
      ]);
      if (photosRes.error) throw photosRes.error;
      setPhotos(photosRes.data || []);

      const totals: Record<string, number> = {};
      for (const row of likesRes.data ?? []) {
        totals[row.photo_id] = (totals[row.photo_id] ?? 0) + 1;
      }
      setLikeTotals(totals);
    } catch (err) {
      console.error('Error al cargar:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('photos').delete().match({ id });
      if (error) throw error;
      setPhotos(prev => prev.filter(p => p.id !== id));
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
      for (let i = 0; i < photos.length; i++) {
        try {
          const res = await fetch(photos[i].url);
          const blob = await res.blob();
          const ext = blob.type.includes('png') ? 'png' : 'jpg';
          zip.file(`${photos[i].guest_name.replace(/[\\/:*?"<>|]+/g, '-')}_${i + 1}.${ext}`, blob);
        } catch {
          // si una foto falla, seguimos con las demás
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
    } catch {
      alert('Error al generar el ZIP. Intenta de nuevo.');
    } finally {
      setDownloading(false);
    }
  };

  const totalLikes = Object.values(likeTotals).reduce((a, b) => a + b, 0);

  const stats = [
    { label: 'Fotos', value: photos.length, icon: Camera },
    { label: 'Invitados', value: new Set(photos.map(p => p.guest_name)).size, icon: Users },
    { label: 'Corazones', value: totalLikes, icon: Heart },
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
              className="w-full bg-transparent border-b border-[var(--silver)]/40 py-4 text-center text-xl outline-none focus:border-[var(--accent)]/70 transition-all placeholder:text-[var(--muted-foreground)]/30 text-[var(--foreground)] font-heading"
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
          <a href="/#" className="block text-[8.5px] tracking-[0.3em] uppercase text-[var(--muted-foreground)]/40 hover:text-[var(--accent-dark)] transition-colors font-sans">
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
              <p className="text-[8px] tracking-[0.35em] uppercase text-[var(--muted-foreground)]/50 font-sans mt-0.5">
                Boda de {EVENT.nombre}
              </p>
            </div>
            <a
              href="/#"
              className="text-[8.5px] tracking-[0.25em] uppercase text-[var(--muted-foreground)]/55 hover:text-[var(--accent-dark)] transition-colors font-sans border border-[var(--silver)]/30 px-4 py-2"
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
              <p className="text-[8px] tracking-[0.2em] uppercase text-[var(--muted-foreground)]/50 mt-1 font-sans">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-[var(--muted-foreground)]/40 font-sans text-sm py-20">Cargando fotos...</p>
        ) : photos.length === 0 ? (
          <p className="text-center text-[var(--muted-foreground)]/45 font-heading italic text-xl py-20">Sin fotos aún.</p>
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

                {/* Corazones de esta foto */}
                {(likeTotals[photo.id] ?? 0) > 0 && (
                  <div
                    className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full pointer-events-none"
                    style={{ background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(8px)' }}
                  >
                    <Heart size={10} className="text-white/85" style={{ fill: 'currentColor' }} />
                    <span className="text-[9px] text-white/85 font-sans tabular-nums leading-none">
                      {likeTotals[photo.id]}
                    </span>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent opacity-100 [@media(hover:hover)]:opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pointer-events-none">
                  <p className="text-[8px] tracking-[0.2em] uppercase text-white/50 font-sans">De</p>
                  <p className="text-white font-heading italic text-sm">{photo.guest_name}</p>
                  {photo.message && (
                    <p className="text-white/60 text-xs mt-0.5" style={{ fontFamily: 'Caveat, cursive' }}>
                      "{photo.message}"
                    </p>
                  )}
                </div>

                {deleteConfirm === photo.id ? (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 p-4">
                    <p className="text-white text-xs text-center font-sans">¿Eliminar esta foto?</p>
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleDelete(photo.id)}
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
