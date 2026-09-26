import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import Reveal from '@/components/ui/Reveal';
import { work } from '@/lib/profile';

// Building blocks for the case study pages (/projects/*). Light system:
// paper background, ink text, one 880px reading column.

// Offset for the CSS entrance classes in globals.css (.rise-line, .fade-up).
const offset = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

// The home hero waits for the intro curtain via --intro-delay. Case pages are
// usually reached by client navigation, where that delay would only read as
// lag, so the header starts right away.
const noIntroDelay = { '--intro-delay': '0s' } as CSSProperties;

// Reading column: 880px of content, aligned with the edges of the nav pill.
const column = 'mx-auto w-full max-w-[880px]';

export function CaseShell({
  title,
  subtitle,
  meta,
  children,
}: {
  title: string;
  subtitle: string;
  meta: string[];
  children: ReactNode;
}) {
  return (
    <main className="px-4 pb-24 pt-32 md:px-8" style={noIntroDelay}>
      <article className={column}>
        <header>
          <Link
            href="/#work"
            className="group inline-flex items-center gap-2 rounded-full text-[15px] text-muted transition-colors duration-300 [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink"
          >
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-300 ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover:-translate-x-1"
            >
              ←
            </span>
            Back to work
          </Link>

          <h1 className="mt-10 text-[clamp(2.5rem,5vw,4rem)] font-medium leading-[1.02] tracking-[-0.045em] text-ink">
            <span className="rise-line">
              <span style={offset(60)}>{title}</span>
            </span>
          </h1>

          <p
            className="fade-up mt-6 max-w-[46ch] text-pretty text-[19px] leading-[1.55] text-ink-2"
            style={offset(180)}
          >
            {subtitle}
          </p>

          <div className="fade-up mt-6 space-y-1 font-mono text-[13px] leading-[1.6] text-muted" style={offset(260)}>
            {meta.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </header>

        {children}
      </article>
    </main>
  );
}

export function StatGrid({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <dl
      className="fade-up mt-14 grid grid-cols-2 gap-x-6 gap-y-10 md:mt-16 md:grid-cols-4 md:gap-x-0"
      style={offset(340)}
    >
      {stats.map((stat) => (
        // Label first in the DOM so assistive tech reads "label, value";
        // flex-col-reverse puts the numeral on top visually.
        <div
          key={stat.label}
          className="flex flex-col-reverse justify-end md:border-l md:border-line md:px-6 md:first:border-l-0 md:first:pl-0"
        >
          <dt className="mt-3 max-w-[24ch] text-[14px] leading-snug text-muted">{stat.label}</dt>
          <dd className="text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-none tracking-[-0.035em] text-ink">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function CaseSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <Reveal as="section" className="mt-16 md:mt-20">
      <h2 className="text-[28px] font-medium leading-[1.2] tracking-[-0.025em] text-ink">{heading}</h2>
      <div className="mt-5 space-y-5 text-[17px] leading-[1.6] text-ink-2 [&>p]:max-w-[60ch]">{children}</div>
    </Reveal>
  );
}

// One panel holding a plain two-column list, not a box per item.
export function CapabilityGrid({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-x-10 gap-y-3 rounded-surface bg-panel p-6 text-[15px] leading-snug text-ink-2 sm:grid-cols-2 md:p-8">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

// ------------------------------------------------------------------ figures

type Aspect = '16/11' | '4/3' | '3/4' | '3/2';

// Literal class names so Tailwind can see them; ratio = width / height.
const aspects: Record<Aspect, { className: string; ratio: number }> = {
  '16/11': { className: 'aspect-[16/11]', ratio: 16 / 11 },
  '4/3': { className: 'aspect-[4/3]', ratio: 4 / 3 },
  '3/4': { className: 'aspect-[3/4]', ratio: 3 / 4 },
  '3/2': { className: 'aspect-[3/2]', ratio: 3 / 2 },
};

export type CaseFigureProps = {
  src: string;
  alt: string;
  aspect: Aspect;
  caption?: string;
  fit?: 'cover' | 'contain';
};

function FigureBody({ src, alt, aspect, caption, fit = 'cover', sizes }: CaseFigureProps & { sizes: string }) {
  return (
    <figure>
      <div className={`relative overflow-hidden rounded-surface bg-panel ${aspects[aspect].className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={fit === 'contain' ? 'object-contain p-5 md:p-10' : 'object-cover'}
        />
      </div>
      {caption ? <figcaption className="mt-3 text-[14px] leading-snug text-muted">{caption}</figcaption> : null}
    </figure>
  );
}

// Full column width: 880px from 944px viewports up (880 + 2 x 32px gutter).
export function CaseFigure(props: CaseFigureProps) {
  return (
    <Reveal className="mt-14 md:mt-16">
      <FigureBody {...props} sizes="(min-width: 944px) 880px, 100vw" />
    </Reveal>
  );
}

// Two figures side by side on md+. Column widths are proportional to each
// image's aspect ratio, so both images render at exactly the same height.
export function CaseFigureRow({ figures }: { figures: [CaseFigureProps, CaseFigureProps] }) {
  const ratios = figures.map((f) => aspects[f.aspect].ratio);
  const total = ratios[0] + ratios[1];
  const cols = { '--cols': ratios.map((r) => `${r.toFixed(4)}fr`).join(' ') } as CSSProperties;

  return (
    <Reveal className="mt-14 md:mt-16">
      <div className="grid gap-8 md:grid-cols-[var(--cols)] md:gap-5" style={cols}>
        {figures.map((figure, i) => {
          const share = ratios[i] / total;
          const sizes = `(min-width: 944px) ${Math.round(880 * share)}px, (min-width: 768px) ${Math.round(100 * share)}vw, 100vw`;
          return <FigureBody key={figure.src} {...figure} sizes={sizes} />;
        })}
      </div>
    </Reveal>
  );
}

// -------------------------------------------------------------------- links

// The first link is the primary action (a filled pill); the rest are text
// links in the same row.
const pillLink =
  'inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-paper transition-[background-color,transform] duration-300 active:scale-[0.98] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-ink-2';
const textLink =
  'text-[15px] text-ink underline decoration-ink/25 underline-offset-[6px] transition-colors duration-300 [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-ink';

export function CaseLinks({ links }: { links: { label: string; href: string }[] }) {
  return (
    <Reveal className="mt-16 flex flex-wrap items-center gap-x-7 gap-y-4 md:mt-20">
      {links.map((link, i) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={i === 0 ? pillLink : textLink}
        >
          {link.label} <span aria-hidden="true">↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ))}
    </Reveal>
  );
}

// Order follows lib/profile.ts `work`, skipping items without a case study
// page: brain-tumor-ai, kernelnet, stellar, then back to brain-tumor-ai.
const cases = work.filter((item) => !item.external);

export function NextCase({ current }: { current: string }) {
  const index = cases.findIndex((item) => item.slug === current);
  const next = cases[(index + 1) % cases.length];

  return (
    <Reveal className="mt-24 border-t border-line pt-10 md:mt-32 md:pt-12">
      <Link href={next.href} className="group block rounded-surface">
        {/* Two-tone like SectionHeading: the qualifier in tone, the name in ink. */}
        <p className="flex items-baseline gap-3 text-[clamp(1.5rem,2.2vw,1.875rem)] font-medium leading-[1.15] tracking-[-0.025em] text-ink">
          <span>
            <span className="text-tone">Next</span> {next.title}
            <span className="sr-only">, case study</span>
          </span>
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-300 ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-1"
          >
            →
          </span>
        </p>
        <p className="mt-2 font-mono text-[13px] text-muted">{next.context}</p>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-[1.6] text-muted">{next.summary}</p>
      </Link>
    </Reveal>
  );
}
