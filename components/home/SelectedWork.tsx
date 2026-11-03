import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import SectionHeading from '@/components/ui/SectionHeading';
import { filmChapters } from '@/lib/film';
import { work, type Work } from '@/lib/profile';
import WorkFilm from './WorkFilm';
import WorkPhotosButton from './WorkPhotosButton';

type WorkImage = { src: string; alt: string; ratio: number; fit?: 'cover' | 'contain' };

// Scroll length of one film frame. Each project's text sits in a segment as
// tall as its chapter, so the film and the text change project together.
const VH_PER_FRAME = 1.5;
// Extra scroll on the last project so the final frame holds before the section ends.
const HOLD_VH = 30;

// Width of the photos dialog: 64rem less its padding.
const DIALOG_TRACK = 1000;

// External write-ups open in a new tab, like the paper links in Research.
const newTab = { target: '_blank', rel: 'noopener noreferrer' } as const;

// Both stick at the same line, so the text's top lines up with the film's.
// Desktop centres the film in the viewport, clear of the nav, and runs it
// past the page column to the window's right edge and into the gutter
// beside the text, both where it fades out; it stops growing once it would
// be taller than the window. --vw is the window width without its scrollbar
// (set by WorkFilm), so the bleed never causes sideways scroll; clipping the
// section instead makes iOS Safari shake the sticky film and text while a
// finger drags. On phones the film sticks under the nav on a paper band and
// the text sticks below it.
const STAGE_STICKY =
  'sticky top-0 z-10 bg-paper pb-4 pt-[4.75rem] md:z-auto md:col-span-8 md:col-start-5 md:row-start-1 md:-ml-10 md:mr-[calc(-2rem_-_max(0px,(var(--vw,100vw)_-_1280px)/2))] md:self-start md:bg-transparent md:p-0 lg:-ml-16 md:top-[max(5.5rem,calc(50vh_-_var(--stage-h,30rem)/2))]';
const STAGE_SIZE = 'md:max-w-[calc((100vh_-_7rem)*16/9)]';
const TEXT_STICKY =
  'sticky top-[calc(var(--stage-h,56vw)+6.75rem)] md:top-[max(5.5rem,calc(50vh_-_var(--stage-h,30rem)/2))]';

// One photo fills the dialog. Two sit side by side with column widths
// proportional to their aspect ratios, so both render at the same height
// without cropping. They stack on phones.
function WorkPhotos({ item }: { item: Work }) {
  const images: WorkImage[] = item.secondImage ? [item.image, item.secondImage] : [item.image];
  const total = images.reduce((sum, image) => sum + image.ratio, 0);
  const cols = { '--cols': images.map((image) => `${image.ratio.toFixed(4)}fr`).join(' ') } as CSSProperties;

  return (
    <div className="grid gap-3 md:grid-cols-[var(--cols)] md:gap-4" style={cols}>
      {images.map((image) => {
        const share = image.ratio / total;
        const fit = image.fit === 'contain' ? 'object-contain p-5 sm:p-10' : 'object-cover';
        return (
          <div
            key={image.src}
            style={{ aspectRatio: image.ratio }}
            className="relative overflow-hidden rounded-[16px] bg-panel"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              loading="eager"
              sizes={`(min-width: 1056px) ${Math.round(DIALOG_TRACK * share)}px, (min-width: 768px) ${Math.round(94 * share)}vw, 100vw`}
              className={fit}
            />
          </div>
        );
      })}
    </div>
  );
}

function WorkText({ item }: { item: Work }) {
  return (
    <>
      <p className="font-mono text-[13px] text-muted">{item.context}</p>
      <h3 className="mt-3 text-[clamp(1.5rem,2.2vw,1.875rem)] font-medium leading-[1.15] tracking-[-0.025em] text-ink">
        <Link
          href={item.href}
          {...(item.external ? newTab : {})}
          className="underline decoration-transparent decoration-1 underline-offset-[6px] transition-colors duration-300 [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-ink/30"
        >
          {item.title}
        </Link>
      </h3>
      <p className="mt-3 max-w-[46ch] text-[17px] leading-[1.6] text-ink-2">{item.summary}</p>
      <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[13px] text-ink-2">
        {item.metrics.map((metric) => (
          <li key={metric}>{metric}</li>
        ))}
      </ul>
      <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-[15px]">
        <Link
          href={item.href}
          {...(item.external ? newTab : {})}
          className="group/link text-ink underline decoration-ink/25 underline-offset-[6px] transition-colors duration-300 [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-ink"
        >
          {item.external ? item.external.label : 'Read the case study'}
          <span className="sr-only">: {item.title}</span>
          <span
            aria-hidden="true"
            className={`ml-1.5 inline-block transition-transform duration-300 ease-out ${
              item.external
                ? '[@media(hover:hover)_and_(pointer:fine)]:group-hover/link:-translate-y-0.5 [@media(hover:hover)_and_(pointer:fine)]:group-hover/link:translate-x-0.5'
                : '[@media(hover:hover)_and_(pointer:fine)]:group-hover/link:translate-x-1'
            }`}
          >
            {item.external ? '↗' : '→'}
          </span>
          {item.external ? <span className="sr-only"> (opens in a new tab)</span> : null}
        </Link>
        {/* STELLAR has a diagram, not photos */}
        <WorkPhotosButton label={item.image.fit === 'contain' ? 'Figure' : 'Photos'} title={item.title}>
          <WorkPhotos item={item} />
        </WorkPhotosButton>
      </div>
    </>
  );
}

export default function SelectedWork() {
  const frames = Object.fromEntries(filmChapters.map((ch) => [ch.slug, ch.frames]));
  return (
    <section id="work" aria-labelledby="work-title" className="py-24 md:py-32">
      <div className="mx-auto w-full max-w-page px-4 md:px-8">
        <SectionHeading
          id="work-title"
          lead="Selected work."
          tail="Four projects: two published, one in production, one placed 2nd of ~1,000 teams."
        />

        {/* The film stays pinned while each project's text scrolls past it;
            WorkFilm reads where the text is to pick the frame. */}
        <div data-film-track className="grid md:mt-20 md:grid-cols-12 md:gap-x-10 lg:gap-x-16">
          <div className={STAGE_STICKY}>
            <div className={STAGE_SIZE}>
              <WorkFilm />
            </div>
          </div>
          <div className="md:col-span-4 md:col-start-1 md:row-start-1">
            {work.map((item, i) => {
              const last = i === work.length - 1;
              const height = `${(frames[item.slug] ?? 100) * VH_PER_FRAME + (last ? HOLD_VH : 0)}vh`;
              return (
                <div key={item.slug} data-film-segment style={{ height }}>
                  <article className={TEXT_STICKY}>
                    <WorkText item={item} />
                  </article>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
