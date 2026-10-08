"""Contact sheets for review: python3 render/sheets.py [dist/review]  -> <dir>/<scene>/sheet.png"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

base = Path(sys.argv[1] if len(sys.argv) > 1 else 'dist/review')
for d in sorted(p for p in base.iterdir() if p.is_dir()):
    frames = sorted(f for f in d.glob('t*.png'))
    if not frames:
        continue
    cols, tw, th = 4, 480, 270
    rows = (len(frames) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * tw, rows * (th + 22)), (20, 20, 18))
    dr = ImageDraw.Draw(sheet)
    for i, f in enumerate(frames):
        im = Image.open(f).convert('RGB').resize((tw, th))
        x, y = (i % cols) * tw, (i // cols) * (th + 22)
        sheet.paste(im, (x, y + 22))
        dr.text((x + 6, y + 4), f.stem, fill=(225, 123, 87))
    sheet.save(d / 'sheet.png')
    print(d / 'sheet.png', len(frames))
