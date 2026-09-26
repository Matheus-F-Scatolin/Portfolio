'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { duration, ease, inView } from '@/lib/motion';

// Once settled, the clip is dropped entirely so the heading is never cut off
// (descenders, reflow after a resize).
const wipe = {
  hidden: { clipPath: 'inset(0 0 100% 0)', y: 18 },
  shown: {
    clipPath: 'inset(0 0 -10% 0)',
    y: 0,
    transitionEnd: { clipPath: 'none' },
  },
};

const wipeTransition = { duration: duration.heading, ease: ease.out };
const instant = { duration: 0 };

// Two-tone section heading: the claim in ink, the qualifier in tone.
// Wipes in from the top edge once, as it enters the viewport. The in-view
// observer sits on an unclipped wrapper: a fully clipped element never
// reports as intersecting, so it could never trigger its own reveal.
// The wrapper is the element a parent grid or flex layout sees, so layout
// classes passed in `className` go on it, not on the h2.
export default function SectionHeading({
  lead,
  tail,
  id,
  className = '',
  surface = 'paper',
}: {
  lead: string;
  tail?: string;
  id?: string;
  className?: string;
  surface?: 'paper' | 'stage';
}) {
  const reduce = useReducedMotion();
  const leadColor = surface === 'stage' ? 'text-stage-ink' : 'text-ink';
  const tailColor = surface === 'stage' ? 'text-stage-muted' : 'text-tone';
  // Server and client always render the same `initial` (no hydration
  // mismatch). Reduced motion only changes the transition, which is never
  // serialized; the CSS in globals.css shows [data-reveal] immediately for
  // reduced-motion users and a <noscript> style in layout.tsx does the same
  // without JS.
  return (
    <motion.div className={className || undefined} initial="hidden" whileInView="shown" viewport={inView}>
      <motion.h2
        id={id}
        data-reveal=""
        variants={wipe}
        transition={reduce ? instant : wipeTransition}
        className="max-w-[22ch] text-balance text-[clamp(2rem,3.6vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.035em]"
      >
        <span className={leadColor}>{lead}</span>
        {tail ? <span className={tailColor}> {tail}</span> : null}
      </motion.h2>
    </motion.div>
  );
}
