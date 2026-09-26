'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { duration, ease, inView } from '@/lib/motion';

// Calm entrance for body blocks: a short fade and rise, once.
// Server and client always render the same `initial` (no hydration mismatch).
// Reduced motion only changes the transition, which is never serialized; the
// CSS in globals.css shows [data-reveal] immediately for reduced-motion users
// and a <noscript> style in layout.tsx does the same without JS.
export default function Reveal({
  children,
  delay = 0,
  y = 14,
  className,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'li' | 'section' | 'article';
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      data-reveal=""
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={inView}
      transition={reduce ? { duration: 0 } : { duration: duration.reveal, ease: ease.expo, delay }}
    >
      {children}
    </Tag>
  );
}
