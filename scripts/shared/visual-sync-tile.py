"""Tiles the stills of scripts/shared/visual-sync-sheet.mjs into sheets of 9, each still with its time, part and
sentence under it. Usage: visual-sync-tile.py <frames.json>. Writes <folder>/sheet-N.png next to the manifest."""
import json
import sys
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
FONT = ROOT / 'public/stoic/fonts/NotoSans-Regular.ttf'
BOLD = ROOT / 'public/stoic/fonts/NotoSans-Bold.ttf'
PER_SHEET, COLS, CELL_W = 9, 3, 620

manifest = Path(sys.argv[1])
data = json.loads(manifest.read_text())
frames = data['frames']
font, bold = ImageFont.truetype(str(FONT), 21), ImageFont.truetype(str(BOLD), 19)
sheets = []
for start in range(0, len(frames), PER_SHEET):
    chunk = frames[start:start + PER_SHEET]
    cells = []
    for item in chunk:
        image = Image.open(item['file']).convert('RGB')
        image = image.resize((CELL_W, round(image.height * CELL_W / image.width)))
        width = 52 if image.height < image.width else 40
        lines = textwrap.wrap(item['text'], width=width)
        label = f"{int(item['seconds'] // 60)}:{item['seconds'] % 60:04.1f} · {item['part']}"
        text_h = 34 + 28 * len(lines) + 12
        cell = Image.new('RGB', (CELL_W, image.height + text_h), (246, 248, 245))
        cell.paste(image, (0, 0))
        draw = ImageDraw.Draw(cell)
        draw.text((10, image.height + 8), label, font=bold, fill=(22, 54, 46))
        for row, line in enumerate(lines):
            draw.text((10, image.height + 36 + row * 28), line, font=font, fill=(32, 54, 45))
        cells.append(cell)
    rows = [cells[i:i + COLS] for i in range(0, len(cells), COLS)]
    heights = [max(c.height for c in row) for row in rows]
    sheet = Image.new('RGB', (COLS * CELL_W + (COLS + 1) * 12, sum(heights) + (len(rows) + 1) * 12), (220, 228, 220))
    y = 12
    for row, height in zip(rows, heights):
        for col, cell in enumerate(row):
            sheet.paste(cell, (12 + col * (CELL_W + 12), y))
        y += height + 12
    out = manifest.parent / f'sheet-{start // PER_SHEET + 1}.png'
    sheet.save(out)
    sheets.append(out)
for out in sheets:
    print(out.relative_to(ROOT))
