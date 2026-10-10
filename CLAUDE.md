# Boda de Diana & Antonio — Galería compartida

Galería de fotos en vivo para que los invitados suban y vean las fotos de la
boda, escaneando un QR en las mesas. Sin registro, sin apps que instalar.

**Este archivo es la fuente de verdad del proyecto.** Léelo completo al retomar.

---

## El evento

| | |
|---|---|
| Pareja | **Diana & Antonio** |
| Fecha | **Sábado 17 de octubre de 2026** |
| Ceremonia | Parroquia de San Andrés Apóstol · 1:30 PM |
| Recepción | Quinta Camino Real · 3:00 PM |
| Ciudad | Miahuatlán de Porfirio Díaz, Oaxaca |
| Padres de la novia | Verónica Cruz Cortés · Ezequiel López Ramírez |
| Padres del novio | Reyna Josefina Cruz Maya · Hazael David Hernández Hernández |
| Padrinos | Rosa Paulina García Cruz · Jesús Eusebio Jarquín Bautista |
| Invitación original | https://invitacion.site/dianayantonio/ |

Todos estos datos viven en **`src/lib/event.ts`**. No los escribas a mano en los
componentes: cámbialos ahí y se propagan solos.

---

## Stack

- Vite 6 + React 19 + TypeScript
- Tailwind CSS v4 (por plugin de Vite, sin archivo de config)
- Supabase — base de datos + Storage + tiempo real
- Framer Motion + react-photo-album (masonry)
- Deploy: Cloudflare Pages · repo `github.com/zahirdanielvidahurrazaga/Boda-Diana-Antonio`

Viene de la galería de la Primera Comunión de Grecia (`~/Developer/comunion-grecia`),
que a su vez viene de la boda de Mariana & Jesús. Corazones, animación, panel de
admin con ZIP y QR imprimible ya venían de ahí.

---

## Diseño — NO cambiar sin indicación

Sale de la invitación de Diana & Antonio: papel de algodón crema, letras en
caramelo, flores secas en topo, y un **sobre cerrado con sello de lacre "D&A"**
en bronce rosado.

```
--background  #F6EFE9   crema del papel
--foreground  #4A3A30   café tinta
--accent      #AA8268   caramelo (el color de las letras de la invitación)
--accent-dark #8A6650   caramelo oscuro (textos)
--silver      #A19289   topo (líneas y detalles)
--muted-fg    #7E6C60   texto secundario
```

Tipografías (las de la invitación):
- **Great Vibes** — los nombres "Diana & Antonio"
- **EB Garamond** — todo lo demás, títulos en itálica y versalitas espaciadas
- **Caveat** — la firma manuscrita en las Polaroids

Elementos:
- **Sello de lacre = el botón de entrada**: es la imagen EXACTA de la
  invitación (`public/sello.png`, sacada de su sitio: `Sello_medidaFinal.png`,
  189 px, ampliada ×3 con Lanczos + un toque de nitidez). La galería arranca con
  el sello sobre el papel; al tocarlo se hunde, se desvanece y aparece la
  bienvenida (`SelloBoton` en `WelcomeScreen.tsx`). Zahir rechazó la versión
  dibujada en SVG (9-oct): usar la imagen. El ícono (`public/icon.png`) es ese
  mismo sello sobre crema (`scripts/make-icon.py` ya no se usa).
- **Papel**: textura de fibra en SVG sobre el fondo crema (`index.css`).
- **Polaroid**: marco blanco `6px 6px 54px 6px`, inclinación aleatoria por foto.
- Frase de la invitación: «Juntos hicimos de un día cualquiera, una fecha para
  marcar en el calendario.»
- Los textos chicos NO deben bajar de ~60% de opacidad.

### La animación del corazón (`HeartButton.tsx`)

Referencias: el **doble tap de Instagram** y el **estallido de partículas de
Twitter/X**, pero traducidos a esta paleta — en vez de confeti de colores, van
**pétalos y corazones diminutos** en los dos caramelos, que hacen eco de las flores
de la invitación.

Tres capas que ocurren juntas al DAR corazón (nunca al quitarlo — festejar que
alguien se arrepintió no tiene sentido):

1. El corazón se hunde y rebota — `scale: [1, 0.72, 1.34, 0.94, 1]`.
2. Una **onda** delgada se expande y se desvanece.
3. **Siete partículas** (3 corazoncitos + 4 pétalos) salen en abanico HACIA
   ARRIBA, no en círculo parejo: se siente ligero, como pétalos que se sueltan,
   y no como confeti de videojuego.

En el lightbox, además, **doble tap sobre la foto** da corazón y hace florecer un
corazón grande encima. Solo DA, nunca quita — si ya tenía, el doble tap no lo
arranca.

Dos decisiones de color que costaron ver y no hay que revertir:
- Las partículas **no usan topo ni caramelo claro como color principal**: sobre el
  marco BLANCO del Polaroid desaparecen.
- El corazón grande del doble tap es **caramelo con halo blanco**, no blanco:
  un corazón blanco se pierde sobre fotos claras (un vestido, un perro blanco).

Todo respeta `prefers-reduced-motion`: si el invitado pidió menos movimiento en
su teléfono, el corazón cambia sin estallido.

