import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { EVENT } from '@/lib/event';

interface WelcomeScreenProps {
  onJoin: (name: string) => void;
}

/**
 * Fotos de la pareja que van cambiando de fondo en la pantalla del nombre
 * (en /public). Para agregar más, súbelas ahí y añádelas a la lista.
 */
const FOTOS_PAREJA = ['/pareja-1.jpg', '/pareja-2.jpg'];
const CADA_MS = 6000;

// Letras blancas sobre la foto, como en una invitación editorial: una sombra
// suave basta para leerlas sin tapar la imagen.
const SOMBRA: React.CSSProperties = { textShadow: '0 1px 2px rgba(0,0,0,0.25), 0 2px 18px rgba(0,0,0,0.35)' };


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
      {/* ── Fotos de la pareja (solo en la pantalla del nombre) ── */}
      <AnimatePresence>
        {showContent && <FondoFotos />}
      </AnimatePresence>

      {/* ── Nombre enorme de marca de agua ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: showContent ? 0 : 0.055 }}
          transition={showContent ? { duration: 1.2 } : { delay: 1.9, duration: 2.5 }}
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
          /* ── Título: editorial sobre la foto, letras blancas ── */
          <motion.div
            key="title"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="z-10 w-full max-w-[440px] px-8 pt-16 text-center text-white"
            style={SOMBRA}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-[10px] tracking-[0.55em] uppercase font-heading text-white/90"
            >
              {EVENT.titulo}
            </motion.p>

            <h1
              className="font-script mt-5"
              style={{ fontSize: 'clamp(2.9rem, 13.5vw, 4.8rem)', lineHeight: 1.1 }}
            >
              {EVENT.nombre}
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4 text-[13px] tracking-[0.45em] font-heading text-white"
            >
              {EVENT.fechaCorta}
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
            className="z-10 w-full max-w-[380px] px-8 pb-10 pt-10 text-white"
            style={SOMBRA}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 1 }}
              className="mx-auto max-w-[300px] text-center font-heading italic text-white/90 leading-relaxed"
              style={{ fontSize: 'clamp(0.85rem, 3.5vw, 0.98rem)' }}
            >
              «{EVENT.frase.texto}»
            </motion.p>

            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="relative group">
                <input
                  type="text"
                  required
                  autoComplete="given-name"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-0 pt-5 pb-4 bg-transparent border-b border-white/50 outline-none text-center text-[1.3rem] text-white placeholder:text-white/70 font-heading italic tracking-wide transition-colors duration-500 focus:border-white"
                />
                <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-white origin-left transition-all duration-500 group-focus-within:w-full" />
              </div>

              <motion.button
                whileHover={{ scale: 1.012 }}
                whileTap={{ scale: 0.985 }}
                type="submit"
                className="w-full py-[17px] text-[10px] font-semibold tracking-[0.3em] uppercase rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.16)',
                  backdropFilter: 'blur(18px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(18px) saturate(160%)',
                  border: '1px solid rgba(255,255,255,0.55)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 24px rgba(0,0,0,0.18)',
                  color: '#fff',
                  textShadow: 'none',
                }}
              >
                Entrar a la Galería
              </motion.button>
            </form>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-5 text-center text-[8px] tracking-[0.38em] uppercase text-white/80 font-sans"
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
 * Las fotos de la pareja se funden una en otra con un acercamiento lento, bajo
 * un velo de papel crema para que el nombre y el formulario se sigan leyendo.
 */
function FondoFotos() {
  const [i, setI] = useState(0);
  const sinMovimiento = useReducedMotion();

  useEffect(() => {
    FOTOS_PAREJA.forEach(src => { new Image().src = src; }); // sin parpadeo al cambiar
    if (FOTOS_PAREJA.length < 2) return;
    const t = setInterval(() => setI(n => (n + 1) % FOTOS_PAREJA.length), CADA_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.6 }}
      aria-hidden="true"
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={FOTOS_PAREJA[i]}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${FOTOS_PAREJA[i]})` }}
          initial={{ opacity: 0, scale: sinMovimiento ? 1 : 1.04 }}
          animate={{ opacity: 1, scale: sinMovimiento ? 1 : 1.12 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1.8, ease: 'easeInOut' }, scale: { duration: CADA_MS / 1000 + 2, ease: 'linear' } }}
        />
      </AnimatePresence>
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(20,14,10,0.50) 0%, rgba(20,14,10,0.28) 24%, rgba(20,14,10,0) 44%, rgba(20,14,10,0.25) 70%, rgba(20,14,10,0.62) 100%)' }}
      />
    </motion.div>
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
      {/* El sello exacto de la invitación (public/sello.png, sacado de su sitio). */}
      <img src="/sello.png" alt="" width={180} height={182} draggable={false}
        style={{ display: 'block', width: 180, height: 'auto', filter: 'drop-shadow(0 10px 14px rgba(60,44,34,0.28))' }} />
    </motion.button>
  );
}
