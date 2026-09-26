import type { CSSProperties } from 'react';
import { proof } from '@/lib/profile';

// On md+ the top of this row sits in the first screen, just under the hero,
// so the cells continue the hero's CSS choreography (.fade-up, after the CTAs
// at 520ms) instead of waiting for a scroll reveal that would not fire there.
// Static under reduced motion and without JS.
const delay = (ms: number) => ({ ['--d' as string]: `${ms}ms` }) as CSSProperties;

// Four ranks, each with the size of its field. From xl up the field sits
// beside the value, top-aligned at 24px (the smallest size where `tone` is
// allowed). Below xl a quarter or half column is too narrow for
// "2nd of ~1,000 teams" on one line, so the field drops under the value.
export default function Proof() {
  return (
    <section aria-label="Selected results">
      <div className="mx-auto w-full max-w-page px-4 md:px-8">
        <ul
          role="list"
          className="grid grid-cols-2 gap-x-6 gap-y-10 border-t border-line py-12 md:grid-cols-4 md:gap-0 md:py-14"
        >
          {proof.map((item, i) => (
            <li
              key={item.value}
              style={delay(620 + i * 60)}
              className={`fade-up ${
                i === 0 ? 'md:pr-4 xl:pr-0' : 'md:border-l md:border-line md:pl-6 md:pr-4 xl:pr-0'
              }`}
            >
              <p className="text-[clamp(2.25rem,3.4vw,2.75rem)] font-medium leading-none tracking-[-0.04em] text-ink">
                {item.value}{' '}
                <span className="mt-3 block whitespace-nowrap text-[15px] leading-snug tracking-normal text-ink-2 xl:mt-[3px] xl:inline-block xl:align-top xl:text-[24px] xl:leading-none xl:tracking-[-0.01em] xl:text-tone">
                  {item.field}
                </span>
              </p>
              <p className="mt-1 max-w-[26ch] text-[15px] leading-snug text-muted xl:mt-3">
                {item.label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
