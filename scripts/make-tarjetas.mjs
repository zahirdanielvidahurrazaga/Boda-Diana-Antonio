/**
 * Tarjetas de mesa con el QR (5.5 × 9.5 cm), según la referencia que eligió
 * Zahir (9-oct): ramito arriba, "Comparte tus Fotos", QR, camarita con
 * corazón, nombres y fecha. Tinta casi negra, pensada para opalina marfil.
 *
 *   npm run tarjetas
 *
 * Deja dos archivos (se abren en Chrome → Cmd+P → Guardar como PDF):
 *   tarjetas-hoja.html      — hoja carta horizontal con 8 tarjetas y marcas de corte
 *   tarjeta-imprenta.html   — una tarjeta del tamaño exacto, para la imprenta
 */
import QRCode from 'qrcode';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const URL_SITIO = 'https://boda-diana-antonio.pages.dev';
const TINTA = '#2B2421';

// QR en vectorial: nítido a cualquier tamaño de impresión.
const qrSvg = await QRCode.toString(URL_SITIO, {
  type: 'svg', margin: 0, errorCorrectionLevel: 'M',
  color: { dark: TINTA, light: '#0000' },
});

// Ramito de línea fina (como el de la referencia): hojas alternadas a lo
// largo de un tallo curvo, cada una inclinada hacia la punta.
const P = [[3, 13], [20, 13], [38, 7], [57, 3]];
const enCurva = t => {
  const m = 1 - t;
  const k = [m ** 3, 3 * m * m * t, 3 * m * t * t, t ** 3];
  const d = [-3 * m * m, 3 * m * m - 6 * m * t, 6 * m * t - 3 * t * t, 3 * t * t];
  const sum = (w, i) => w.reduce((acc, v, j) => acc + v * P[j][i], 0);
  return { x: sum(k, 0), y: sum(k, 1), ang: Math.atan2(sum(d, 1), sum(d, 0)) * 180 / Math.PI };
};
const hojas = [0.16, 0.26, 0.36, 0.46, 0.56, 0.66, 0.76, 0.86].map((t, i) => {
  const { x, y, ang } = enCurva(t);
  const lado = i % 2 ? 1 : -1;               // arriba / abajo, alternadas
  const tam = 3.9 - t * 1.6;                 // más chicas hacia la punta
  const giro = ang + lado * 52;
  const rad = giro * Math.PI / 180;
  const cx = x + Math.cos(rad) * tam, cy = y + Math.sin(rad) * tam;
  return `<path d="M${x.toFixed(2)} ${y.toFixed(2)} Q ${(cx + Math.sin(rad) * tam * 0.55).toFixed(2)} ${(cy - Math.cos(rad) * tam * 0.55).toFixed(2)} ${(x + Math.cos(rad) * tam * 2).toFixed(2)} ${(y + Math.sin(rad) * tam * 2).toFixed(2)} Q ${(cx - Math.sin(rad) * tam * 0.55).toFixed(2)} ${(cy + Math.cos(rad) * tam * 0.55).toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}Z"/>`;
}).join('');
const ramito = `<svg viewBox="0 0 62 18" class="ramito" fill="none" stroke="${TINTA}" stroke-width="0.5" stroke-linejoin="round" stroke-linecap="round">
  <path d="M${P[0].join(' ')} C ${P[1].join(' ')}, ${P[2].join(' ')}, ${P[3].join(' ')}"/>${hojas}
</svg>`;

// Camarita con corazón.
const camara = `<svg viewBox="0 0 32 26" class="camara" fill="none" stroke="${TINTA}" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round">
  <path d="M5 9 h5 l2 -3 h8 l2 3 h5 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 h-22 a2 2 0 0 1 -2 -2 v-10 a2 2 0 0 1 2 -2z"/>
  <rect x="6" y="6.3" width="3.4" height="2.2" rx="0.6"/>
  <circle cx="16" cy="15.5" r="5.4"/>
  <path d="M16 18.4 c-2.6 -1.7 -3.6 -2.9 -3.6 -4.1 a1.8 1.8 0 0 1 3.6 -0.6 a1.8 1.8 0 0 1 3.6 0.6 c0 1.2 -1 2.4 -3.6 4.1z" fill="${TINTA}" stroke="none"/>
  <path d="M25 3.5 l1.2 -1.6 M28.2 5.2 l1.8 -0.8 M22 2.8 l0.2 -1.8"/>
</svg>`;

