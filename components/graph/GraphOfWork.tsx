'use client';

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { useCallback, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { ease } from '@/lib/motion';
import Excerpt from './Excerpt';
import GraphFigure from './GraphFigure';
import {
  CHAPTERS,
  FIGURE_TEXT,
  RAIL_TARGETS,
  STATIC_PROGRESS,
  TIMELINE,
  TRACE,
  chapterAt,
  triples,
} from './data';

// Three versions, chosen by viewport. The pinned, scroll-driven one runs on
// viewports at least 768 wide and 600 tall (wide figure) and on portrait
// phones at least 360 wide and 640 tall (phone figure), in both cases without
// reduced motion. Everything else, landscape phones included, gets the static
// chapters. The server renders all three and CSS shows the right one, so there
// is no hydration mismatch and no flash; after mount the hidden ones unmount.
// Keep the two queries and the three CSS classes below on the same thresholds.
// Without JS the pinned versions never move, so the noscript style in
// app/layout.tsx swaps in the static one by data-graph.
const WIDE_QUERY = '(min-width: 768px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)';
const PHONE_QUERY =
  '(min-width: 360px) and (max-width: 767.98px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)';
const showWhenWide = 'hidden [@media(min-width:768px)_and_(min-height:600px)]:motion-safe:block';
const showWhenPhone = 'hidden [@media(min-width:360px)_and_(max-width:767.98px)_and_(min-height:640px)]:motion-safe:block';
const hideWhenPinned =
  '[@media(min-width:768px)_and_(min-height:600px)]:motion-safe:hidden [@media(min-width:360px)_and_(max-width:767.98px)_and_(min-height:640px)]:motion-safe:hidden';

type Variant = 'wide' | 'phone';
type Mode = Variant | 'static';

function subscribe(onChange: () => void) {
  const mqs = [WIDE_QUERY, PHONE_QUERY].map((q) => window.matchMedia(q));
  mqs.forEach((mq) => mq.addEventListener('change', onChange));
  return () => mqs.forEach((mq) => mq.removeEventListener('change', onChange));
}

function getMode(): Mode {
  if (window.matchMedia(WIDE_QUERY).matches) return 'wide';
  if (window.matchMedia(PHONE_QUERY).matches) return 'phone';
  return 'static';
}

function useMode() {
  return useSyncExternalStore<Mode | null>(subscribe, getMode, () => null);
}

const eyebrow = 'font-mono text-[12px] uppercase tracking-[0.08em] text-stage-muted';
const titleClass =
  'text-balance text-[clamp(1.75rem,2.6vw,2.5rem)] font-medium leading-[1.1] tracking-[-0.03em] text-stage-ink';
const bodyClass = 'max-w-[34ch] text-pretty text-[16px] leading-[1.6] text-stage-label md:max-w-[52ch] lg:max-w-[34ch]';
const nowClass = 'max-w-[36ch] text-pretty text-[17px] leading-[1.55] text-stage-ink md:max-w-[52ch] lg:max-w-[36ch]';
const phoneTitle = 'text-balance text-[22px] font-medium leading-[1.2] tracking-[-0.03em] text-stage-ink';
const phoneBody = 'mt-2 text-pretty text-[14px] leading-[1.5] text-stage-label';
const phoneNow = 'mt-2 text-pretty text-[14px] leading-[1.5] text-stage-ink';

export default function GraphOfWork() {
  const mode = useMode();

  return (
    <section id="graph" aria-labelledby="graph-title" className="relative">
      <h2 id="graph-title" className="sr-only">
        Graph of work
      </h2>

      {mode === null || mode === 'wide' ? (
        <div data-graph="pinned" className={showWhenWide}>
          <PinnedGraph variant="wide" />
        </div>
      ) : null}

      {mode === null || mode === 'phone' ? (
        <div data-graph="pinned" className={showWhenPhone}>
          <PinnedGraph variant="phone" />
        </div>
      ) : null}

      {mode === null || mode === 'static' ? (
        <div data-graph="static" className={hideWhenPinned}>
          <StaticGraph />
        </div>
      ) : null}

      <div className="sr-only">
        <h3>Relations in the graph</h3>
        <ul>
          {triples.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------
// Pinned (motion allowed): wide stage on desktop and tablet, phone stage on
// portrait phones
// ------------------------------------------------------------------

// How far the page scrolls while the stage is pinned, and how that scroll maps
// onto story progress `p` (TIMELINE stays in 0..1). `at` is scroll distance in
// `unit`, `story` the progress reached there. Wide: chapters 1 and 2 over
// 150vh, chapter 3 over 100vh, then a 30vh hold. Phone: shorter beats, with a
// short stretch where the figure is still after each chapter completes, so a
// flick tends to land on a finished figure. The track is 100 units taller
// than the range.
type ScrollMap = { unit: 'vh' | 'svh'; at: readonly number[]; story: readonly number[]; rail: readonly number[] };
const SCROLL: Record<Variant, ScrollMap> = {
  wide: { unit: 'vh', at: [0, 150, 250, 280], story: [0, TIMELINE.chapter3, 1, 1], rail: RAIL_TARGETS.wide },
  phone: {
    unit: 'svh',
    at: [0, 66, 82, 148, 164, 224, 244],
    story: [0, 0.3, 0.36, 0.66, 0.685, 0.98, 1],
    rail: RAIL_TARGETS.phone,
  },
};

// The track is sized from a --track number in the map's unit; svh falls back
// to vh where the unit is unsupported.
const TRACK_HEIGHT = {
  vh: 'h-[calc(var(--track)*1vh)]',
  svh: 'h-[calc(var(--track)*1vh)] supports-[height:1svh]:h-[calc(var(--track)*1svh)]',
} as const;

// Story progress to track scroll progress (0..1), for the chapter rail.
function scrollAt(map: ScrollMap, story: number) {
  const { at, story: s } = map;
  const range = at[at.length - 1];
  for (let i = 1; i < at.length; i++) {
    if (story <= s[i]) {
      const f = s[i] === s[i - 1] ? 0 : (story - s[i - 1]) / (s[i] - s[i - 1]);
      return (at[i - 1] + f * (at[i] - at[i - 1])) / range;
    }
  }
  return 1;
}

type Story = {
  chapter: number;
  typed: number;
  p: MotionValue<number>;
  trace: MotionValue<number>;
  bodyOpacity: MotionValue<number>;
  bodyY: MotionValue<number>;
  goTo: (index: number) => void;
};

function PinnedGraph({ variant }: { variant: Variant }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const map = SCROLL[variant];
  const range = map.at[map.at.length - 1];

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });
  const story = useTransform(
    scrollYProgress,
    map.at.map((a) => a / range),
    [...map.story]
  );
  const p = useSpring(story, { stiffness: 140, damping: 30, mass: 0.35, restDelta: 0.0005 });

  const { scrollYProgress: entering } = useScroll({ target: trackRef, offset: ['start end', 'start start'] });
  const scale = useTransform(entering, [0, 1], [0.96, 1]);

  // Re-render only when the chapter changes, never per frame.
  const [chapter, setChapter] = useState(0);
  const chapterRef = useRef(0);
  useMotionValueEvent(p, 'change', (v) => {
    const next = chapterAt(v);
    if (next !== chapterRef.current) {
      chapterRef.current = next;
      setChapter(next);
    }
  });

  // Chapter 3 follows the scroll: the heading types, then the path from
  // Matheus to the current work is drawn, then the sentence under it fades
  // in. The typed count re-renders once per character, never per frame.
  const nowTitle = CHAPTERS[2].title;
  const typedMV = useTransform(p, [...TIMELINE.typeScroll], [0, nowTitle.length], { clamp: true });
  const [typed, setTyped] = useState(0);
  useMotionValueEvent(typedMV, 'change', (v) => {
    const next = Math.round(v);
    setTyped((prev) => (prev === next ? prev : next));
  });
  const trace = useTransform(p, [...TIMELINE.traceScroll], [0, TRACE.end], { clamp: true });
  const bodyOpacity = useTransform(p, [...TIMELINE.nowBody], [0, 1]);
  const bodyY = useTransform(p, [...TIMELINE.nowBody], [8, 0]);

  // framer-motion measures the viewport as documentElement.clientHeight, not
  // innerHeight: on iOS innerHeight grows when the toolbar collapses.
  const goTo = useCallback(
    (index: number) => {
      const el = trackRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const scrollRange = el.offsetHeight - document.documentElement.clientHeight;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: Math.round(top + scrollAt(map, map.rail[index]) * scrollRange),
        behavior: reduce ? 'instant' : 'smooth',
      });
    },
    [map]
  );

  // The figure only reads motion values, so chapter and typing re-renders skip it.
  const figure = useMemo(
    () => (
      <GraphFigure
        layout={variant}
        edgeLabels={variant === 'phone' ? 'primary' : 'all'}
        progress={p}
        trace={trace}
        title={FIGURE_TEXT.pinned.title}
        desc={FIGURE_TEXT.pinned.desc}
        className="h-full w-full"
      />
    ),
    [variant, p, trace]
  );

  const s: Story = { chapter, typed, p, trace, bodyOpacity, bodyY, goTo };

  return (
    <div
      ref={trackRef}
      className={`relative ${TRACK_HEIGHT[map.unit]}`}
      style={{ ['--track' as string]: 100 + range }}
    >
      {/* The visible copy shows only the current chapter (and stays readable
          by touch); this is the full text in reading order for screen readers. */}
      <div className="sr-only">
        {CHAPTERS.map((c) => (
          <div key={c.verb}>
            <h3>{c.title}</h3>
            {c.body ? <p>{c.body}</p> : null}
          </div>
        ))}
      </div>

      {variant === 'wide' ? <WideStage s={s} scale={scale} figure={figure} /> : <PhoneStage s={s} figure={figure} />}
    </div>
  );
}

