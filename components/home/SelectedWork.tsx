import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { work, type Work } from '@/lib/profile';

type WorkImage = { src: string; alt: string; ratio: number; fit?: 'cover' | 'contain' };

// Width of the 8-column media track at the 1280px page: 1216px of content
// with 64px gaps, so 8 x 42.67 + 7 x 64.
const MEDIA_TRACK = 789;

// External write-ups open in a new tab, like the paper links in Research.
const newTab = { target: '_blank', rel: 'noopener noreferrer' } as const;

function WorkMedia({
  href,
  external,
  image,
  sizes,
}: {
  href: string;
  external: boolean;
  image: WorkImage;
  sizes: string;
}) {
  const fit =
    image.fit === 'contain' ? 'object-contain p-5 sm:p-10 lg:p-14' : 'object-cover';
  // Hover (fine pointers only) on any link in the item scales the image, so
  // image, title and case study link read as one target. The image link is out
  // of the tab order; the title and the case study link carry focus. Class
  // names stay literal so Tailwind's scanner finds them. aria-hidden keeps
  // screen readers from announcing each item twice.
  return (
    <Link
      href={href}
      {...(external ? newTab : {})}
      tabIndex={-1}
      aria-hidden="true"
      style={{ aspectRatio: image.ratio }}
      className="relative isolate block overflow-hidden rounded-surface bg-panel"
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        className={`${fit} transition-transform duration-[600ms] ease-out [@media(hover:hover)_and_(pointer:fine)]:group-has-[a:hover]/work:scale-[1.03]`}
      />
    </Link>
  );
}

// One photo fills the track. Two sit side by side with column widths
// proportional to their aspect ratios, so both render at the same height
// without cropping. They stack on phones.
function WorkPhotos({ item }: { item: Work }) {
  const images: WorkImage[] = item.secondImage ? [item.image, item.secondImage] : [item.image];
  const total = images.reduce((sum, image) => sum + image.ratio, 0);
  const cols = { '--cols': images.map((image) => `${image.ratio.toFixed(4)}fr`).join(' ') } as CSSProperties;

  return (
    <div className="grid gap-4 md:grid-cols-[var(--cols)]" style={cols}>
      {images.map((image) => {
        const share = image.ratio / total;
        const sizes = `(min-width: 1280px) ${Math.round(MEDIA_TRACK * share)}px, (min-width: 768px) ${Math.round(64 * share)}vw, 100vw`;
        return <WorkMedia key={image.src} href={item.href} external={!!item.external} image={image} sizes={sizes} />;
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
      <p className="mt-7 text-[15px]">
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
      </p>
    </>
  );
}

export default function SelectedWork() {
  return (
    <section id="work" aria-labelledby="work-title" className="py-24 md:py-32">
      <div className="mx-auto w-full max-w-page px-4 md:px-8">
        <SectionHeading
          id="work-title"
          lead="Selected work."
          tail="Four projects: two published, one in production, one placed 2nd of ~1,000 teams."
        />

        {/* One project per band, ruled above and below, so every photo sits
            with its own text. Text and photos swap sides from band to band.
            On phones each band is text first, then photos. */}
        <div className="mt-14 border-b border-line md:mt-20">
          {work.map((item, i) => {
            const flip = i % 2 === 1;
            return (
              <Reveal
                key={item.slug}
                as="article"
                className="group/work grid gap-7 border-t border-line py-12 md:grid-cols-12 md:gap-x-10 md:py-16 lg:gap-x-16"
              >
                <div
                  className={`md:col-span-4 md:row-start-1 ${flip ? 'md:col-start-9' : 'md:col-start-1'}`}
                >
                  <WorkText item={item} />
                </div>
                <div
                  className={`md:col-span-8 md:row-start-1 ${flip ? 'md:col-start-1' : 'md:col-start-5'}`}
                >
                  <WorkPhotos item={item} />
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
