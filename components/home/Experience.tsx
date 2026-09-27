import Image from 'next/image';
import type { CSSProperties } from 'react';
import SectionHeading from '@/components/ui/SectionHeading';
import { roles, type Role } from '@/lib/profile';

const kindLabel: Record<Role['kind'], string> = { industry: 'Industry', research: 'Research' };

// "Jan 2025 - Feb 2025" reads "Jan - Feb 2025" in a phone tab, where the org
// name and dates share one line.
function shortDates(dates: string) {
  const m = dates.match(/^(\w{3}) (\d{4}) - (\w{3}) (\d{4})$/);
  return m && m[2] === m[4] ? `${m[1]} - ${m[3]} ${m[4]}` : dates;
}

// A card file: every card is sticky, so each one slides over the last and
// leaves its tab showing. When the seventh lands, the tabs read as an index.
//
// Card i sticks one tab below card i - 1, unless that would push its bottom
// off the screen: the min() lifts it so the whole card is always readable,
// and on short screens the later cards cover a few tabs instead. Cards have
// a fixed height (--card-h) so that bound is exact. Plain CSS sticky, so it
// needs no JS and behaves the same under reduced motion. Below 560px of
// height (landscape phones) there is no room for a stack, so cards just flow.
const stack =
  '[--card-h:29rem] [--stack-top:5rem] [--tab:3rem] md:[--card-h:28rem] md:[--stack-top:5.5rem] md:[--tab:3.5rem]';

function cardTop(i: number): CSSProperties {
  return {
    ['--i' as string]: i,
    top: 'min(calc(var(--stack-top) + var(--i) * var(--tab)), calc(100svh - var(--card-h) - 1rem))',
  };
}

function Card({ role }: { role: Role }) {
  const contain = role.photo.fit === 'contain';
  return (
    <article className="flex h-[var(--card-h)] flex-col overflow-hidden rounded-surface border border-line bg-panel shadow-[0_-20px_40px_-30px_rgb(14_15_17/0.4)]">
      {/* The tab: the only part left showing once the next card covers this one. */}
      <div className="flex h-[var(--tab)] shrink-0 items-center gap-3 px-[18px] md:gap-5 md:px-7">
        <h3 className="min-w-0 truncate text-[15px] font-medium tracking-[-0.01em] text-ink md:text-[17px] md:tracking-[-0.015em]">
          {role.org}
        </h3>
        <p className="hidden min-w-0 truncate text-[15px] text-ink-2 md:block">{role.title}</p>
        <p className="ml-auto hidden font-mono text-[13px] text-muted md:block">{kindLabel[role.kind]}</p>
        <p className="ml-auto shrink-0 whitespace-nowrap font-mono text-[12px] text-muted md:ml-0 md:w-[150px] md:text-right md:text-[13px]">
          <span className="md:hidden">{shortDates(role.dates)}</span>
          <span className="hidden md:inline">{role.dates}</span>
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3 pb-4 md:grid md:grid-cols-12 md:gap-x-8 md:px-7 md:pb-7 md:pt-2">
        <div
          className={`relative h-[11rem] shrink-0 overflow-hidden rounded-[16px] md:order-last md:col-span-7 md:h-auto ${
            contain ? 'bg-white' : 'bg-line'
          }`}
        >
          <Image
            src={role.photo.src}
            alt={role.photo.alt}
            fill
            sizes="(min-width: 1280px) 664px, (min-width: 768px) 52vw, calc(100vw - 56px)"
            className={contain ? 'object-contain p-4 md:p-6' : 'object-cover'}
            style={role.photo.position ? { objectPosition: role.photo.position } : undefined}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-1.5 pt-4 md:col-span-5 md:justify-between md:px-0 md:py-5">
          <div>
            <p className="text-[15px] leading-[1.5] text-ink-2 md:hidden">
              {role.title} · {kindLabel[role.kind]}
            </p>
            <p className="mt-1.5 max-w-[26ch] text-pretty text-[17px] leading-[1.4] tracking-[-0.015em] text-ink md:mt-0 md:text-[clamp(1.25rem,1.9vw,1.625rem)] md:leading-[1.28] md:tracking-[-0.02em]">
              {role.summary}
            </p>
          </div>
          <div className="mt-3.5 md:mt-0">
            <ul className="flex flex-wrap gap-x-[18px] gap-y-1.5 font-mono text-[12px] text-ink-2 md:gap-x-6 md:text-[13px]">
              {role.metrics.map((metric) => (
                <li key={metric}>{metric}</li>
              ))}
            </ul>
            <p className="mt-3.5 hidden font-mono text-[13px] text-muted md:block">{role.place}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-title" className="py-24 md:py-32">
      <div className="mx-auto w-full max-w-page px-4 md:px-8">
        <SectionHeading
          id="experience-title"
          lead="Experience."
          tail="Seven roles since 2024, in industry and research."
        />

        <ol role="list" className={`mt-14 space-y-4 md:mt-20 md:space-y-6 ${stack}`}>
          {roles.map((role, i) => (
            <li key={`${role.org}-${role.dates}`} className="sticky [@media(max-height:560px)]:static" style={cardTop(i)}>
              <Card role={role} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