### Reacciones como historia de Instagram (9-oct)

En la foto grande hay una barra de vidrio con ❤️ 😍 🥹 😂 👏 🔥 🥂 💃
(`Reacciones.tsx`): al tocar uno salen copias volando. **UNA reacción por
persona por foto** (pedido de Zahir, 9-oct): elegir otro emoji REEMPLAZA al
que tenía (UPDATE de la misma fila) y tocar el mismo la quita. Debajo, el
resumen de la foto (la mía en caramelo). En cada Polaroid solo va el botón de
siempre con el total: si mi reacción es otro emoji, el botón muestra ESE emoji
en el lugar y tamaño exactos del corazón (`HeartButton`, prop `emoji`); tocarlo
quita mi reacción. El doble tap da ❤️ (si tenía otro emoji, lo cambia a ❤️).

`useLikes.ts` guarda FILAS por id (no contadores): sin dobles conteos entre la
recarga y el tiempo real, y los DELETE se resuelven por id (con RLS, Supabase
manda en el aviso solo la llave primaria). Lo mío se pinta como "pendiente" y
un segundo toque a la misma reacción en camino se ignora. Carga paginada de
1,000 en 1,000. Todo esto salió de la revisión de Codex del 9-oct.

---

## Base de datos

Proyecto de Supabase: **`dmpiyplbacqhddqsliun`** — "Boda Diana y Antonio", en la
cuenta **Deisy** (plan gratis). Token de la cuenta en el llavero:
`Supabase Diana Antonio`.

**El esquema ya está aplicado y verificado** (2026-10-09), y la base quedó en
ceros tras la prueba. Fuente de verdad: **`supabase/schema.sql`** (idempotente).

```bash
TOKEN=$(security find-generic-password -s "Supabase Diana Antonio" -w)
curl -X POST "https://api.supabase.com/v1/projects/dmpiyplbacqhddqsliun/database/query" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  --data @payload.json     # {"query": "..."}
```

Ojo: usar **curl, no python-urllib** — Cloudflare bloquea ese user-agent con 403.

```
photos        id · created_at · url · guest_name · event_id · width · height · message
photo_likes   id · photo_id → photos(id) · guest_key · emoji · created_at
              unique(photo_id, guest_key)  ← una reacción por invitado por foto
              política UPDATE abierta (para cambiar de emoji)
              check: emoji en los 8 de la barra
```

Bucket de Storage: **`boda-photos`** (público), ruta `photos/{timestamp}-{random}.jpg`.

- **`photo_likes` tiene `REPLICA IDENTITY FULL`**: sin eso los contadores no
  bajarían al quitar un corazón en tiempo real.
- **Las políticas de RLS están abiertas a propósito** (los invitados no se
  registran). Cualquiera con la llave anónima podría borrar fotos; aceptable
  para un evento privado cuyo enlace solo está en las mesas.

---

## Cómo se corre

```bash
npm install
npm run dev              # http://localhost:5173
npm run build            # tsc -b && vite build
npm run qr -- <url>      # QR de las mesas: public/qr.png + qr-card.html (A4, 4 por hoja)
```

Variables (`.env.local` local, y las MISMAS en Cloudflare Pages):

```
VITE_SUPABASE_URL=https://dmpiyplbacqhddqsliun.supabase.co
VITE_SUPABASE_ANON_KEY=   (la llave "anon" del proyecto; está en .env.local)
```

Rutas: `/` galería · `/#admin` panel (estadísticas, borrar, ZIP). Código en
`event.ts` (`adminCode`, hoy `1710`): puerta de cortesía, no seguridad real.

---

## ⚠️ Supabase gratuito se pausa solo

A los 7 días sin actividad se pausa y la galería no carga. La boda es el
**17 de octubre**: entrar a la galería unos días antes y el mismo día temprano.

---

## Probado (2026-10-09)

Con la llave anónima, como lo hace la app, y limpiado después:
subida al bucket ✅ · registrar foto ✅ · corazón ✅ · corazón repetido rechazado
(409) ✅ · foto pública ✅ · se ve en la galería como Polaroid ✅.
Falta probar en teléfono real — eso lo hace Zahir.

## Lo que falta

1. ✅ Desplegado en **https://boda-diana-antonio.pages.dev** (Cloudflare Pages, push a main = deploy).
2. ✅ QR generado (9-oct) y verificado que lleva a esa URL: `public/qr.png` y
   `qr-card.html` (local, ignorado). Falta **imprimir** las tarjetas.
3. ✅ **Fotos de la pareja** (9-oct): `public/pareja-1.jpg` y `pareja-2.jpg`
   se funden una en otra cada 6 s con un acercamiento lento, SOLO en la
   pantalla del nombre (no en la del sello), A TODO COLOR (Zahir pidió que se
   vieran más: el velo crema las lavaba). Los textos van en dos tarjetas de
   vidrio crema (`VIDRIO`) y la pareja queda visible entre ellas; la marca de
   agua D&A se apaga ahí (`FondoFotos` en `WelcomeScreen.tsx`). Para agregar más:
   súbelas a `public/` y añádelas a `FOTOS_PAREJA`.
