#!/usr/bin/env python3
"""
Genera el ícono de la app (public/icon.png) con la estética de la invitación de
Diana & Antonio: papel crema y el sello de lacre bronce rosado con "D&A".

    python3 scripts/make-icon.py
"""
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from pathlib import Path

SIZE  = 512
CREMA = (246, 239, 233)
CLARO = (210, 180, 162)   # brillo de la cera
MEDIO = (170, 130, 104)   # caramelo
OSCURO = (110, 78, 61)    # sombra de la cera
TINTA = (90, 60, 46)
SERIF = "/System/Library/Fonts/Supplemental/Georgia.ttf"

out = Path(__file__).resolve().parent.parent / "public" / "icon.png"
img = Image.new("RGB", (SIZE, SIZE), CREMA)

# Cera: disco con borde ondulado y degradado radial desde arriba a la izquierda.
cx, cy, r = SIZE / 2, SIZE / 2, SIZE * 0.36
borde = [(cx + (r + 9 * math.sin(a * 9)) * math.cos(a), cy + (r + 9 * math.sin(a * 9)) * math.sin(a))
         for a in [i * 2 * math.pi / 360 for i in range(360)]]
mascara = Image.new("L", (SIZE, SIZE), 0)
ImageDraw.Draw(mascara).polygon(borde, fill=255)
cera = Image.new("RGB", (SIZE, SIZE))
px = cera.load()
fx, fy = cx - r * 0.35, cy - r * 0.4
for y in range(SIZE):
    for x in range(SIZE):
        t = min(1, math.hypot(x - fx, y - fy) / (r * 1.6))
        a, b, k = (CLARO, MEDIO, t / 0.45) if t < 0.45 else (MEDIO, OSCURO, (t - 0.45) / 0.55)
        px[x, y] = tuple(int(a[i] + (b[i] - a[i]) * k) for i in range(3))
sombra = Image.new("L", (SIZE, SIZE), 0)
ImageDraw.Draw(sombra).polygon([(x + 4, y + 10) for x, y in borde], fill=90)
img.paste((74, 58, 48), (0, 0), sombra.filter(ImageFilter.GaussianBlur(14)))
img.paste(cera, (0, 0), mascara)

d = ImageDraw.Draw(img)
ri = r * 0.72
d.ellipse([cx - ri, cy - ri, cx + ri, cy + ri], outline=OSCURO, width=5)
font = ImageFont.truetype(SERIF, 112)
fuente_y = ImageFont.truetype(SERIF, 64)
d.text((cx - 50, cy - 8), "D", font=font, fill=TINTA, anchor="mm")
d.text((cx + 2, cy + 6), "&", font=fuente_y, fill=TINTA, anchor="mm")
d.text((cx + 50, cy + 24), "A", font=font, fill=TINTA, anchor="mm")

img.save(out, "PNG")
print(f"✅ {out}  ({out.stat().st_size // 1024} KB)")
