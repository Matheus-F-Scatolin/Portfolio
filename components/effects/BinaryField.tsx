'use client';

import { useEffect, useRef } from 'react';

const CELL = 18;
const FONT = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
const RADIUS = 150;
const DPR_CAP = 1.5;
const BASE_COLOR = 'rgba(148, 163, 184, 0.09)';
const DECAY_PER_S = 1.6;

// One-shot intro: clusters of the field resolve into these, then dissolve back.
const WORDS = ['AI', 'QUANT', 'SECURITY'];
const SCRAMBLE_END = 1.0;
const HOLD_END = 2.4;
const FADE_END = 3.4;

type Word = { text: string; row: number; col: number };

export default function BinaryField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;
    // Touch and reduced-motion users get the static dim grid only.
    const interactive = fine && !reduced;

    let dpr = 1;
    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let bits = new Uint8Array(0);
    let energy = new Float32Array(0);
    let base: HTMLCanvasElement | null = null;
    let bctx: CanvasRenderingContext2D | null = null;
    let words: Word[] = [];

    let raf = 0;
    let running = false;
    let last = 0;
    let inView = true;
    // Frame-accumulated so a throttled/background tab pauses the intro
    // instead of silently skipping it.
    let introElapsed = 0;
    let introDone = !interactive;
    let lastActive = 0;
    let pointerX = 0;
    let pointerY = 0;
    let pointerFresh = false;

    const cellChar = (i: number) => (bits[i] ? '1' : '0');

    function paintStatic() {
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      if (base) ctx!.drawImage(base, 0, 0);
    }

    function rebuild() {
      const rect = canvas!.getBoundingClientRect();
      w = Math.floor(rect.width);
      h = Math.floor(rect.height);
      if (w === 0 || h === 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      cols = Math.ceil(w / CELL);
      rows = Math.ceil(h / CELL);
      const n = cols * rows;
      bits = new Uint8Array(n);
      for (let i = 0; i < n; i++) bits[i] = Math.random() < 0.5 ? 0 : 1;
      energy = new Float32Array(n);

      // Pre-render the dim resting grid once; each frame is then one blit
      // plus only the cells that are currently lit.
      base = document.createElement('canvas');
      base.width = canvas!.width;
      base.height = canvas!.height;
      bctx = base.getContext('2d');
      if (!bctx) return;
      bctx.scale(dpr, dpr);
      bctx.font = FONT;
      bctx.textAlign = 'center';
      bctx.textBaseline = 'middle';
      bctx.fillStyle = BASE_COLOR;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          bctx.fillText(cellChar(r * cols + c), c * CELL + CELL / 2, r * CELL + CELL / 2);
        }
      }

      words = [];
      if (interactive) {
        WORDS.forEach((text, k) => {
          const row = Math.round(rows * (0.3 + 0.2 * k));
          const col = Math.min(Math.round(cols * 0.62), cols - text.length - 1);
          if (col > 0 && row > 0 && row < rows) words.push({ text, row, col });
        });
      }

      paintStatic();
    }

    function flipBit(i: number) {
      if (!bctx) return;
      bits[i] ^= 1;
      const c = i % cols;
      const r = (i / cols) | 0;
      bctx.clearRect(c * CELL, r * CELL, CELL, CELL);
      bctx.fillStyle = BASE_COLOR;
      bctx.fillText(cellChar(i), c * CELL + CELL / 2, r * CELL + CELL / 2);
    }

    function drawIntro(it: number) {
      for (const wd of words) {
        for (let k = 0; k < wd.text.length; k++) {
          const settleAt = 0.35 + (k / wd.text.length) * (SCRAMBLE_END - 0.35);
          const x = (wd.col + k) * CELL + CELL / 2;
          const y = wd.row * CELL + CELL / 2;
          let ch: string;
          let alpha: number;
          let color: string;
          if (it < settleAt) {
            ch = Math.random() < 0.5 ? '0' : '1';
            alpha = 0.55;
            color = '147, 197, 253';
          } else if (it < HOLD_END) {
            ch = wd.text[k];
            alpha = 0.95;
            color = '191, 219, 254';
          } else {
            ch = wd.text[k];
            alpha = 0.95 * (1 - (it - HOLD_END) / (FADE_END - HOLD_END));
            color = '191, 219, 254';
          }
          if (alpha > 0.3) ctx!.clearRect(x - CELL / 2, y - CELL / 2, CELL, CELL);
          ctx!.fillStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
          ctx!.fillText(ch, x, y);
        }
      }
    }

    function frame(t: number) {
      raf = 0;
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;

      if (pointerFresh) {
        pointerFresh = false;
        const rect = canvas!.getBoundingClientRect();
        const x = pointerX - rect.left;
        const y = pointerY - rect.top;
        if (x > -RADIUS && y > -RADIUS && x < w + RADIUS && y < h + RADIUS) {
          const c0 = Math.max(0, ((x - RADIUS) / CELL) | 0);
          const c1 = Math.min(cols - 1, Math.ceil((x + RADIUS) / CELL));
          const r0 = Math.max(0, ((y - RADIUS) / CELL) | 0);
          const r1 = Math.min(rows - 1, Math.ceil((y + RADIUS) / CELL));
          for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
              const cx = c * CELL + CELL / 2;
              const cy = r * CELL + CELL / 2;
              const d = Math.hypot(cx - x, cy - y);
              if (d < RADIUS) {
                const i = r * cols + c;
                const f = (1 - d / RADIUS) ** 2;
                if (f > energy[i]) {
                  if (f > 0.35 && Math.random() < 0.06) flipBit(i);
                  energy[i] = f;
                }
              }
            }
          }
        }
      }

      paintStatic();
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.font = FONT;
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';

      let active = 0;
      for (let i = 0; i < energy.length; i++) {
        const e = energy[i];
        if (e <= 0.001) continue;
        const c = i % cols;
        const r = (i / cols) | 0;
        const alpha = Math.min(0.9, 0.1 + e * 0.85);
        ctx!.fillStyle = `rgba(147, 197, 253, ${alpha.toFixed(3)})`;
        ctx!.fillText(cellChar(i), c * CELL + CELL / 2, r * CELL + CELL / 2);
        energy[i] = Math.max(0, e - DECAY_PER_S * dt * (0.3 + e));
        if (energy[i] > 0.001) active++;
      }
      lastActive = active;

      let introActive = false;
      if (!introDone && words.length > 0) {
        introElapsed += dt;
        const it = introElapsed;
        if (it >= FADE_END) {
          introDone = true;
        } else {
          introActive = true;
          drawIntro(it);
        }
      }

      if (active > 0 || introActive) {
        raf = requestAnimationFrame(frame);
      } else {
        running = false;
        paintStatic();
      }
    }

    function start() {
      if (running || !inView) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      running = false;
    }

    const onMove = (e: PointerEvent) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      pointerFresh = true;
      if (inView) start();
    };

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (!inView) {
        stop();
      } else if (!introDone || lastActive > 0) {
        start();
      }
    });
    io.observe(canvas);

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const rect = canvas!.getBoundingClientRect();
        if (Math.floor(rect.width) === w && Math.floor(rect.height) === h) return;
        stop();
        rebuild();
        if (inView && (!introDone || lastActive > 0)) start();
      }, 150);
    };

    rebuild();
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);
    if (interactive) {
      window.addEventListener('pointermove', onMove, { passive: true });
      start();
    }

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.clearTimeout(resizeTimer);
      if (interactive) window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2"
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{
          maskImage:
            'radial-gradient(ellipse 75% 70% at 50% 45%, black 35%, transparent 78%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 75% 70% at 50% 45%, black 35%, transparent 78%)',
        }}
      />
    </div>
  );
}
