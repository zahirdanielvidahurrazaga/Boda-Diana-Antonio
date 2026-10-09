import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { EMOJIS } from '@/lib/useLikes';

interface Props {
  conteo: Record<string, number>;
  mias: Set<string>;
  onReaccionar: (emoji: string) => Promise<boolean> | boolean;
}

type Vuelo = { id: number; emoji: string; x: number; dx: number; alto: number; giro: number; retraso: number; escala: number };

/**
 * Reacciones rápidas como las de una historia de Instagram: una cápsula de
 * vidrio con los emojis; al tocar uno sale volando hacia arriba en varias
 * copias que se abren y se desvanecen. Abajo, el resumen de la foto con las
 * mías resaltadas. Tocar uno que ya di lo quita (sin festejo).
 */
export default function Reacciones({ conteo, mias, onReaccionar }: Props) {
  const [vuelos, setVuelos] = useState<Vuelo[]>([]);
  const sinMovimiento = useReducedMotion();

  const tocar = async (emoji: string, i: number) => {
    const dada = await onReaccionar(emoji);
    if (!dada || sinMovimiento) return;
    const base = (i - (EMOJIS.length - 1) / 2) * 38; // sale de donde está el emoji en la barra
    const nuevos = Array.from({ length: 6 }, (_, k) => ({
      id: Date.now() + k + Math.random(),
      emoji,
      x: base,
      dx: (Math.random() - 0.5) * 140,
      alto: 260 + Math.random() * 120,
      giro: (Math.random() - 0.5) * 40,
      retraso: k * 0.06,
      escala: 0.9 + Math.random() * 0.8,
    }));
    setVuelos(v => [...v, ...nuevos]);
    setTimeout(() => setVuelos(v => v.filter(x => !nuevos.some(n => n.id === x.id))), 1700);
  };

  const resumen = EMOJIS.filter(e => (conteo[e] ?? 0) > 0);

  return (
    <div className="relative flex flex-col items-center gap-2.5" onClick={e => e.stopPropagation()}>
      {/* Emojis volando */}
      <div className="pointer-events-none absolute left-1/2 bottom-full" aria-hidden="true">
        <AnimatePresence>
          {vuelos.map(v => (
            <motion.span
              key={v.id}
              initial={{ x: v.x, y: 30, scale: 0.4, opacity: 0, rotate: 0 }}
              animate={{ x: v.x + v.dx, y: -v.alto, scale: v.escala, opacity: [0, 1, 1, 0], rotate: v.giro }}
              transition={{ duration: 1.5, delay: v.retraso, ease: [0.2, 0.7, 0.3, 1], opacity: { times: [0, 0.12, 0.7, 1], duration: 1.5, delay: v.retraso } }}
              className="absolute -translate-x-1/2"
              style={{ fontSize: 34, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.35))' }}
            >
              {v.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Barra de vidrio */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 rounded-full"
        role="group"
        aria-label="Reaccionar a la foto"
        style={{
          background: 'radial-gradient(120% 100% at 20% 0%, rgba(255,255,255,0.28), rgba(255,255,255,0) 60%), rgba(255,255,255,0.10)',
          backdropFilter: 'blur(22px) saturate(180%)',
          WebkitBackdropFilter: 'blur(22px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.28)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 30px rgba(0,0,0,0.35)',
        }}
      >
        {EMOJIS.map((e, i) => {
          const mia = mias.has(e);
          return (
            <motion.button
              key={e}
              type="button"
              whileTap={{ scale: 1.45 }}
              transition={{ type: 'spring', stiffness: 500, damping: 14 }}
              onClick={() => tocar(e, i)}
              aria-pressed={mia}
              aria-label={`Reaccionar con ${e}`}
              className="w-[34px] h-[34px] rounded-full flex items-center justify-center"
              style={{
                fontSize: 21,
                background: mia ? 'rgba(255,255,255,0.22)' : 'transparent',
                boxShadow: mia ? 'inset 0 0 0 1px rgba(255,255,255,0.45)' : 'none',
              }}
            >
              {e}
            </motion.button>
          );
        })}
      </div>

      {/* Resumen de la foto */}
      {resumen.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 px-6">
          {resumen.map(e => (
            <span
              key={e}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-sans"
              style={{
                color: 'rgba(255,255,255,0.92)',
                background: mias.has(e) ? 'rgba(170,130,104,0.55)' : 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <span style={{ fontSize: 13 }}>{e}</span>{conteo[e]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