// Safari 26 tints its bars with the color of a fixed or sticky box it finds
// at the viewport's top or bottom edge, and keeps that color after the box
// has scrolled away for as long as the box is visible. So the sticky
// wrappers below are visibility: hidden, which Safari skips, and the card
// inside is visible again on its own layer (`relative`): the page then
// scrolls under the bars as it does everywhere else.
function WideStage({ s, scale, figure }: { s: Story; scale: MotionValue<number>; figure: ReactNode }) {
  return (
    <div className="invisible sticky top-[84px] h-[calc(100dvh_-_96px)] px-3">
      <motion.div
        data-surface="dark"
        style={{ scale }}
        className="visible relative grid h-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-surface bg-stage text-stage-ink lg:grid-cols-[minmax(300px,34%)_1fr] lg:grid-rows-1"
      >
        {/* md: eyebrow and rail share the top row, copy below. lg: a column with the rail at the bottom. */}
        <div className="grid min-h-0 grid-cols-[1fr_auto] items-center gap-x-6 gap-y-6 p-6 md:p-8 lg:flex lg:flex-col lg:items-stretch lg:justify-between lg:p-10 xl:p-12">
          <p aria-hidden="true" className={eyebrow}>
            Graph of work
          </p>

          <Rail s={s} className="w-fit justify-self-end lg:order-last" buttonClass="px-4 py-2" />

          <div className="col-span-2 min-h-[220px] lg:min-h-[340px]">
            <Copy s={s} title={titleClass} body={`mt-4 ${bodyClass}`} now={`mt-4 ${nowClass}`} />
          </div>
        </div>

        <div className="relative min-h-0 min-w-0 px-4 pb-4 md:px-6 md:pb-6 lg:p-8">{figure}</div>
      </motion.div>
    </div>
  );
}

