#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSETS_DIR="$SCRIPT_DIR/../assets"
OUTPUT="$ASSETS_DIR/icon.ico"
TMPDIR=$(mktemp -d)

# Find source icon (first png or jpg found)
SOURCE=$(find "$ASSETS_DIR" -maxdepth 1 \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' \) ! -name 'AppIcon*' | head -1)
if [ -z "$SOURCE" ]; then
  echo "Error: No .png or .jpg source image found in $ASSETS_DIR"
  exit 1
fi

# Generate PNGs at standard ICO sizes
SIZES=(16 32 48 64 128 256)
PNG_FILES=()
for size in "${SIZES[@]}"; do
  out="$TMPDIR/icon_${size}.png"
  sips -z "$size" "$size" -s format png "$SOURCE" --out "$out" > /dev/null
  PNG_FILES+=("$out")
done

# Assemble ICO using Python (available on macOS by default)
python3 -c "
import struct, sys

files = sys.argv[1:]
entries = []
data_blocks = []
offset = 6 + len(files) * 16  # header + directory entries

for f in files:
    with open(f, 'rb') as fh:
        png_data = fh.read()
    # Read width/height from PNG header (bytes 16-23)
    w = struct.unpack('>I', png_data[16:20])[0]
    h = struct.unpack('>I', png_data[20:24])[0]
    # ICO uses 0 for 256
    entries.append((w if w < 256 else 0, h if h < 256 else 0, len(png_data), offset))
    data_blocks.append(png_data)
    offset += len(png_data)

with open('$OUTPUT', 'wb') as out:
    # ICO header: reserved(2) + type(2) + count(2)
    out.write(struct.pack('<HHH', 0, 1, len(files)))
    # Directory entries
    for (w, h, size, off) in entries:
        out.write(struct.pack('<BBBBHHII', w, h, 0, 0, 1, 32, size, off))
    # Image data
    for d in data_blocks:
        out.write(d)
" "${PNG_FILES[@]}"

rm -rf "$TMPDIR"

echo "Created $OUTPUT"
