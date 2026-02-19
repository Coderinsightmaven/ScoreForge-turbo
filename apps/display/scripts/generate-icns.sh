#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSETS_DIR="$SCRIPT_DIR/../assets"
ICONSET_DIR="$ASSETS_DIR/AppIcon.iconset"
OUTPUT="$ASSETS_DIR/AppIcon.icns"

# Find source icon (first png or jpg found)
SOURCE=$(find "$ASSETS_DIR" -maxdepth 1 \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' \) ! -name 'AppIcon*' | head -1)
if [ -z "$SOURCE" ]; then
  echo "Error: No .png or .jpg source image found in $ASSETS_DIR"
  exit 1
fi

rm -rf "$ICONSET_DIR"
mkdir -p "$ICONSET_DIR"

sips -z 16 16       -s format png "$SOURCE" --out "$ICONSET_DIR/icon_16x16.png"      > /dev/null
sips -z 32 32       -s format png "$SOURCE" --out "$ICONSET_DIR/icon_16x16@2x.png"   > /dev/null
sips -z 32 32       -s format png "$SOURCE" --out "$ICONSET_DIR/icon_32x32.png"      > /dev/null
sips -z 64 64       -s format png "$SOURCE" --out "$ICONSET_DIR/icon_32x32@2x.png"   > /dev/null
sips -z 128 128     -s format png "$SOURCE" --out "$ICONSET_DIR/icon_128x128.png"    > /dev/null
sips -z 256 256     -s format png "$SOURCE" --out "$ICONSET_DIR/icon_128x128@2x.png" > /dev/null
sips -z 256 256     -s format png "$SOURCE" --out "$ICONSET_DIR/icon_256x256.png"    > /dev/null
sips -z 512 512     -s format png "$SOURCE" --out "$ICONSET_DIR/icon_256x256@2x.png" > /dev/null
sips -z 512 512     -s format png "$SOURCE" --out "$ICONSET_DIR/icon_512x512.png"    > /dev/null
sips -z 1024 1024   -s format png "$SOURCE" --out "$ICONSET_DIR/icon_512x512@2x.png" > /dev/null

iconutil -c icns "$ICONSET_DIR" -o "$OUTPUT"
rm -rf "$ICONSET_DIR"

echo "Created $OUTPUT"
