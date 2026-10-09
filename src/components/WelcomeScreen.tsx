import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EVENT } from '@/lib/event';
import Sello from './Sello';

interface WelcomeScreenProps {
  onJoin: (name: string) => void;
}

/**
 * Foto de la pareja para el fondo (opcional). Si la mandan, se guarda en
 * /public/pareja.jpg y se pone aquí: HERO_PHOTO = '/pareja.jpg'.
 * Mientras tanto la pantalla se sostiene sola con el papel y el sello.
 */
const HERO_PHOTO: string | null = null;

export default function WelcomeScreen({ onJoin }: WelcomeScreenProps) {
  const [name, setName] = useState('');
  const [showContent, setShowContent] = useState(false);

  // Como el sobre de la invitación: la galería abre cuando tocan el sello.
  const [abriendo, setAbriendo] = useState(false);
  const abrir = () => {
    if (abriendo) return;
    setAbriendo(true);
    setTimeout(() => setShowContent(true), 650);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onJoin(name.trim());
  };

  return (
    <div
      className="relative flex flex-col items-center justify-between min-h-[100dvh] overflow-hidden"
      style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 0%, #FBF7F3 0%, #F6EFE9 45%, #EDE2D8 100%)' }}
    >
      {/* ── Foto de fondo (si la hay) ── */}
      {HERO_PHOTO && (
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${HERO_PHOTO})`, opacity: 0.32 }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(246,239,233,0.55) 0%, rgba(246,239,233,0.80) 55%, rgba(246,239,233,0.96) 100%)' }}
          />
        </div>
      )}

      {/* ── Nombre enorme de marca de agua ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.055 }}
          transition={{ delay: 1.9, duration: 2.5 }}
          className="font-script leading-none text-[var(--accent-dark)]"
          style={{ fontSize: 'clamp(110px, 30vw, 300px)' }}
        >
          {EVENT.iniciales.join('&')}
        </motion.span>
      </div>

      <AnimatePresence mode="wait">
        {!showContent ? (
          /* ── Antesala ── */
          <motion.div
            key="pre"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="z-10 flex flex-col items-center gap-4 my-auto"
          >
            <SelloBoton abriendo={abriendo} alAbrir={abrir} />
            <p className="text-[11px] tracking-[0.45em] uppercase text-[var(--muted-foreground)]/75 font-sans">
              {EVENT.fechaCorta}
            </p>
          </motion.div>
        ) : (
          /* ── Título ── */
          <motion.div
            key="title"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="z-10 text-center px-8 pt-16 pb-0 w-full max-w-[440px]"
          >
            {/* Fecha entre reglas de plata */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="flex items-center justify-center gap-3 mb-7"
            >
              <div className="h-[1px] w-8 bg-[var(--silver)]/45" />
              <span className="text-[8px] tracking-[0.5em] uppercase text-[var(--muted-foreground)]/65 font-sans font-medium whitespace-nowrap">
                {EVENT.fechaCorta}
              </span>
              <div className="h-[1px] w-8 bg-[var(--silver)]/45" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.35, duration: 0.9, ease: [0.34, 1.4, 0.5, 1] }}
              className="flex justify-center mb-4"
            >
              <Sello size={92} texto={null} />
            </motion.div>

            <h1 className="leading-[1.05]">
              <span
                className="block font-heading font-light italic text-[var(--muted-foreground)] tracking-[0.13em]"
                style={{ fontSize: 'clamp(0.95rem, 3.8vw, 1.15rem)' }}
              >
                {EVENT.titulo}
              </span>
              <span
                className="block font-script text-[var(--accent-dark)] mt-1"
                style={{ fontSize: 'clamp(2.7rem, 12.5vw, 4.6rem)', lineHeight: 1.18 }}
              >
                {EVENT.nombre}
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 1 }}
              className="mt-6 mx-auto max-w-[290px] font-heading italic text-[var(--muted-foreground)]/90 leading-relaxed"
              style={{ fontSize: 'clamp(0.82rem, 3.4vw, 0.95rem)' }}
            >
              «{EVENT.frase.texto}»
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="mt-2.5 text-[8px] tracking-[0.45em] uppercase text-[var(--accent)] font-sans"
            >
              {EVENT.fechaLarga}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Formulario ── */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="z-10 w-full max-w-[360px] px-8 pb-12 pt-10"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative group">
                <input
                  type="text"
                  required
                  autoComplete="given-name"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-0 pt-6 pb-6 bg-transparent border-b border-[var(--silver)]/40 outline-none text-center text-[1.3rem] transition-colors duration-500 placeholder:text-[var(--muted-foreground)]/35 text-[var(--foreground)] font-heading italic tracking-wide focus:border-[var(--accent)]/70"
                />
                <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-[var(--accent)] origin-left transition-all duration-500 group-focus-within:w-full" />
              </div>

              <motion.button
                whileHover={{ scale: 1.012 }}
                whileTap={{ scale: 0.985 }}
                type="submit"
                className="w-full py-[17px] text-[10px] font-semibold tracking-[0.3em] uppercase rounded-2xl transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.55)',
                  backdropFilter: 'blur(28px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                  border: '1px solid rgba(170,130,104,0.35)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 8px 28px rgba(138,102,80,0.13)',
                  color: 'var(--accent-dark)',
                }}
              >
                Entrar a la Galería
              </motion.button>
            </form>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-7 text-center text-[8px] tracking-[0.38em] uppercase text-[var(--muted-foreground)]/65 font-sans"
            >
              Comparte tus fotos de este día
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * El sello como botón de entrada, igual que en el sobre de la invitación: late
 * suave invitando a tocarlo y, al tocarlo, se hunde y se desvanece.
 */
function SelloBoton({ abriendo, alAbrir }: { abriendo: boolean; alAbrir: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={alAbrir}
      aria-label="Abrir la galería"
      className="cursor-pointer bg-transparent border-0 p-0"
      style={{ WebkitTapHighlightColor: 'transparent' }}
      initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
      animate={abriendo
        ? { scale: [1, 0.9, 1.15], opacity: [1, 1, 0], rotate: [0, -4, 6] }
        : { opacity: 1, scale: [1, 1.035, 1], rotate: 0 }}
      transition={abriendo
        ? { duration: 0.65, ease: 'easeInOut' }
        : { opacity: { duration: 0.8 }, rotate: { duration: 0.8 }, scale: { duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 } }}
      whileTap={{ scale: 0.94 }}
    >
      <Sello size={210} />
    </motion.button>
  );
}
