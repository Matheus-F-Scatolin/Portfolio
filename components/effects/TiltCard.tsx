'use client';

import { ReactNode, useRef } from 'react';
import { motion, useReducedMotion, useSpring } from 'framer-motion';

const MAX_TILT = 2.5;
const SPRING = { stiffness: 260, damping: 22, mass: 0.8 };

export default function TiltCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const rotateX = useSpring(0, SPRING);
  const rotateY = useSpring(0, SPRING);

  const onPointerMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType === 'touch') return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Consumed by the border-glow overlay inside the card.
    el.style.setProperty('--mx', `${x}px`);
    el.style.setProperty('--my', `${y}px`);
    if (reduced) return;
    rotateY.set((x / rect.width - 0.5) * 2 * MAX_TILT);
    rotateX.set(-(y / rect.height - 0.5) * 2 * MAX_TILT);
  };

  const onPointerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
