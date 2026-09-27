'use client';

import Image from 'next/image';
import { AnimatePresence, motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import SectionHeading from '@/components/ui/SectionHeading';
import { educationStory, schools, type School } from '@/lib/profile';
import { duration, ease } from '@/lib/motion';

type SchoolId = School['id'];

const byId = new Map(schools.map((school) => [school.id, school]));
const indexOrder: SchoolId[] = ['unicamp', 'ie', 'canada', 'ilimit'];

// Every word of the paragraph gets its own slice of the scroll. Words keep the
// space around them, so the text wraps exactly as plain text would. A school
// name is a button, which wraps as one box, so punctuation right after it
// (", with") is pulled next to it and kept on its line.
const punctuation = /^[,.;:]/;
const segments = (() => {
  let n = 0;
  const toWords = (text: string) => (text.match(/\s*\S+\s*/g) ?? []).map((word) => ({ word, i: n++ }));
  const out = educationStory.map((segment, s) => {
    const text = educationStory[s - 1]?.school ? segment.text.replace(punctuation, '') : segment.text;
    const words = toWords(text);
    const glued = segment.school ? educationStory[s + 1]?.text.match(punctuation)?.[0] : undefined;
    // The glued mark fades with the last word of the name.
    return { ...segment, words, after: glued ? { word: glued, i: words[words.length - 1].i } : null };
  });
  return { out, total: n };
})();

// Each word fades from 45% to full ink as the paragraph crosses the screen.
// Opacity only, so it stays on the compositor. 45% ink on paper still clears
// 3:1 at this size if someone stops mid-way. The spans carry data-reveal, so
// reduced motion and no-JS show the finished paragraph (globals.css and the
// noscript style in layout.tsx).
function Word({ progress, i, children }: { progress: MotionValue<number>; i: number; children: ReactNode }) {
  const span = 0.12;
  const start = (i / segments.total) * (1 - span);
  const opacity = useTransform(progress, [start, start + span], [0.45, 1]);
  return (
    <motion.span data-reveal="" style={{ opacity }}>
      {children}
    </motion.span>
  );
}

const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function SchoolCard({ school, onClose }: { school: School; onClose: () => void }) {
  return (
    <>
      {school.photo ? (
        <div className="relative h-[15.5rem] overflow-hidden rounded-[16px] bg-panel md:h-[13.75rem]">
          <Image
            src={school.photo.src}
            alt={school.photo.alt}
            fill
            sizes="(min-width: 768px) 316px, calc(100vw - 58px)"
            className="object-cover"
            style={school.photo.position ? { objectPosition: school.photo.position } : undefined}
          />
        </div>
      ) : null}
      <button
        type="button"
        onClick={onClose}
        aria-label={`Close ${school.short} details`}
        className="absolute right-5 top-5 grid size-11 place-items-center rounded-full bg-paper/90 text-ink backdrop-blur transition-colors duration-300 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-panel"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
          <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
        </svg>
      </button>
      <div className={`px-1.5 pb-1 pt-3.5 md:px-2 ${school.photo ? '' : 'pr-14'}`}>
        <p className="font-mono text-[12px] leading-[18px] text-muted md:text-[13px]">
          {school.dates} · {school.place}
        </p>
        <p className="mt-2 text-[17px] font-medium leading-[1.35] tracking-[-0.01em] text-ink">{school.name}</p>
        <p className="mt-0.5 text-[15px] leading-[1.5] text-ink-2">{school.program}</p>
        <p className="mt-2.5 font-mono text-[12px] leading-[18px] text-ink-2 md:text-[13px]">{school.detail}</p>
      </div>
    </>
  );
}

// One first-person paragraph instead of a list. School names are buttons that
// open a card with that school's details: on click anywhere, and on hover with
// a mouse. From md up the card floats under the name; on phones it opens
// under the paragraph. The index row under it keeps the facts skimmable.
export default function Education() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const buttons = useRef(new Map<SchoolId, HTMLButtonElement>());
  const closeTimer = useRef<number>();
  const [open, setOpen] = useState<{ id: SchoolId; pinned: boolean } | null>(null);
  const openRef = useRef(open);
  const [anchor, setAnchor] = useState({ left: 0, top: 0 });

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const { scrollYProgress } = useScroll({ target: textRef, offset: ['start 0.85', 'end 0.55'] });

  const place = useCallback((id: SchoolId) => {
    const button = buttons.current.get(id);
    const wrap = wrapRef.current;
    if (!button || !wrap) return;
    const b = button.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    const cardWidth = 340;
    setAnchor({
      left: Math.max(0, Math.min(b.left - w.left - 16, w.width - cardWidth)),
      top: b.bottom - w.top + 14,
    });
  }, []);

  const show = useCallback(
    (id: SchoolId, pinned: boolean) => {
      window.clearTimeout(closeTimer.current);
      place(id);
      setOpen((current) => (current?.pinned && !pinned ? current : { id, pinned }));
    },
    [place]
  );

  const close = useCallback((refocus = false) => {
    window.clearTimeout(closeTimer.current);
    if (refocus && openRef.current) buttons.current.get(openRef.current.id)?.focus();
    setOpen(null);
  }, []);

  const closeSoon = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen((current) => (current?.pinned ? current : null)), 180);
  };

  // Escape closes; a click outside closes a pinned card; a resize re-anchors.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(true);
    };
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    const onResize = () => place(open.id);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', onResize);
    };
  }, [open, close, place]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const current = open ? byId.get(open.id) : undefined;

  return (
    <section id="education" aria-labelledby="education-title" className="pb-24 pt-8 md:pb-32 md:pt-16">
      <div className="mx-auto w-full max-w-page px-4 md:px-8">
        <SectionHeading id="education-title" lead="Education." />

        <div ref={wrapRef} className="relative mt-8 md:mt-12">
          <p
            ref={textRef}
            className="max-w-[1100px] text-pretty text-[26px] font-medium leading-[1.25] tracking-[-0.02em] text-ink md:text-[clamp(2rem,3vw,2.5rem)] md:leading-[1.22] md:tracking-[-0.025em]"
          >
            {segments.out.map((segment, s) => {
              const words = segment.words.map(({ word, i }) => (
                <Word key={i} progress={scrollYProgress} i={i}>
                  {word}
                </Word>
              ));
              if (!segment.school) return <span key={s}>{words}</span>;
              const id = segment.school;
              const expanded = open?.id === id;
              const button = (
                <button
                  key={s}
                  type="button"
                  ref={(el) => {
                    if (el) buttons.current.set(id, el);
                  }}
                  aria-expanded={expanded}
                  aria-controls={expanded ? 'education-card' : undefined}
                  onClick={() => (expanded && open?.pinned ? close() : show(id, true))}
                  onMouseEnter={() => finePointer() && show(id, false)}
                  onMouseLeave={() => finePointer() && closeSoon()}
                  className={`inline cursor-pointer text-left underline decoration-[1.5px] underline-offset-[6px] transition-[text-decoration-color] duration-300 md:decoration-2 md:underline-offset-8 ${
                    expanded ? 'decoration-ink' : 'decoration-ink/25 [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-ink'
                  }`}
                >
                  {words}
                </button>
              );
              if (!segment.after) return button;
              return (
                <span key={s} className="whitespace-nowrap">
                  {button}
                  <Word progress={scrollYProgress} i={segment.after.i}>
                    {segment.after.word}
                  </Word>
                </span>
              );
            })}
          </p>

          <AnimatePresence>
            {current ? (
              <motion.div
                key={current.id}
                id="education-card"
                role="region"
                aria-label={current.name}
                onMouseEnter={() => window.clearTimeout(closeTimer.current)}
                onMouseLeave={() => finePointer() && closeSoon()}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: duration.ui, ease: ease.out }}
                style={{ ['--x' as string]: `${anchor.left}px`, ['--y' as string]: `${anchor.top}px` }}
                className="relative z-10 mt-7 rounded-surface border border-line bg-white p-3 shadow-[0_28px_56px_-28px_rgb(14_15_17/0.35)] md:absolute md:left-[var(--x)] md:top-[var(--y)] md:mt-0 md:w-[340px]"
              >
                <SchoolCard school={current} onClose={() => close(true)} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <ul role="list" className="mt-10 border-t border-line md:mt-20 md:grid md:grid-cols-4 md:gap-x-8 md:pt-5">
          {indexOrder.map((id) => {
            const school = byId.get(id)!;
            return (
              <li
                key={id}
                className="flex items-baseline justify-between gap-3 border-b border-line py-4 md:block md:border-0 md:py-0"
              >
                <p className="text-[15px] font-medium leading-[1.5] text-ink">{school.short}</p>
                <p className="font-mono text-[12px] leading-[18px] text-muted md:mt-1 md:text-[13px]">
                  {school.years} · {school.place.split(',')[0]}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
