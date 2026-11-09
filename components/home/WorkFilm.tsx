'use client';

import { useEffect, useRef } from 'react';
import { filmChapters, filmVersion } from '@/lib/film';

// The Blender film of the four projects, scrubbed by scroll. Frames are WebP
// stills under public/film/<slug>/<width>/, drawn to a canvas; the labels are
// HTML placed on anchors projected from the 3D scene (film.json), so they stay
// crisp at any size. Which frame shows comes from the project text beside the
// stage: each project's text sits in a segment as tall as its chapter, and the
// frame is how far the line the text sticks to has travelled into it.
//
// Frames arrive as compressed blobs. Only the frames the playhead is about to
// reach are decoded, off the main thread, into bitmaps, so drawing a frame
// never waits on a decode. The screen shows one frame per refresh, so when
// the reader scrolls fast the film skips frames; only the ones that will
// actually be drawn are decoded, along the path the playhead is predicted to
// take, and a decode that lands late is kept rather than thrown away. The
// playhead glides toward the scroll position instead of jumping, so a wheel
// notch plays as a run of frames rather than a cut.

type Anchor = [number, number] | 0;
type Label =
  | { type: 'point'; t: string; k: string; dx: number; dy: number }
  | { type: 'span'; t: string; a: string; b: string; show: string; down?: boolean }
  | { type: 'plus'; k: string; show: string }
  | { type: 'card'; t: string; k: string; cls: 'good' | 'bad' }
  | { type: 'tag'; t: string; k: string };
type FilmData = {
  frames: number;
  labels: Label[];
  appear: Record<string, number>;
  vanish: Record<string, number>;
  anchors: Record<string, Anchor[]>;
};
type Placed = { label: Label; el: HTMLElement; line?: SVGElement; tick?: SVGElement; o?: number; size?: number };

const FADE = 10; // frames a label takes to fade in or out
const STRIDES = [16, 8, 4, 2, 1]; // load a coarse pass of the whole film first, then fill in
// Requests in flight at once. Vercel serves HTTP/2, so they share one
// connection; with only a few, the download waits on round trips rather
// than on the line.
const WORKERS = 16;
const TRIES = 3; // a frame that fails to load is asked for again, up to this many times
const NEAR = 12; // frames either side of the current one that load first
const DECODERS = 4; // bitmaps decoding at once, nearest to the playhead first
// When the playhead is slow, decoded frames kept [behind, ahead of] it.
// BUDGET caps the bitmaps held at once: about 150 MB at 1600px and 90 MB at 960px.
const WINDOW = { 1600: [6, 20], 960: [10, 32] } as const;
const BUDGET = { 1600: 26, 960: 42 } as const;
const REFRESH_MS = 1000 / 60; // one display frame
const LOOKAHEAD = 10; // display frames of the playhead's predicted path to decode for
const GLIDE_MS = 50; // time constant of the playhead easing toward the scroll position
const SNAP = 90; // frames; a longer jump (a link, a resize) cuts instead of gliding
const SVG = 'http://www.w3.org/2000/svg';
const V = `?v=${filmVersion}`; // the film is cached for a year; a new render changes this
const POSTER = `url(/film/${filmChapters[0].slug}/960/0001.webp${V})`;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const edge = (x: number) => clamp(x / 0.04) * clamp((1 - x) / 0.04); // fade near the stage edge

