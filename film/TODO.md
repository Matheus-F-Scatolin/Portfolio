# Film to-dos

## Double the frame rate

All four chapters, so the scrub is smoother. The code is in place: the film plays each scene in half steps (see "film plumbing" in `lib.py`), and the page constants (`VH_PER_FRAME`, `FADE`, `STRIDES`, `NEAR`) are already halved or doubled to match, so they must ship together with the new frames.

The existing renders stay. Only the frames in between get rendered (~690 frames at ~20 s each).

**Where it stopped (3 Nov, 14:00):** all four chapters in `film/out` are already respaced (don't run `respace.sh` again). Brain's in-betweens 2–262 are rendered; 264–350 are left, then the other three chapters. To resume:

```sh
FRAMES=264:350:2 film/render_queue.sh 01-brain:brain
FRAMES=between film/render_queue.sh 02-legal:legal 03-kernelnet:kernelnet 04-stellar:stellar
film/publish.sh
```

Then check the film on the page, and commit `public/film`, `lib/film.ts` and this branch's page constants together.

- Brain: if the brain to-dos below come first, render it whole instead (`film/render_queue.sh 01-brain:brain`).
- Expect `public/film` to roughly double, from 17 MB to about 34 MB.

## Brain chapter (`brain.py`)

- **A more realistic brain.** `build_brain` reads as a toy. Give it believable folds, surface detail and material.
- **Pull the camera back a little.** The MRI scanner's ring runs off the top of the frame, and other parts get cut too. Widen the framing in `camera_keys`. Afterwards, re-check the label anchors, since `scanner` was moved to the ring's side band for this reason.
