import { useState, useEffect } from 'react';
import WelcomeScreen from '@/components/WelcomeScreen';
import Gallery from '@/components/Gallery';
import UploadButton from '@/components/UploadButton';
import { EVENT } from '@/lib/event';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [guestName, setGuestName] = useState<string | null>(null);
  const [uploadCount, setUploadCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('guest_name');
    if (saved) setGuestName(saved);
  }, []);

  const handleJoin = (name: string) => {
    localStorage.setItem('guest_name', name);
    setGuestName(name);
  };

  const handleLeave = () => {
    localStorage.removeItem('guest_name');
    setGuestName(null);
  };

  return (
    <>
      <div className="grain-overlay" />
      <AnimatePresence mode="wait">
        {!guestName ? (
          <WelcomeScreen key="welcome" onJoin={handleJoin} />
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="min-h-screen pb-44 bg-background"
          >
            {/* ── Encabezado ── */}
            <header
              className="sticky top-0 z-30 w-full border-b border-[var(--silver)]/20"
              style={{
                background: 'rgba(246,239,233,0.90)',
                backdropFilter: 'blur(20px) saturate(160%)',
                WebkitBackdropFilter: 'blur(20px) saturate(160%)',
              }}
            >
              <div className="flex flex-col items-center text-center px-6 pt-4 pb-4">
                <h2
                  className="font-script text-[var(--accent-dark)] leading-none"
                  style={{ fontSize: 'clamp(1.9rem, 7vw, 2.4rem)' }}
                >
                  {EVENT.nombre}
                </h2>
                <p className="text-[7.5px] tracking-[0.45em] uppercase text-[var(--muted-foreground)]/65 font-sans mt-1.5">
                  Nuestra Boda · Galería
                </p>
                <button
                  onClick={handleLeave}
                  className="mt-3 px-5 py-2 text-[8px] tracking-[0.22em] uppercase font-semibold border border-[var(--silver)]/40 text-[var(--muted-foreground)]/80 rounded-sm hover:border-[var(--accent)]/60 hover:text-[var(--accent-dark)] transition-all duration-300 font-sans"
                >
                  Cambiar Invitado
                </button>
              </div>
            </header>

            {/* ── Intro ── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="max-w-6xl mx-auto px-5 pt-9 pb-7 text-center"
            >
              <p className="text-[8px] tracking-[0.4em] uppercase text-[var(--muted-foreground)]/70 font-sans mb-3">
                Hola, {guestName}
              </p>
              <h1
                className="font-heading font-light italic text-[var(--foreground)]/85 leading-tight"
                style={{ fontSize: 'clamp(1.8rem, 6.5vw, 2.6rem)' }}
              >
                Los momentos de nuestro día
              </h1>
              <div className="w-8 h-[1px] bg-[var(--silver)]/45 mx-auto mt-4" />
            </motion.div>

            {/* ── Galería ── */}
            <div className="max-w-6xl mx-auto px-4 sm:px-5">
              <Gallery refreshKey={uploadCount} />
            </div>

            <UploadButton guestName={guestName} onUploadSuccess={() => setUploadCount(n => n + 1)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
