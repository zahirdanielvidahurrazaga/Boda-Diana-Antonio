import { useId } from 'react';
import { EVENT } from '@/lib/event';

/**
 * Sello de lacre con las iniciales, como el que cierra el sobre de la
 * invitación: cera metálica topo con vetas, borde derramado, dos aros en
 * relieve, "D&A" grabado y "Abrir" en manuscrita.
 *
 * El relieve sale de la luz, no de dibujar sombras a mano: cada capa (la cera,
 * los aros y las letras) pasa por un filtro de iluminación especular de SVG
 * con la luz arriba a la izquierda, así brilla como metal y se ve levantada.
 */
export default function Sello({ size = 200, texto = 'Abrir' }: { size?: number; texto?: string | null }) {
  const uid = useId().replace(/:/g, '');
  const id = (n: string) => `${n}-${uid}`;
  const [a, b] = EVENT.iniciales;

  // Relieve: desenfoca la forma, la ilumina y suma el brillo sobre su color.
  const relieve = (nombre: string, alto: number, brillo: number, borroso: number) => (
    <filter id={id(nombre)} x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceAlpha" stdDeviation={borroso} result="b" />
      <feSpecularLighting in="b" surfaceScale={alto} specularConstant={brillo} specularExponent="18" lightingColor="#FFF6EC" result="s">
        <feDistantLight azimuth="225" elevation="42" />
      </feSpecularLighting>
      <feComposite in="s" in2="SourceAlpha" operator="in" result="si" />
      <feDiffuseLighting in="b" surfaceScale={alto} diffuseConstant="0.9" lightingColor="#FFFFFF" result="d">
        <feDistantLight azimuth="225" elevation="50" />
      </feDiffuseLighting>
      <feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1="1.15" k2="0" k3="0" k4="0" result="sombreado" />
      <feComposite in="sombreado" in2="si" operator="arithmetic" k1="0" k2="1" k3="0.55" k4="0" result="final" />
      <feComposite in="final" in2="SourceAlpha" operator="in" />
    </filter>
  );

  return (
    <svg viewBox="0 0 240 240" width={size} height={size} aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={id('cera')} cx="38%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#CFC0B0" />
          <stop offset="38%" stopColor="#A39080" />
          <stop offset="75%" stopColor="#7F6D5F" />
          <stop offset="100%" stopColor="#5F5045" />
        </radialGradient>
        {/* Vetas de la cera, como mármol */}
        <filter id={id('vetas')} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="4" seed="11" result="r" />
          <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="2" seed="3" result="giro" />
          <feDisplacementMap in="r" in2="giro" scale="38" xChannelSelector="R" yChannelSelector="G" result="remolino" />
          <feColorMatrix in="remolino" type="matrix" values="0 0 0 0 0.97  0 0 0 0 0.93  0 0 0 0 0.87  0 0 0 2.2 -1.05" />
        </filter>
        <filter id={id('sombra')} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        {relieve('relieveCera', 6, 0.85, 5)}
        {relieve('relieveAro', 2.2, 1.1, 1.1)}
        {relieve('relieveLetra', 2.4, 1.2, 0.9)}
        <clipPath id={id('recorte')}>
          <path d={CERA} />
        </clipPath>
      </defs>

      {/* sombra sobre el papel */}
      <path d={CERA} fill="rgba(60,44,34,0.42)" transform="translate(6 10)" filter={`url(#${id('sombra')})`} />

      {/* la cera con su relieve */}
      <path d={CERA} fill={`url(#${id('cera')})`} filter={`url(#${id('relieveCera')})`} />
      <g clipPath={`url(#${id('recorte')})`} opacity="0.55">
        <rect x="0" y="0" width="240" height="240" filter={`url(#${id('vetas')})`} />
      </g>

      {/* dos aros levantados */}
      <g filter={`url(#${id('relieveAro')})`}>
        <circle cx="122" cy="118" r="76" fill="none" stroke="#9C8A7B" strokeWidth="5" />
        <circle cx="122" cy="118" r="66" fill="none" stroke="#9C8A7B" strokeWidth="2.4" />
      </g>

      {/* iniciales y "Abrir" en relieve */}
      <g filter={`url(#${id('relieveLetra')})`} fill="#7C6A5C">
        <text x="98" y="112" textAnchor="middle" fontFamily="'EB Garamond', Georgia, serif" fontWeight="600" fontSize="66">{a}</text>
        <text x="124" y="124" textAnchor="middle" fontFamily="'EB Garamond', Georgia, serif" fontWeight="600" fontSize="34">&amp;</text>
        <text x="144" y="160" textAnchor="middle" fontFamily="'EB Garamond', Georgia, serif" fontWeight="600" fontSize="66">{b}</text>
        {texto && <text x="126" y="182" textAnchor="middle" fontFamily="'Great Vibes', cursive" fontSize="28" stroke="#7C6A5C" strokeWidth="0.7">{texto}</text>}
      </g>
    </svg>
  );
}

/** Contorno de cera derramada: ancho y suave, más grueso a la izquierda, como el de la foto. */
const CERA = 'M128 22c22 1 38 6 51 17 13 10 22 22 28 38 6 15 9 30 6 47-3 18-11 33-24 46-12 12-28 21-45 25-17 4-34 5-51 0-12-3-22-8-31-15-7-5-16-6-21-13-6-8-4-16-8-25-5-12-9-22-9-37 0-16 4-30 12-43 8-14 19-24 31-31 20-6 41-9 61-9z';
