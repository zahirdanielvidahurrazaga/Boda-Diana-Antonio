/**
 * Genera el QR de las mesas.
 *
 *   npm run qr -- https://boda-diana-antonio.pages.dev
 *
 * Deja dos cosas:
 *   public/qr.png   — QR suelto en alta resolución (1400 px)
 *   qr-card.html    — tarjeta lista para imprimir: ábrela en Chrome y
 *                     Cmd+P → "Guardar como PDF". Sale en vectorial,
 *                     que es lo que pide la imprenta.
 */
import QRCode from 'qrcode';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const url = process.argv[2] || process.env.SITE_URL;

if (!url) {
  console.error('\n  Falta la dirección del sitio.\n  Uso: npm run qr -- https://tu-sitio.pages.dev\n');
  process.exit(1);
}

const MARFIL = '#F6EFE9';
const TINTA  = '#4A3A30';

// ── 1. QR suelto en alta resolución ──
mkdirSync(resolve(raiz, 'public'), { recursive: true });
await QRCode.toFile(resolve(raiz, 'public/qr.png'), url, {
  width: 1400,
  margin: 2,
  errorCorrectionLevel: 'H',          // aguanta que le pongan el logo encima
  color: { dark: TINTA, light: MARFIL },
});

// ── 2. Tarjeta para imprimir ──
const qrDataUri = await QRCode.toDataURL(url, {
  width: 900,
  margin: 1,
  errorCorrectionLevel: 'H',
  color: { dark: TINTA, light: '#00000000' },
});

const card = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<title>QR — Boda de Diana & Antonio</title>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..600;1,400..600&family=Great+Vibes&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #E8E2D7; font-family: 'EB Garamond', serif; }
  .hoja { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; padding: 6mm; }
  .tarjeta {
    background: ${MARFIL};
    border: 1px solid #C9C3B8;
    border-radius: 3mm;
    padding: 12mm 8mm 10mm;
    text-align: center;
    page-break-inside: avoid;
    display: flex; flex-direction: column; align-items: center;
  }
  .fecha { font-size: 7pt; letter-spacing: .42em; text-transform: uppercase; color: #7E6C60; }
  .regla { width: 14mm; height: 1px; background: #A19289; margin: 4mm 0 3mm; }
  .titulo { font-family: 'EB Garamond', serif; font-style: italic; font-weight: 400;
            font-size: 11pt; letter-spacing: .12em; color: #7E6C60; }
  .nombre { font-family: 'Great Vibes', cursive; font-size: 34pt; color: #8A6650;
            line-height: 1.15; margin: 1mm 0 5mm; }
  .qr { width: 52mm; height: 52mm; }
  .instruccion { font-family: 'EB Garamond', serif; font-style: italic;
                 font-size: 12pt; color: #4A3A30; margin-top: 5mm; line-height: 1.45; }
  .pie { font-size: 6.5pt; letter-spacing: .3em; text-transform: uppercase;
         color: #A19289; margin-top: 4mm; word-break: break-all; }
  @media print { body { background: #fff; } .tarjeta { border-color: #D8D2C7; } }
</style></head>
<body>
  <div class="hoja">
    ${Array.from({ length: 4 }).map(() => `
    <div class="tarjeta">
      <div class="fecha">17 · X · 2026</div>
      <div class="regla"></div>
      <div class="titulo">Nuestra Boda</div>
      <div class="nombre">Diana &amp; Antonio</div>
      <img class="qr" src="${qrDataUri}" alt="Código QR de la galería">
      <div class="instruccion">Escanea y comparte<br>tus fotos de este día</div>
      <div class="pie">${url.replace(/^https?:\/\//, '')}</div>
    </div>`).join('')}
  </div>
</body></html>`;

writeFileSync(resolve(raiz, 'qr-card.html'), card);

console.log(`
  ✅ QR generado para: ${url}

     public/qr.png   QR suelto, 1400 px
     qr-card.html    4 tarjetas por hoja A4
                     → ábrela en Chrome y Cmd+P → Guardar como PDF
`);
