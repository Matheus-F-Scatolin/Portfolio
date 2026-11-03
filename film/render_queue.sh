#!/bin/sh
# Final renders, one chapter at a time (one GPU), each followed by its WebP encode.
#   film/render_queue.sh 02-legal:legal 03-kernelnet:kernelnet 04-stellar:stellar
# Waits for any Blender render already running so two never share the GPU.
cd "$(dirname "$0")"
B=/Applications/Blender.app/Contents/MacOS/Blender
for pair in "$@"; do
  dir=${pair%%:*}; script=${pair##*:}
  # several queues may run at once; the lock (and the pgrep for hand-started renders) keeps it to one render
  until mkdir out/.render.lock 2>/dev/null; do sleep 20; done
  while pgrep -f "Blender.*--frames all" > /dev/null; do sleep 30; done
  echo "$(date +%H:%M) $dir start"
  $B -b --factory-startup --python "$script.py" -- --out "out/$dir" --frames all --pct 100 --samples 48 > "out/$dir.log" 2>&1
  rmdir out/.render.lock
  ./encode.sh "out/$dir"
  echo "$(date +%H:%M) $dir done ($(ls out/$dir/frames | wc -l) frames)"
done