export default function WorkFilm() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current!;
    const cv = canvasRef.current!;
    const svg = svgRef.current!;
    const box = boxRef.current!;
    // Frames are opaque, so the canvas needs no blending; it stays hidden
    // until its first frame so the poster behind it shows until then.
    const ctx = cv.getContext('2d', { alpha: false })!;
    const track = stage.closest<HTMLElement>('[data-film-track]')!;
    const segments = Array.from(track.querySelectorAll<HTMLElement>('[data-film-segment]'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Every chapter after the first opens on the frame the last one closed on, so skip it.
    const seq: { c: number; f: number }[] = [];
    const first: number[] = [];
    filmChapters.forEach((ch, c) => {
      first.push(seq.length);
      for (let f = c ? 1 : 0; f < ch.frames; f++) seq.push({ c, f });
    });
    const blobs: (Blob | undefined)[] = new Array(seq.length);
    const bitmaps = new Map<number, ImageBitmap>();
    const decoding = new Set<number>();
    let behind: number = WINDOW[960][0];
    let ahead: number = WINDOW[960][1];
    let budget: number = BUDGET[960];
    let data: FilmData[] | null = null;
    let placed: Placed[][] = [];
    let shownChapter = -1;
    let shown = -1;
    let target = 0; // frame the scroll position asks for
    let head = 0; // frame the playhead is on, easing toward target
    let dir = 1; // which way the reader last moved
    let speed = 0; // how fast the scroll position moves, in frames per ms (smoothed)
    let lastTarget = 0;
    let last = 0;
    let raf = 0;
    let started = false;
    let alive = true;

    // Layout is read here, on resize, and never while scrolling.
    let W = 0;
    let H = 0;
    let focus = 0;
    let perFrame = 1;
    let segTop: number[] = [];

    function measure() {
      track.style.setProperty('--stage-h', `${stage.offsetHeight}px`);
      track.style.setProperty('--vw', `${document.documentElement.clientWidth}px`);
      const text = segments[0]?.firstElementChild;
      focus = text ? parseFloat(getComputedStyle(text).top) || 0 : 0;
      segTop = segments.map((s) => s.getBoundingClientRect().top + window.scrollY);
      // the last segment also holds the final frame while the stage scrolls away,
      // so measure play length from the first one, which has no hold
      perFrame = segments[0].offsetHeight / filmChapters[0].frames;
      W = stage.clientWidth;
      H = stage.clientHeight;
      box.style.fontSize = `${clamp(W * 0.011, 7.5, 13)}px`; // small stages on phones need small labels
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.round(W * dpr);
      const ch = Math.round((W * dpr * 9) / 16);
      if (cv.width === cw && cv.height === ch) return;
      cv.width = cw;
      cv.height = ch;
      // Resizing clears the canvas; repaint at once so it never shows blank.
      const g = shown;
      shown = -1;
      if (g >= 0 && bitmaps.has(g)) paint(g);
      else cv.style.opacity = '0';
    }

    function frameAt() {
      const y = focus + 1 + window.scrollY;
      let c = 0;
      for (let i = 0; i < segTop.length; i++) if (segTop[i] <= y) c = i;
      const n = filmChapters[c].frames;
      const t = clamp((y - segTop[c]) / (perFrame * n));
      const s0 = c ? 1 : 0;
      return first[c] + Math.round(t * (n - 1 - s0));
    }

    // The frames worth decoding, most urgent first: the one under the
    // playhead, then the frames between it and where it will be a few
    // display frames from now if the scroll carries on at its speed, then
    // the one it will settle on, then a window around it that leans the way
    // the reader is scrolling. A fast scroll draws one frame in several, so
    // the path is sampled on a fixed grid of every s-th frame: the same
    // frames stay wanted from one display frame to the next, and a decode
    // started now is still useful when it lands.
    function plan() {
      const out: number[] = [];
      const seen = new Set<number>();
      const add = (g: number) => {
        if (g >= 0 && g < seq.length && blobs[g] && !seen.has(g)) {
          seen.add(g);
          out.push(g);
        }
      };
      const c = Math.round(head);
      add(c);
      const k = 1 - Math.exp(-REFRESH_MS / GLIDE_MS);
      let h = head;
      let t = target;
      for (let i = 0; i < LOOKAHEAD; i++) {
        t += speed * REFRESH_MS;
        h += (t - h) * k;
      }
      const far = Math.round(h);
      const s = Math.max(1, Math.floor(Math.abs(speed) * REFRESH_MS));
      if (far > c) for (let g = Math.ceil((c + 1) / s) * s; g <= far; g += s) add(g);
      else if (far < c) for (let g = Math.floor((c - 1) / s) * s; g >= far; g -= s) add(g);
      add(target);
      for (let d = 1; d <= ahead; d++) {
        add(c + d * dir);
        if (d <= behind) add(c - d * dir);
      }
      return out.slice(0, budget);
    }

    // Decode the planned frames, a few at a time, and once over budget let go
    // of the bitmaps furthest from the playhead that the plan no longer needs.
    function keep() {
      const want = plan();
      const wanted = new Set(want);
      if (bitmaps.size > budget) {
        const c = head;
        const spare = Array.from(bitmaps.keys())
          .filter((g) => !wanted.has(g) && g !== shown)
          .sort((a, b) => Math.abs(b - c) - Math.abs(a - c));
        for (const g of spare) {
          if (bitmaps.size <= budget) break;
          bitmaps.get(g)!.close();
          bitmaps.delete(g);
        }
      }
      for (const g of want) {
        if (decoding.size >= DECODERS) break;
        if (bitmaps.has(g) || decoding.has(g)) continue;
        decoding.add(g);
        createImageBitmap(blobs[g]!)
          .then((bm) => {
            if (alive) bitmaps.set(g, bm);
            else bm.close();
          })
          .catch(() => {})
          .finally(() => {
            decoding.delete(g);
            if (alive) {
              keep();
              request();
            }
          });
      }
    }

    // The decoded frame closest to g.
    function nearest(g: number) {
      let best = -1;
      bitmaps.forEach((_, k) => {
        if (best < 0 || Math.abs(k - g) < Math.abs(best - g)) best = k;
      });
      return best;
    }

    function make<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text: string) {
      const el = document.createElement(tag);
      el.className = `absolute left-0 top-0 whitespace-nowrap uppercase tracking-[0.06em] opacity-0 ${cls}`;
      el.textContent = text;
      box.appendChild(el);
      return el;
    }

    function line(tag: 'line' | 'polyline') {
      const el = document.createElementNS(SVG, tag);
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke', 'currentColor');
      el.setAttribute('vector-effect', 'non-scaling-stroke');
      el.style.opacity = '0';
      svg.appendChild(el);
      return el;
    }

    // Labels move by transform, which skips layout, centred on the point.
    function put(el: HTMLElement, x: number, y: number) {
      el.style.transform = `translate(${(x * W) / 100}px, ${(y * H) / 100}px) translate(-50%, -50%)`;
    }

    function build(d: FilmData) {
      return d.labels.map((label): Placed => {
        switch (label.type) {
          case 'point':
            return { label, el: make('span', 'text-ink', label.t), line: line('line') };
          case 'span':
            return { label, el: make('span', 'text-ink', label.t), line: line('polyline'), tick: line('line') };
          case 'plus':
            return { label, el: make('span', 'text-ink', '+') };
          case 'card':
            return { label, el: make('span', label.cls === 'good' ? 'text-white' : 'text-ink-2', label.t) };
          case 'tag':
            return { label, el: make('span', 'text-ink-2', label.t) };
        }
      });
    }

    function hide(list: Placed[]) {
      for (const p of list) fade(p, 0);
    }

    function place(c: number, f: number) {
      const d = data![c];
      const at = (k: string) => {
        const p = d.anchors[k]?.[f];
        if (!p) return { x: 0, y: 0, in: 0 };
        return { x: p[0] * 100, y: p[1] * 100, in: edge(p[0]) * edge(p[1]) };
      };
      const life = (k: string) => {
        const a = d.appear[k] ?? 1;
        const v = d.vanish[k];
        let o = a <= 1 ? 1 : clamp((f + 1 - a) / FADE);
        if (v) o *= clamp((v - (f + 1)) / FADE);
        return o;
      };
      // Each geometry write makes the browser lay the labels out again, so
      // labels that are invisible on this frame keep their last position.
      for (const pl of placed[c]) {
        const { label: s, el, line: ln, tick } = pl;
        let o = 0;
        if (s.type === 'point') {
          const p = at(s.k);
          o = life(s.k) * p.in;
          if (o > 0) {
            const lx = p.x + s.dx;
            const ly = p.y + s.dy;
            ln!.setAttribute('x1', `${p.x}`);
            ln!.setAttribute('y1', `${p.y}`);
            ln!.setAttribute('x2', `${lx}`);
            ln!.setAttribute('y2', `${ly + (s.dy < 0 ? 1.2 : -1.2)}`);
            put(el, lx, ly);
          }
        } else if (s.type === 'span') {
          const a = at(s.a);
          const b = at(s.b);
          o = life(s.show) * a.in * b.in;
          if (o > 0) {
            const sg = s.down ? 1 : -1;
            const yb = s.down ? Math.max(a.y, b.y) + 1.5 : Math.min(a.y, b.y) - 1.5;
            const mx = (a.x + b.x) / 2;
            ln!.setAttribute('points', `${a.x},${yb - sg * 0.8} ${a.x},${yb} ${b.x},${yb} ${b.x},${yb - sg * 0.8}`);
            tick!.setAttribute('x1', `${mx}`);
            tick!.setAttribute('y1', `${yb}`);
            tick!.setAttribute('x2', `${mx}`);
            tick!.setAttribute('y2', `${yb + sg * 1.2}`);
            put(el, mx, yb + sg * 2.6);
          }
        } else if (s.type === 'plus') {
          const p = at(s.k);
          o = life(s.show) * p.in;
          if (o > 0) {
            put(el, p.x, p.y);
            size(pl, clamp(W * 0.012, 10, 22));
          }
        } else if (s.type === 'card') {
          const p = at(s.k);
          const l = at(`${s.k}_l`);
          const r = at(`${s.k}_r`);
          o = life(s.k) * l.in * r.in;
          if (o > 0) {
            // text scales with the card on screen, so it never runs past its edges
            size(pl, ((r.x - l.x) / 100) * W * 0.085);
            put(el, p.x, p.y);
          }
        } else {
          const p = at(s.k);
          o = life(s.k) * p.in;
          if (o > 0) put(el, p.x, p.y);
        }
        fade(pl, o);
      }
    }

    function size(pl: Placed, px: number) {
      const v = Math.round(px * 10) / 10;
      if (pl.size !== v) pl.el.style.fontSize = `${(pl.size = v)}px`;
    }

    function fade(pl: Placed, o: number) {
      const v = Math.round(o * 100) / 100;
      if (pl.o === v) return;
      pl.o = v;
      pl.el.style.opacity = `${v}`;
      if (pl.line) pl.line.style.opacity = `${v}`;
      if (pl.tick) pl.tick.style.opacity = `${v}`;
    }

    function paint(g: number) {
      ctx.drawImage(bitmaps.get(g)!, 0, 0, cv.width, cv.height);
      if (shown < 0) {
        cv.style.opacity = '1';
        stage.style.backgroundImage = 'none';
      }
      const { c, f } = seq[g];
      if (shownChapter !== c && shownChapter >= 0) hide(placed[shownChapter]);
      shownChapter = c;
      place(c, f);
      shown = g;
    }

    function tick(now: number) {
      raf = 0;
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      // the scroll position's speed, for predicting where the playhead goes next
      speed = speed * 0.6 + ((target - lastTarget) / dt) * 0.4;
      lastTarget = target;
      const gap = target - head;
      if (reduce || Math.abs(gap) > SNAP) {
        head = target;
        speed = 0; // a jump, not a scroll: nothing to predict
      } else head += gap * (1 - Math.exp(-dt / GLIDE_MS));
      if (Math.abs(target - head) < 0.5) head = target;
      if (data) {
        keep();
        const g = nearest(Math.round(head));
        if (g >= 0 && g !== shown) paint(g);
      }
      if (head !== target) raf = requestAnimationFrame(tick);
      else {
        last = 0;
        speed = 0;
      }
    }

    const request = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      const t = frameAt();
      if (t !== target) dir = t > target ? 1 : -1;
      target = t;
      // Until a frame is drawn the stage shows the opening still, but only
      // in the first chapter: anywhere else it would show the wrong project.
      if (shown < 0) stage.style.backgroundImage = seq[target].c ? 'none' : POSTER;
      request();
    };

    async function start() {
      started = true;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = stage.clientWidth * dpr > 1000 ? 1600 : 960;
      [behind, ahead] = WINDOW[width];
      budget = BUDGET[width];
      const loaded = await Promise.all(
        filmChapters.map((ch) => fetch(`/film/${ch.slug}/film.json${V}`).then((r) => r.json() as Promise<FilmData>)),
      );
      if (!alive) return;
      data = loaded;
      placed = data.map(build);
      head = target;
      lastTarget = target;

      const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
      const strides = conn?.saveData ? STRIDES.slice(0, 2) : STRIDES;
      const order: number[] = [];
      const queued = new Uint8Array(seq.length);
      for (const s of strides) {
        for (let g = 0; g < seq.length; g += s) {
          if (!queued[g]) {
            queued[g] = 1;
            order.push(g);
          }
        }
      }
      // Frames near the one on screen jump the queue, so a reader who lands
      // mid-section, or scrolls fast, gets their chapter before the rest.
      // The warm-up itself asks for low priority, so it never holds up the
      // page's own images; frames near the reader ask for high.
      const taken = new Uint8Array(seq.length);
      const tries = new Uint8Array(seq.length);
      let next = 0;
      let urgent = false;
      const pick = () => {
        urgent = true;
        for (let d = 0; d <= NEAR; d++) {
          for (const g of [target + d, target - d]) {
            if (queued[g] && !taken[g]) return g;
          }
        }
        urgent = false;
        while (next < order.length && taken[order[next]]) next++;
        return next < order.length ? order[next++] : -1;
      };
      const worker = async () => {
        for (let g = pick(); alive && g >= 0; g = pick()) {
          taken[g] = 1;
          const { c, f } = seq[g];
          const url = `/film/${filmChapters[c].slug}/${width}/${String(f + 1).padStart(4, '0')}.webp${V}`;
          try {
            const r = await fetch(url, { priority: urgent ? 'high' : 'low' });
            if (!r.ok) throw new Error(`${r.status}`);
            blobs[g] = await r.blob();
          } catch {
            // back of the queue, so one bad frame never stalls the rest
            if (++tries[g] < TRIES) {
              taken[g] = 0;
              order.push(g);
            }
            continue;
          }
          if (alive && decoding.size < DECODERS) keep();
        }
      };
      for (let i = 0; i < WORKERS; i++) worker();
      onScroll();
    }

    measure();
    onScroll();
    // Warm the film as soon as the page has settled, so it is loaded by the
    // time the reader scrolls to it. A reader who gets there first (a deep
    // link, a fast scroll) starts it on the way; data saver waits for that.
    const begin = () => {
      if (!started) start();
    };
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && begin(), {
      rootMargin: '150% 0px 150% 0px',
    });
    io.observe(track);
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    let idle = 0;
    const warm = () => {
      idle = window.requestIdleCallback
        ? window.requestIdleCallback(begin, { timeout: 2000 })
        : window.setTimeout(begin, 200);
    };
    if (!saveData) {
      if (document.readyState === 'complete') warm();
      else window.addEventListener('load', warm, { once: true });
    }
    // The stage resizing, or anything above the film changing height, moves
    // where the segments sit on the page.
    const ro = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    ro.observe(stage);
    ro.observe(document.body);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      alive = false;
      window.removeEventListener('load', warm);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
      bitmaps.forEach((bm) => bm.close());
      bitmaps.clear();
      box.replaceChildren();
      svg.replaceChildren();
    };
  }, []);

  return (
    <div
      ref={stageRef}
      aria-hidden="true"
      className="film-fade relative aspect-video w-full bg-cover font-mono"
      style={{ backgroundImage: POSTER }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-0" />
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible text-ink"
      />
      <div ref={boxRef} className="pointer-events-none absolute inset-0" />
    </div>
  );
}
