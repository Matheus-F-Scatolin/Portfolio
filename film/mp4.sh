#!/bin/sh
# Preview videos from the encoded frames: one per chapter plus the whole film.
#   film/mp4.sh 01-brain 02-legal 03-kernelnet 04-stellar
# Chapters after the first skip frame 1, which repeats the previous chapter's last frame.
cd "$(dirname "$0")/out"
list=$(mktemp)
first=1
for dir in "$@"; do
  ffmpeg -loglevel error -y -framerate 24 -i "$dir/webp/%04d.webp" -c:v libx264 -pix_fmt yuv420p -crf 18 "$dir.mp4"
  start=$([ $first = 1 ] && echo 1 || echo 2)
  for f in $(ls "$dir/webp" | sort); do
    n=$(basename "$f" .webp | sed 's/^0*//')
    [ "$n" -ge "$start" ] && echo "file '$PWD/$dir/webp/$f'" >> "$list" && echo "duration 0.041667" >> "$list"
  done
  first=0
done
ffmpeg -loglevel error -y -f concat -safe 0 -i "$list" -vf fps=24 -c:v libx264 -pix_fmt yuv420p -crf 18 film.mp4
rm "$list"
