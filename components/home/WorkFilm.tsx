'use client';

import { useEffect, useRef } from 'react';
import { filmChapters } from '@/lib/film';

// The Blender film of the four projects, scrubbed by scroll. Frames are WebP
// stills under public/film/<slug>/<width>/, drawn to a canvas; the labels are
// HTML placed on anchors projected from the 3D scene (film.json), so they stay
// crisp at any size. Which frame shows comes from the project text beside the
// stage: each project's text sits in a segment as tall as its chapter, and the
// frame is how far the line the text sticks to has travelled into it.

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
type Placed = { label: Label; el: HTMLElement; line?: SVGElement; tick?: SVGElement };

const FADE = 5; // frames a label takes to fade in or out
const STRIDES = [8, 4, 2, 1]; // load a coarse pass of the whole film first, then fill in
const WORKERS = 6;
const NEAR = 6; // frames either side of the current one that load first
const SVG = 'http://www.w3.org/2000/svg';
const POSTER = `url(/film/${filmChapters[0].slug}/960/0001.webp)`;

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
    const ctx = cv.getContext('2d')!;
    const track = stage.closest<HTMLElement>('[data-film-track]')!;
    const segments = Array.from(track.querySelectorAll<HTMLElement>('[data-film-segment]'));

    // Every chapter after the first opens on the frame the last one closed on, so skip it.
    const seq: { c: number; f: number }[] = [];
    const first: number[] = [];
    filmChapters.forEach((ch, c) => {
      first.push(seq.length);
      for (let f = c ? 1 : 0; f < ch.frames; f++) seq.push({ c, f });
    });
    const imgs: (HTMLImageElement | undefined)[] = new Array(seq.length);
    let data: FilmData[] | null = null;
    let placed: Placed[][] = [];
    let shownChapter = -1;
    let shown = -1;
    let target = 0;
    let focus = 0;
    let raf = 0;
    let started = false;
    let alive = true;

    function measure() {
      track.style.setProperty('--stage-h', `${stage.offsetHeight}px`);
      track.style.setProperty('--vw', `${document.documentElement.clientWidth}px`);
      const text = segments[0]?.firstElementChild;
      focus = text ? parseFloat(getComputedStyle(text).top) || 0 : 0;
      const w = stage.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round((w * dpr * 9) / 16);
      box.style.fontSize = `${clamp(w * 0.011, 7.5, 13)}px`; // small stages on phones need small labels
      shown = -1;
    }

    function frameAt() {
      const y = focus + 1;
      let c = 0;
      for (let i = 0; i < segments.length; i++) if (segments[i].getBoundingClientRect().top <= y) c = i;
      // the last segment also holds the final frame while the stage scrolls away,
      // so measure play length from the first one, which has no hold
      const perFrame = segments[0].offsetHeight / filmChapters[0].frames;
      const n = filmChapters[c].frames;
      const t = clamp((y - segments[c].getBoundingClientRect().top) / (perFrame * n));
      const s0 = c ? 1 : 0;
      return first[c] + Math.round(t * (n - 1 - s0));
    }

    function nearest(g: number) {
      for (let d = 0; d < seq.length; d++) {
        if (imgs[g - d]) return g - d;
        if (imgs[g + d]) return g + d;
      }
      return -1;
    }

    function make<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text: string) {
      const el = document.createElement(tag);
      el.className = `absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap uppercase tracking-[0.06em] opacity-0 ${cls}`;
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
      for (const p of list) {
        p.el.style.opacity = '0';
        if (p.line) p.line.style.opacity = '0';
        if (p.tick) p.tick.style.opacity = '0';
      }
    }

    function place(c: number, f: number) {
      const d = data![c];
      const W = stage.clientWidth;
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
      for (const { label: s, el, line: ln, tick } of placed[c]) {
        let o = 0;
        if (s.type === 'point') {
          const p = at(s.k);
          o = life(s.k) * p.in;
          const lx = p.x + s.dx;
          const ly = p.y + s.dy;
          ln!.setAttribute('x1', `${p.x}`);
          ln!.setAttribute('y1', `${p.y}`);
          ln!.setAttribute('x2', `${lx}`);
          ln!.setAttribute('y2', `${ly + (s.dy < 0 ? 1.2 : -1.2)}`);
          ln!.style.opacity = `${o}`;
          el.style.left = `${lx}%`;
          el.style.top = `${ly}%`;
        } else if (s.type === 'span') {
          const a = at(s.a);
          const b = at(s.b);
          o = life(s.show) * a.in * b.in;
          const sg = s.down ? 1 : -1;
          const yb = s.down ? Math.max(a.y, b.y) + 1.5 : Math.min(a.y, b.y) - 1.5;
          const mx = (a.x + b.x) / 2;
          ln!.setAttribute('points', `${a.x},${yb - sg * 0.8} ${a.x},${yb} ${b.x},${yb} ${b.x},${yb - sg * 0.8}`);
          tick!.setAttribute('x1', `${mx}`);
          tick!.setAttribute('y1', `${yb}`);
          tick!.setAttribute('x2', `${mx}`);
          tick!.setAttribute('y2', `${yb + sg * 1.2}`);
          ln!.style.opacity = tick!.style.opacity = `${o}`;
          el.style.left = `${mx}%`;
          el.style.top = `${yb + sg * 2.6}%`;
        } else if (s.type === 'plus') {
          const p = at(s.k);
          o = life(s.show) * p.in;
          el.style.left = `${p.x}%`;
          el.style.top = `${p.y}%`;
          el.style.fontSize = `${clamp(W * 0.012, 10, 22)}px`;
        } else if (s.type === 'card') {
          const p = at(s.k);
          const l = at(`${s.k}_l`);
          const r = at(`${s.k}_r`);
          o = life(s.k) * l.in * r.in;
          // text scales with the card on screen, so it never runs past its edges
          el.style.fontSize = `${((r.x - l.x) / 100) * W * 0.085}px`;
          el.style.left = `${p.x}%`;
          el.style.top = `${p.y}%`;
        } else {
          const p = at(s.k);
          o = life(s.k) * p.in;
          el.style.left = `${p.x}%`;
          el.style.top = `${p.y}%`;
        }
        el.style.opacity = `${o}`;
      }
    }

    function draw() {
      raf = 0;
      if (!data) return;
      const g = nearest(target);
      if (g < 0 || g === shown) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(imgs[g]!, 0, 0, cv.width, cv.height);
      stage.style.backgroundImage = 'none';
      const { c, f } = seq[g];
      if (shownChapter !== c && shownChapter >= 0) hide(placed[shownChapter]);
      shownChapter = c;
      place(c, f);
      shown = g;
    }

    const request = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    const onScroll = () => {
      target = frameAt();
      // Until a frame is drawn the stage shows the opening still, but only
      // in the first chapter: anywhere else it would show the wrong project.
      if (shown < 0) stage.style.backgroundImage = seq[target].c ? 'none' : POSTER;
      request();
    };

    async function start() {
      started = true;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = stage.clientWidth * dpr > 1000 ? 1600 : 960;
      const loaded = await Promise.all(
        filmChapters.map((ch) => fetch(`/film/${ch.slug}/film.json`).then((r) => r.json() as Promise<FilmData>)),
      );
      if (!alive) return;
      data = loaded;
      placed = data.map(build);

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
      const taken = new Uint8Array(seq.length);
      let next = 0;
      const pick = () => {
        for (let d = 0; d <= NEAR; d++) {
          for (const g of [target + d, target - d]) {
            if (queued[g] && !taken[g]) return g;
          }
        }
        while (next < order.length && taken[order[next]]) next++;
        return next < order.length ? order[next++] : -1;
      };
      const worker = async () => {
        for (let g = pick(); alive && g >= 0; g = pick()) {
          taken[g] = 1;
          const { c, f } = seq[g];
          const im = new Image();
          im.src = `/film/${filmChapters[c].slug}/${width}/${String(f + 1).padStart(4, '0')}.webp`;
          try {
            await im.decode();
          } catch {
            continue;
          }
          imgs[g] = im;
          request();
        }
      };
      for (let i = 0; i < WORKERS; i++) worker();
      onScroll();
    }

    measure();
    onScroll();
    const io = new IntersectionObserver(
      (entries) => {
        if (!started && entries.some((e) => e.isIntersecting)) start();
      },
      { rootMargin: '150% 0px 150% 0px' },
    );
    io.observe(track);
    const ro = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    ro.observe(stage);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      alive = false;
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
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
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
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
