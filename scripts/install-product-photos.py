"""
Installs the generated studio photos as the product images.

For every id in _flow_output/raw/<id>/ it backs up the current
client/public/assets/products/<id>.jpg (once) into _legacy_backup_2026-10-31/products/,
crops the new photo to the 5:4 card ratio and writes an optimized 1000x800 JPEG.

    python scripts/install-product-photos.py [id ...]   (no ids: every generated photo)
"""
import os
import shutil
import sys

from PIL import Image, ImageStat

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "_flow_output", "raw")
DEST = os.path.join(ROOT, "client", "public", "assets", "products")
BACKUP = os.path.join(ROOT, "_legacy_backup_2026-10-31", "products")
os.makedirs(BACKUP, exist_ok=True)


def whiten_background(im):
    """Studio photos come on a warm off-white: scales each channel so that backdrop becomes pure white."""
    w, h = im.size
    s = max(8, w // 40)
    boxes = [(0, 0, s, s), (w - s, 0, w, s), (0, h - s, s, h), (w - s, h - s, w, h), (0, 0, w, s // 2), (0, h // 2, s // 2, h // 2 + s)]
    samples = [ImageStat.Stat(im.crop(b)).mean for b in boxes]
    samples.sort(key=sum)
    # The brightest corners are the backdrop; dark ones may be a table edge or a shadow.
    top = samples[len(samples) // 2 :]
    bg = [sum(c[i] for c in top) / len(top) for i in range(3)]
    if min(bg) < 170:
        return im  # not a light studio backdrop: leave the photo as it is
    # A small margin above the backdrop's level also clears its soft vignette.
    scale = [255 / max(1, b * 0.985) for b in bg]
    return Image.merge("RGB", [band.point(lambda v, f=scale[i]: min(255, int(v * f))) for i, band in enumerate(im.split())])


installed = 0
for pid in sorted(sys.argv[1:] or os.listdir(RAW)):
    folder = os.path.join(RAW, pid)
    files = sorted(f for f in os.listdir(folder) if f.lower().endswith((".jpg", ".jpeg", ".png")))
    if not files:
        continue
    src = os.path.join(folder, files[-1])
    target = os.path.join(DEST, f"{pid}.jpg")
    backup = os.path.join(BACKUP, f"{pid}.jpg")
    if os.path.exists(target) and not os.path.exists(backup):
        shutil.copy2(target, backup)

    im = Image.open(src).convert("RGB")
    if not pid.endswith("-alt"):
        im = whiten_background(im)
    w, h = im.size
    ratio = 5 / 4
    if w / h > ratio:  # too wide: trim the sides
        nw = int(h * ratio)
        im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:  # too tall: trim top and bottom
        nh = int(w / ratio)
        im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    im = im.resize((1000, 800), Image.LANCZOS)
    im.save(target, "JPEG", quality=86, optimize=True, progressive=True)
    small = im.copy()
    small.thumbnail((480, 384))
    small.save(os.path.join(DEST, f"{pid}-480.jpg"), "JPEG", quality=80, optimize=True, progressive=True)
    installed += 1
    print(f"{pid}: {os.path.getsize(target) // 1024} KB")

print(f"Instaladas {installed} fotos. Originales en {BACKUP}")
