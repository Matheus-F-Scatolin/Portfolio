'use client';

import { useEffect, useRef } from 'react';

const SIZE = 600;

export default function CursorSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    let running = false;
    let shown = false;

    const frame = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      if (Math.abs(tx - cx) < 0.5 && Math.abs(ty - cy) < 0.5) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        shown = true;
        cx = tx;
        cy = ty;
        el.style.opacity = '1';
      }
      if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed -z-10 opacity-0 transition-opacity duration-700"
      style={{
        left: -SIZE / 2,
        top: -SIZE / 2,
        width: SIZE,
        height: SIZE,
        background:
          'radial-gradient(circle closest-side, rgba(59, 130, 246, 0.07), transparent)',
        willChange: 'transform',
      }}
    />
  );
}
