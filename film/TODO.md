# Film to-dos

## Brain chapter (`brain.py`)

- **A more realistic brain.** `build_brain` reads as a toy. Give it believable folds, surface detail and material.
- **Pull the camera back a little.** The MRI scanner's ring runs off the top of the frame, and other parts get cut too. Widen the framing in `camera_keys`. Afterwards, re-check the label anchors, since `scanner` was moved to the ring's side band for this reason.
- Brain changes mean re-rendering the whole chapter (`film/render_queue.sh 01-brain:brain`), not just the in-between frames.
