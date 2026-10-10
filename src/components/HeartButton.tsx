import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface HeartButtonProps {
  liked: boolean;
  count: number;
  onToggle: () => void;
  /** Tamaño del corazón en píxeles — 17 en la galería, 21 en el lightbox */
  size?: number;
  /** Mi reacción si no es el corazón: se pinta en su lugar, mismo tamaño y alineación */
  emoji?: string;
}

type Particula = {
  x: number; y: number;
  tipo: 'corazon' | 'petalo';
  color: string; tam: number; giro: number; retraso: number;
};

/**
 * Abanico hacia arriba en vez de estallido parejo en círculo: se siente
 * más ligero, como pétalos que se sueltan, y no como confeti de videojuego.
 * (0° es a la derecha; los negativos van hacia arriba.)
 */
const ANGULOS = [-158, -128, -100, -74, -48, -18, -88];

function hacerParticulas(radio: number): Particula[] {
  const colores = ['var(--accent)', 'var(--accent-light)', 'var(--silver)'];
  return ANGULOS.map((grados, i) => {
    const rad = (grados * Math.PI) / 180;
    const d = radio * (i % 2 === 0 ? 1 : 0.7);
    const esCorazon = i % 3 === 0;
    return {
      x: Math.cos(rad) * d,
      y: Math.sin(rad) * d,
      tipo: esCorazon ? 'corazon' : 'petalo',
      color: colores[i % colores.length],
      tam: esCorazon ? 9 : 6,
      giro: (i % 2 === 0 ? 1 : -1) * (30 + i * 14),
      retraso: i * 0.014,
    };
  });
}

export default function HeartButton({ liked, count, onToggle, size = 17, emoji }: HeartButtonProps) {
  const otroEmoji = liked && emoji && emoji !== '❤️' ? emoji : null;
  const [estallido, setEstallido] = useState(0);
  const sinMovimiento = useReducedMotion();

  const particulas = hacerParticulas(size * 1.9);

  const manejar = (e: React.MouseEvent) => {
    e.stopPropagation();
    // El festejo es solo al DAR corazón. Al quitarlo sería celebrar lo contrario.
    if (!liked && !sinMovimiento) setEstallido(n => n + 1);
    onToggle();
  };

  return (
    <button
      onClick={manejar}
      aria-label={liked ? 'Quitar mi reacción' : 'Dar corazón'}
      aria-pressed={liked}
      className="relative flex flex-col items-center justify-center gap-[1px] py-1 select-none"
      style={{ width: size * 2.1 }}
    >
      {/* ── Onda que se expande ── */}
      {estallido > 0 && (
        <motion.span
          key={`onda-${estallido}`}
          initial={{ scale: 0.25, opacity: 0.62 }}
          animate={{ scale: 2.3, opacity: 0 }}
          transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: size * 1.5,
            height: size * 1.5,
            top: `calc(4px + ${size * 0.5}px - ${size * 0.75}px)`,
            border: '1.5px solid var(--accent-dark)',
          }}
        />
      )}

      {/* ── Pétalos y corazones que se sueltan ── */}
      {estallido > 0 && (
        <span
          key={`particulas-${estallido}`}
          className="absolute pointer-events-none"
          style={{ top: 4 + size * 0.5, left: '50%' }}
        >
          {particulas.map((p, i) => (
            <motion.span
              key={i}
              initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: 0 }}
              animate={{
                x: p.x,
                y: [0, p.y * 0.75, p.y],
                scale: [0, 1, 0.55],
                opacity: [0, 0.95, 0],
                rotate: p.giro,
              }}
              transition={{ duration: 0.78, delay: p.retraso, ease: [0.16, 1, 0.3, 1] }}
              className="absolute"
              style={{ left: 0, top: 0 }}
            >
              {p.tipo === 'corazon' ? (
                <Heart size={p.tam} style={{ fill: p.color, color: p.color }} />
              ) : (
                <span
                  className="block"
                  style={{
                    width: p.tam,
                    height: p.tam * 1.45,
                    background: p.color,
                    borderRadius: '60% 0 60% 0',   // forma de pétalo
                  }}
                />
              )}
            </motion.span>
          ))}
        </span>
      )}

      {/* ── El corazón ── */}
      <motion.span
        key={`corazon-${liked}-${estallido}`}
        initial={false}
        animate={
          sinMovimiento
            ? { scale: 1 }
            : liked
              ? { scale: [1, 0.72, 1.34, 0.94, 1] }   // se hunde y rebota
              : { scale: [1, 0.88, 1] }                // al quitarlo, apenas un guiño
        }
        transition={{
          duration: liked ? 0.56 : 0.24,
          times: liked ? [0, 0.14, 0.4, 0.68, 1] : [0, 0.5, 1],
          ease: 'easeOut',
        }}
        className="relative block"
      >
        {otroEmoji ? (
          // Mi emoji en la misma caja que el corazón: mismo tamaño y alineación.
          <span
            className="flex items-center justify-center"
            style={{ width: size, height: size, fontSize: size * 0.98, lineHeight: 1 }}
          >
            {otroEmoji}
          </span>
        ) : (
          <Heart
            size={size}
            style={{
              fill: liked ? 'var(--accent)' : 'transparent',
              color: liked ? 'var(--accent)' : 'rgba(74,58,48,0.32)',
              transition: 'color 0.25s',
            }}
          />
        )}
      </motion.span>

      {/* ── Contador ── */}
      {count > 0 && (
        <motion.span
          key={`cuenta-${count}`}
          initial={sinMovimiento ? false : { y: -3, opacity: 0.4 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="font-sans tabular-nums leading-none"
          style={{
            fontSize: size * 0.53,
            color: liked ? 'var(--accent-dark)' : 'rgba(74,58,48,0.4)',
          }}
        >
          {count}
        </motion.span>
      )}
    </button>
  );
}