// Phone: copy on top, the figure in the middle, the rail at the bottom within
// thumb reach. Sized in svh (the viewport with Safari's toolbar expanded), so
// the figure never resizes while the toolbar collapses and expands mid-scroll.
// The stage ends 20px above the small viewport's bottom, clear of the toolbar.
// Hidden wrapper, visible card: see WideStage.
function PhoneStage({ s, figure }: { s: Story; figure: ReactNode }) {
  return (
    <div className="invisible sticky top-[76px] h-[calc(100vh_-_96px)] px-3 supports-[height:1svh]:h-[calc(100svh_-_96px)]">
      <div
        data-surface="dark"
        className="visible relative mx-auto grid h-full max-w-[560px] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-surface bg-stage text-stage-ink"
      >
        {/* Invisible copies of all three chapters hold the tallest block, so the figure keeps one size. */}
        <div className="grid px-4 pt-4">
          {CHAPTERS.map((c, i) => (
            <div key={c.verb} aria-hidden="true" className="invisible [grid-area:1/1]">
              <p className={phoneTitle}>{c.title}</p>
              <p className={i === 2 ? phoneNow : phoneBody}>{c.body}</p>
            </div>
          ))}
          <div className="[grid-area:1/1]">
            <Copy s={s} title={phoneTitle} body={phoneBody} now={phoneNow} />
          </div>
        </div>

        <div className="relative min-h-0 min-w-0 px-3 pt-2">{figure}</div>

        <div className="px-3 pb-3 pt-2">
          {/* 36px pills with a 44px touch target. */}
          <Rail
            s={s}
            className="w-full"
            buttonClass="relative h-9 flex-1 before:absolute before:inset-x-0 before:-inset-y-1"
          />
        </div>
      </div>
    </div>
  );
}

