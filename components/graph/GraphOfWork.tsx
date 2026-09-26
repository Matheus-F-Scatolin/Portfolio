'use client';

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useCallback, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
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

// The pinned, scroll-driven version runs only on viewports at least 768 wide
// and 600 tall, without reduced motion (a landscape phone gets the static one).
// The server renders both versions and CSS shows the right one, so there is
// no hydration mismatch and no flash; after mount the hidden one unmounts.
// Keep PINNED_QUERY and the two CSS classes below on the same thresholds.
const PINNED_QUERY = '(min-width: 768px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)';
const showWhenPinned = 'hidden [@media(min-width:768px)_and_(min-height:600px)]:motion-safe:block';
const hideWhenPinned = '[@media(min-width:768px)_and_(min-height:600px)]:motion-safe:hidden';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(PINNED_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function usePinned() {
  return useSyncExternalStore<boolean | null>(
    subscribe,
    () => window.matchMedia(PINNED_QUERY).matches,
    () => null
  );
}

const eyebrow = 'font-mono text-[12px] uppercase tracking-[0.08em] text-stage-muted';
const titleClass =
  'text-balance text-[clamp(1.75rem,2.6vw,2.5rem)] font-medium leading-[1.1] tracking-[-0.03em] text-stage-ink';
const bodyClass = 'max-w-[34ch] text-pretty text-[16px] leading-[1.6] text-stage-label md:max-w-[52ch] lg:max-w-[34ch]';
const nowClass = 'max-w-[36ch] text-pretty text-[17px] leading-[1.55] text-stage-ink md:max-w-[52ch] lg:max-w-[36ch]';

export default function GraphOfWork() {
  const pinned = usePinned();

  return (
    <section id="graph" aria-labelledby="graph-title" className="relative">
      <h2 id="graph-title" className="sr-only">
        Graph of work
      </h2>

      {pinned !== false ? (
        <div className={showWhenPinned}>
          <PinnedGraph />
        </div>
      ) : null}

      {pinned !== true ? (
        <div className={hideWhenPinned}>
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
// Pinned (desktop, motion allowed)
// ------------------------------------------------------------------

// How far the page scrolls (in vh) while the stage is pinned: chapters 1 and 2,
// then chapter 3, then a hold on the finished graph before the page moves on.
// TIMELINE stays in story progress `p` (0..1); these segments map scroll onto
// it, so chapter 3 can get more room without slowing chapters 1 and 2.
const SCROLL_VH = { chapters12: 150, chapter3: 100, hold: 30 } as const;
const TRACK_VH = 100 + SCROLL_VH.chapters12 + SCROLL_VH.chapter3 + SCROLL_VH.hold;
const RANGE_VH = TRACK_VH - 100;
const CH3_AT = SCROLL_VH.chapters12 / RANGE_VH;
const STORY_END_AT = (SCROLL_VH.chapters12 + SCROLL_VH.chapter3) / RANGE_VH;

// Story progress to track scroll progress, for the chapter rail.
function scrollAt(story: number) {
  const c3 = TIMELINE.chapter3;
  return story <= c3 ? (story / c3) * CH3_AT : CH3_AT + ((story - c3) / (1 - c3)) * (STORY_END_AT - CH3_AT);
}

function PinnedGraph() {
  const trackRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });
  const story = useTransform(scrollYProgress, [0, CH3_AT, STORY_END_AT, 1], [0, TIMELINE.chapter3, 1, 1]);
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

  const goTo = useCallback((index: number) => {
    const el = trackRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: Math.round(top + scrollAt(RAIL_TARGETS[index]) * range), behavior: reduce ? 'instant' : 'smooth' });
  }, []);

  const current = CHAPTERS[chapter];

  return (
    <div ref={trackRef} className="relative" style={{ height: `${TRACK_VH}vh` }}>
      {/* The visual copy swaps with scroll; this is the full text for screen readers. */}
      <div className="sr-only">
        {CHAPTERS.map((c) => (
          <div key={c.verb}>
            <h3>{c.title}</h3>
            {c.body ? <p>{c.body}</p> : null}
          </div>
        ))}
      </div>

      <div className="sticky top-[84px] h-[calc(100dvh_-_96px)] px-3">
        <motion.div
          data-surface="dark"
          style={{ scale }}
          className="grid h-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-surface bg-stage text-stage-ink lg:grid-cols-[minmax(300px,34%)_1fr] lg:grid-rows-1"
        >
          {/* md: eyebrow and rail share the top row, copy below. lg: a column with the rail at the bottom. */}
          <div className="grid min-h-0 grid-cols-[1fr_auto] items-center gap-x-6 gap-y-6 p-6 md:p-8 lg:flex lg:flex-col lg:items-stretch lg:justify-between lg:p-10 xl:p-12">
            <p aria-hidden="true" className={eyebrow}>
              Graph of work
            </p>

            <div
              role="group"
              aria-label="Chapters"
              className="flex w-fit gap-1 justify-self-end rounded-full bg-stage-2 p-1 lg:order-last"
            >
              {CHAPTERS.map((c, i) => (
                <button
                  key={c.verb}
                  type="button"
                  aria-current={chapter === i ? 'step' : undefined}
                  onClick={() => goTo(i)}
                  className={`rounded-full px-4 py-2 text-[14px] font-medium transition-colors duration-300 focus-visible:rounded-full ${
                    chapter === i
                      ? 'bg-stage-ink text-stage'
                      : 'text-stage-muted [@media(hover:hover)_and_(pointer:fine)]:hover:text-stage-ink'
                  }`}
                >
                  {c.verb}
                </button>
              ))}
            </div>

            <div className="col-span-2 min-h-[220px] lg:min-h-[340px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={chapter}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: ease.out } }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.2, ease: ease.in } }}
                >
                  <h3 aria-hidden="true" className={titleClass}>
                    {chapter === 2 ? <Typed text={nowTitle} count={typed} /> : current.title}
                  </h3>
                  {chapter < 2 ? (
                    <p aria-hidden="true" className={`mt-4 ${bodyClass}`}>
                      {current.body}
                    </p>
                  ) : (
                    <motion.p
                      aria-hidden="true"
                      className={`mt-4 ${nowClass}`}
                      style={{ opacity: bodyOpacity, y: bodyY }}
                    >
                      {current.body}
                    </motion.p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="relative min-h-0 min-w-0 px-4 pb-4 md:px-6 md:pb-6 lg:p-8">
            <GraphFigure
              progress={p}
              trace={trace}
              title={FIGURE_TEXT.pinned.title}
              desc={FIGURE_TEXT.pinned.desc}
              className="h-full w-full"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Typed text with a caret. The untyped rest is laid out but invisible, so
// the heading keeps its final line breaks while it types. The caret takes no
// width and fades out once typing is done. Its wrapper stays inline (an
// inline-block would add a line break opportunity mid-word).
function Typed({ text, count }: { text: string; count: number }) {
  const done = count >= text.length;
  return (
    <>
      {text.slice(0, count)}
      <span className="relative">
        <span
          className={`absolute bottom-[0.02em] left-[2px] top-[0.1em] w-[2px] bg-signal transition-opacity duration-500 ${
            done ? 'opacity-0 delay-700' : 'opacity-100'
          }`}
        />
      </span>
      <span className="invisible">{text.slice(count)}</span>
    </>
  );
}

// ------------------------------------------------------------------
// Static (phones, reduced motion): the three chapters stacked
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
