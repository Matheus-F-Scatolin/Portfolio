#!/bin/sh
# Renumber a chapter rendered at one film frame per scene frame onto the
# half-step grid (k -> 2k - 1, see "film plumbing" in lib.py), so that
# FRAMES=between render_queue.sh only renders the frames in between.
# Drops webp/ and flat/, which are rebuilt from the renumbered frames.
#   film/respace.sh film/out/03-kernelnet
set -e
dir=$1
n=$(ls "$dir/frames" | wc -l | tr -d ' ')
[ "$(ls "$dir/frames" | sort | tail -1)" = "$(printf %04d.png "$n")" ] || { echo "$dir: frames are not 1..$n, already respaced?"; exit 1; }
for k in $(seq "$n" -1 2); do
  mv "$dir/frames/$(printf %04d "$k").png" "$dir/frames/$(printf %04d $((2 * k - 1))).png"
done
rm -rf "$dir/webp" "$dir/flat"
echo "$dir: $n frames now at 1, 3 .. $((2 * n - 1))"
