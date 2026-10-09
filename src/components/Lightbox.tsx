import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion, type PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, Heart } from 'lucide-react';
import type { Photo } from '@/lib/supabase';
import HeartButton from './HeartButton';

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  likeCounts: Record<string, number>;
  likedByMe: Set<string>;
  onToggleLike: (photoId: string) => void;
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '105%' : '-105%', opacity: 0.2 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? '-105%' : '105%', opacity: 0.2 }),
};

const glassBtn = {
  background: 'rgba(255,255,255,0.10)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.14)',
};

export default function Lightbox({
  photos, currentIndex, onClose, onNavigate,
  likeCounts, likedByMe, onToggleLike,
}: LightboxProps) {
  const [direction, setDirection] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [floracion, setFloracion] = useState(0);
  const ultimoToque = useRef(0);
  const sinMovimiento = useReducedMotion();

  const photo = photos[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const goNext = useCallback(() => {
    if (!hasNext) return;
    setDirection(1);
    onNavigate(currentIndex + 1);
  }, [hasNext, currentIndex, onNavigate]);

  const goPrev = useCallback(() => {
    if (!hasPrev) return;
    setDirection(-1);
    onNavigate(currentIndex - 1);
  }, [hasPrev, currentIndex, onNavigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft')  goPrev();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goNext, goPrev]);

  useEffect(() => {
    setShowControls(true);
    const t = setTimeout(() => setShowControls(false), 3500);
    return () => clearTimeout(t);
  }, [currentIndex]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const THRESHOLD = 55;
    if (info.offset.x < -THRESHOLD)     goNext();
    else if (info.offset.x > THRESHOLD) goPrev();
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const response = await fetch(photo.url);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boda-diana-antonio-${photo.guest_name.replace(/\s+/g, '-').toLowerCase()}.jpg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!photo) return null;

  const likes = likeCounts[photo.id] ?? 0;
  const liked = likedByMe.has(photo.id);

  /**
   * Un toque muestra u oculta los controles; dos toques seguidos dan corazón,
   * como en Instagram. Al detectar el segundo, deshacemos el cambio que hizo
   * el primero para que los controles no queden al revés.
   */
  const manejarToqueFoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    const ahora = Date.now();
    if (ahora - ultimoToque.current < 320) {
      ultimoToque.current = 0;
      setShowControls(v => !v);           // deshace el toque anterior
      if (!liked) onToggleLike(photo.id); // el doble tap solo DA, nunca quita
      if (!sinMovimiento) setFloracion(n => n + 1);
      return;
    }
    ultimoToque.current = ahora;
    setShowControls(v => !v);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: 'spring', damping: 26, stiffness: 160, mass: 1.1 }}
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: 'rgba(36, 30, 25, 0.97)', transformOrigin: 'center center' }}
      onClick={() => setShowControls(v => !v)}
    >

      {/* ── Botones superiores — siempre visibles ── */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 pt-12 pb-4 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)' }}
      >
        <AnimatePresence>
          {showControls && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="text-[9px] tracking-[0.45em] uppercase text-white/35 font-sans"
            >
              {currentIndex + 1} <span className="text-white/18">/</span> {photos.length}
            </motion.p>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-2 pointer-events-auto ml-auto">
          <button
            onClick={handleDownload}
            aria-label="Descargar foto"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
            style={glassBtn}
          >
            <Download size={16} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onClose(); }}
            aria-label="Cerrar"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
            style={glassBtn}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Polaroid centrada ── */}
      <div className="flex-1 flex items-center justify-center px-5">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 260, damping: 36, mass: 1.0 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: hasNext ? 0.18 : 0.04, right: hasPrev ? 0.18 : 0.04 }}
            onDragEnd={handleDragEnd}
            onClick={manejarToqueFoto}
            className="cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'pan-y' }}
          >
            {/* Marco Polaroid */}
            <div
              className="relative"
              style={{
                background: '#fff',
                padding: '9px 9px 62px 9px',
                width: 'min(80vw, 340px)',
                boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 6px 22px rgba(0,0,0,0.32)',
              }}
            >
              <div className="relative">
                <img
                  src={photo.url}
                  alt={`Foto de ${photo.guest_name}`}
                  className="w-full select-none block"
                  style={{
                    aspectRatio: `${photo.width ?? 3} / ${photo.height ?? 4}`,
                    objectFit: 'cover',
                  }}
                  draggable={false}
                />

                {/* Corazón que florece al doble tap */}
                {floracion > 0 && (
                  <motion.div
                    key={`floracion-${floracion}`}
                    initial={{ scale: 0.35, opacity: 0 }}
                    animate={{ scale: [0.35, 1.2, 1, 1.08], opacity: [0, 0.96, 0.9, 0] }}
                    transition={{ duration: 1.05, times: [0, 0.2, 0.62, 1], ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <Heart
                      size={104}
                      strokeWidth={1.1}
                      style={{
                        // Rosa palo con halo blanco: un corazón todo blanco se
                        // pierde sobre fotos claras (un vestido, un perro blanco).
                        fill: 'rgba(170,130,104,0.92)',
                        color: 'rgba(255,255,255,0.95)',
                        filter: 'drop-shadow(0 3px 14px rgba(0,0,0,0.45))',
                      }}
                    />
                  </motion.div>
                )}
              </div>
              {/* Firma */}
              <div
                style={{
                  height: '62px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: '2px',
                  padding: '0 52px 0 4px',
                }}
              >
                {photo.message && (
                  <p
                    className="truncate"
                    style={{ fontFamily: 'Caveat, cursive', fontSize: '15px', color: 'rgba(74,58,48,0.45)', lineHeight: 1.3 }}
                  >
                    {photo.message}
                  </p>
                )}
                <p
                  className="truncate"
                  style={{ fontFamily: 'Caveat, cursive', fontSize: photo.message ? '18px' : '21px', color: 'rgba(74,58,48,0.65)', lineHeight: 1.2 }}
                >
                  — {photo.guest_name}
                </p>
              </div>

              {/* Corazón */}
              <div className="absolute right-2.5 bottom-3">
                <HeartButton
                  liked={liked}
                  count={likes}
                  onToggle={() => onToggleLike(photo.id)}
                  size={21}
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Puntos + flechas ── */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 pb-12"
            onClick={e => e.stopPropagation()}
          >
            {/* Flechas en escritorio */}
            <div className="hidden sm:block">
              {hasPrev && (
                <motion.button
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={e => { e.stopPropagation(); goPrev(); }}
                  aria-label="Anterior"
                  className="fixed left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
                  style={glassBtn}
                >
                  <ChevronLeft size={20} />
                </motion.button>
              )}
              {hasNext && (
                <motion.button
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={e => { e.stopPropagation(); goNext(); }}
                  aria-label="Siguiente"
                  className="fixed right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
                  style={glassBtn}
                >
                  <ChevronRight size={20} />
                </motion.button>
              )}
            </div>

            {/* Puntos */}
            {photos.length > 1 && photos.length <= 30 && (
              <div className="flex items-center gap-1.5 flex-wrap justify-center px-8">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setDirection(i > currentIndex ? 1 : -1); onNavigate(i); }}
                    aria-label={`Ir a la foto ${i + 1}`}
                    className={`rounded-full transition-all duration-300 ${
                      i === currentIndex
                        ? 'w-4 h-1.5 bg-white/70'
                        : 'w-1.5 h-1.5 bg-white/18 hover:bg-white/35'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