const tarjeta = `<div class="tarjeta">
  ${ramito}
  <p class="caps">Comparte tus</p>
  <p class="script">Fotos</p>
  <p class="caps">con nosotros.</p>
  <div class="qr">${qrSvg}</div>
  <p class="caps chico">Escanea y sube<br>tus fotos.</p>
  ${camara}
  <p class="nombres">Diana &amp; Antonio</p>
  <div class="regla"><span></span><b>♥</b><span></span></div>
  <p class="caps fecha">17 · Octubre · 2026</p>
</div>`;

const estilos = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'EB Garamond', Georgia, serif; color: ${TINTA}; background: #E9E4DE;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .tarjeta { width: 55mm; height: 95mm; background: #FBF8F3; display: flex; flex-direction: column;
             align-items: center; text-align: center; padding: 5.5mm 3mm 5mm; white-space: nowrap; justify-content: center; }
  .ramito { width: 22mm; height: 6.4mm; flex: none; margin-bottom: 1.6mm; overflow: visible; }
  .caps { font-size: 7pt; letter-spacing: 0.24em; text-transform: uppercase; font-weight: 500;
          line-height: 1.45; padding-left: 0.24em; }
  .script { font-family: 'Great Vibes', cursive; font-size: 23pt; line-height: 1; margin: 0; }
  .qr { width: 27mm; height: 27mm; flex: none; margin: 2.6mm 0 2.2mm; }
  .qr svg { width: 100%; height: 100%; display: block; }
  .chico { font-size: 6.2pt; line-height: 1.4; }
  .camara { width: 9mm; height: 7.3mm; flex: none; margin: 2mm 0 1.8mm; }
  .nombres { font-size: 8pt; letter-spacing: 0.24em; text-transform: uppercase; font-weight: 500; padding-left: 0.24em; }
  .regla { display: flex; align-items: center; gap: 1.6mm; margin: 1.4mm 0 1.2mm; }
  .regla span { width: 9mm; height: 0.25mm; background: ${TINTA}; opacity: 0.8; }
  .regla b { font-size: 5.5pt; font-weight: 400; }
  .fecha { font-size: 6.4pt; }
`;
const fuentes = `<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500&family=Great+Vibes&display=swap" rel="stylesheet">`;

// ── Hoja carta horizontal: 4 × 2 tarjetas, pegadas, con marcas de corte afuera ──
const COLS = 4, FILAS = 2, W = 55, H = 95;
const anchoHoja = 279.4, altoHoja = 215.9;
const x0 = (anchoHoja - COLS * W) / 2, y0 = (altoHoja - FILAS * H) / 2;
const marcas = [];
for (let c = 0; c <= COLS; c++) {
  const x = x0 + c * W;
  marcas.push(`<i style="left:${x}mm;top:${y0 - 6}mm;width:0.2mm;height:4mm"></i>`,
              `<i style="left:${x}mm;top:${y0 + FILAS * H + 2}mm;width:0.2mm;height:4mm"></i>`);
}
for (let f = 0; f <= FILAS; f++) {
  const y = y0 + f * H;
  marcas.push(`<i style="top:${y}mm;left:${x0 - 6}mm;height:0.2mm;width:4mm"></i>`,
              `<i style="top:${y}mm;left:${x0 + COLS * W + 2}mm;height:0.2mm;width:4mm"></i>`);
}
const hoja = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>Tarjetas QR — hoja carta</title>${fuentes}
<style>${estilos}
  @page { size: 279.4mm 215.9mm; margin: 0; }
  .hoja { position: relative; width: ${anchoHoja}mm; height: ${altoHoja}mm; background: #fff; margin: 10mm auto; }
  .rejilla { position: absolute; left: ${x0}mm; top: ${y0}mm; display: grid;
             grid-template-columns: repeat(${COLS}, ${W}mm); }
  .hoja i { position: absolute; background: #000; }
  @media print { body { background: #fff; } .hoja { margin: 0; } }
</style></head><body>
<div class="hoja"><div class="rejilla">${tarjeta.repeat(COLS * FILAS)}</div>${marcas.join('')}</div>
</body></html>`;
writeFileSync(resolve(raiz, 'tarjetas-hoja.html'), hoja);

// ── Una sola tarjeta del tamaño exacto (para mandar a la imprenta) ──
const imprenta = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>Tarjeta QR — 5.5 × 9.5 cm</title>${fuentes}
<style>${estilos}
  @page { size: 55mm 95mm; margin: 0; }
  body { display: flex; justify-content: center; padding: 10mm; }
  @media print { body { padding: 0; background: none; } }
</style></head><body>${tarjeta}</body></html>`;
writeFileSync(resolve(raiz, 'tarjeta-imprenta.html'), imprenta);

console.log('\n  ✓ tarjetas-hoja.html     (carta horizontal, 8 tarjetas)\n  ✓ tarjeta-imprenta.html  (una, 5.5 × 9.5 cm)\n');