function Rail({ s, className, buttonClass }: { s: Story; className: string; buttonClass: string }) {
  return (
    <div role="group" aria-label="Chapters" className={`flex gap-1 rounded-full bg-stage-2 p-1 ${className}`}>
      {CHAPTERS.map((c, i) => (
        <button
          key={c.verb}
          type="button"
          aria-current={s.chapter === i ? 'step' : undefined}
          onClick={() => s.goTo(i)}
          className={`${buttonClass} rounded-full text-[14px] font-medium transition-colors duration-300 focus-visible:rounded-full ${
            s.chapter === i
              ? 'bg-stage-ink text-stage'
              : 'text-stage-muted [@media(hover:hover)_and_(pointer:fine)]:hover:text-stage-ink'
          }`}
        >
          {c.verb}
        </button>
      ))}
    </div>
  );
}

function Copy({ s, title, body, now }: { s: Story; title: string; body: string; now: string }) {
  const current = CHAPTERS[s.chapter];
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={s.chapter}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: ease.out } }}
        exit={{ opacity: 0, y: -8, transition: { duration: 0.2, ease: ease.in } }}
      >
        {s.chapter === 2 ? (
          <h3 aria-label={current.title} className={title}>
            <span aria-hidden="true">
              <Typed text={current.title} count={s.typed} />
            </span>
          </h3>
        ) : (
          <h3 className={title}>{current.title}</h3>
        )}
        {s.chapter < 2 ? (
          <p className={body}>{current.body}</p>
        ) : (
          <motion.p className={now} style={{ opacity: s.bodyOpacity, y: s.bodyY }}>
            {current.body}
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Typed text with a caret. The untyped rest is laid out but invisible, so
// the heading keeps its final line breaks while it types. The caret takes no
// width and fades out once typing is done. It hangs off the last typed
// character (or, before any, the first untyped one): Safari places an empty
// inline span mid-word at the end of the word. Its wrapper stays inline (an
// inline-block would add a line break opportunity mid-word), and the caret
// comes before the character, so a soft wrap never splits the wrapper.
function Typed({ text, count }: { text: string; count: number }) {
  const done = count >= text.length;
  const caret = (position: string) => (
    <span
      className={`absolute bottom-[0.02em] top-[0.1em] w-[2px] bg-signal transition-opacity duration-500 ${position} ${
        done ? 'opacity-0 delay-700' : 'opacity-100'
      }`}
    />
  );
  if (count <= 0) {
    return (
      <>
        <span className="relative">
          {caret('left-0')}
          <span className="invisible">{text.slice(0, 1)}</span>
        </span>
        <span className="invisible">{text.slice(1)}</span>
      </>
    );
  }
  return (
    <>
      {text.slice(0, count - 1)}
      <span className="relative">
        {caret('left-[calc(100%_+_2px)]')}
        {text.slice(count - 1, count)}
      </span>
      <span className="invisible">{text.slice(count)}</span>
    </>
  );
}

// ------------------------------------------------------------------
// Static (reduced motion, short or narrow viewports, landscape phones):
// the three chapters stacked
// ------------------------------------------------------------------

function StaticGraph() {
  return (
    <div className="px-3">
      <div data-surface="dark" className="rounded-surface bg-stage px-5 py-12 text-stage-ink sm:px-8 md:p-12">
        <p aria-hidden="true" className={eyebrow}>
          Graph of work
        </p>

        <div className="mt-10 space-y-16 md:space-y-24">
          <StaticChapter
            copy={
              <>
                <h3 className={titleClass}>{CHAPTERS[0].title}</h3>
                <p className={`mt-4 ${bodyClass}`}>{CHAPTERS[0].body}</p>
              </>
            }
            figure={
              <>
                <Excerpt className="md:hidden" />
                <GraphFigure
                  progress={STATIC_PROGRESS.extract}
                  title={FIGURE_TEXT.extract.title}
                  desc={FIGURE_TEXT.extract.desc}
                  className="hidden h-auto w-full md:block"
                />
              </>
            }
          />

          <StaticChapter
            copy={
              <>
                <h3 className={titleClass}>{CHAPTERS[1].title}</h3>
                <p className={`mt-4 ${bodyClass}`}>{CHAPTERS[1].body}</p>
              </>
            }
            figure={
              <>
                <GraphFigure
                  layout="tall"
                  edgeLabels="primary"
                  progress={STATIC_PROGRESS.connect}
                  title={FIGURE_TEXT.connect.title}
                  desc={FIGURE_TEXT.connect.desc}
                  className="h-auto w-full md:hidden"
                />
                <GraphFigure
                  progress={STATIC_PROGRESS.connect}
                  title={FIGURE_TEXT.connect.title}
                  desc={FIGURE_TEXT.connect.desc}
                  className="hidden h-auto w-full md:block"
                />
              </>
            }
          />

          <StaticChapter
            copy={
              <>
                <h3 className={titleClass}>{CHAPTERS[2].title}</h3>
                <p className={`mt-4 ${nowClass}`}>{CHAPTERS[2].body}</p>
              </>
            }
            figure={
              <>
                <GraphFigure
                  layout="tall"
                  edgeLabels="primary"
                  progress={STATIC_PROGRESS.now}
                  trace={TRACE.end}
                  title={FIGURE_TEXT.now.title}
                  desc={FIGURE_TEXT.now.desc}
                  className="h-auto w-full md:hidden"
                />
                <GraphFigure
                  progress={STATIC_PROGRESS.now}
                  trace={TRACE.end}
                  title={FIGURE_TEXT.now.title}
                  desc={FIGURE_TEXT.now.desc}
                  className="hidden h-auto w-full md:block"
                />
              </>
            }
          />
        </div>
      </div>
    </div>
  );
}

function StaticChapter({ copy, figure }: { copy: ReactNode; figure: ReactNode }) {
  return (
    <div className="grid gap-8 md:gap-10 lg:grid-cols-[minmax(260px,30%)_1fr] lg:items-center">
      <div>{copy}</div>
      <div className="min-w-0">{figure}</div>
    </div>
  );
}
