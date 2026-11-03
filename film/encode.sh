#!/bin/sh
# Turn a chapter's transparent PNG frames into WebP over the page colour, for the scroll page.
#   film/encode.sh film/out/anim-full [width]
set -e
dir=$1
w=${2:-1920}
mkdir -p "$dir/webp"
for png in "$dir"/frames/*.png; do
  out="$dir/webp/$(basename "$png" .png).webp"
  [ "$out" -nt "$png" ] && continue
  cwebp -quiet -q 80 -m 5 -blend_alpha 0xF3F4F6 -resize "$w" 0 "$png" -o "$out"
done
cp "$(dirname "$0")/scrub.html" "$(dirname "$dir")/index.html"
