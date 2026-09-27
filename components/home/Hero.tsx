import Image from 'next/image';
import type { CSSProperties } from 'react';

// Offsets the CSS hero choreography in app/globals.css (.rise-line, .fade-up,
// .fade-in). Everything here runs before hydration and is static under
// reduced motion.
const delay = (ms: number) => ({ ['--d' as string]: `${ms}ms` }) as CSSProperties;

// Full height on phones. From md up the hero stops 7rem short of the
// viewport, so the top of the Proof row ("1st of 102") shows in the first
// screen.
export default function Hero() {
  return (
    <section className="relative flex min-h-[100dvh] items-center pb-16 pt-28 md:min-h-[calc(100dvh-7rem)]">
      <div className="mx-auto grid w-full max-w-page gap-10 px-4 md:grid-cols-12 md:px-8">
        <div className="md:col-span-7 md:self-center">
          {/* Three masked lines. At the headline's size, "and publish the
              research behind them." is about 16em wide and cannot sit on one
              line in seven columns, so it breaks at the phrase. The size tops
              out where "and publish the research" still fits the column. */}
          <h1 className="text-[clamp(2.75rem,4.8vw,4rem)] font-medium leading-[1.02] tracking-[-0.045em] text-ink">
            <span className="rise-line">
              <span className="text-balance" style={delay(80)}>
                I build AI systems
              </span>
            </span>{' '}
            <span className="rise-line text-tone">
              <span className="text-balance" style={delay(190)}>
                and publish the research
              </span>
            </span>{' '}
            <span className="rise-line text-tone">
              <span className="text-balance" style={delay(300)}>
                behind them.
              </span>
            </span>
          </h1>

          <p
            className="fade-up mt-7 max-w-[42ch] text-balance text-[19px] leading-[1.55] text-ink-2"
            style={delay(420)}
          >
            <span className="block">AI Engineer at Valor Capital Group.</span>{' '}
            <span className="block">Computer Engineering at Unicamp.</span>
          </p>

          <div className="fade-up mt-9 flex items-center gap-7" style={delay(520)}>
            <a
              href="#work"
              className="inline-flex items-center rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-paper transition-[background-color,transform] duration-300 ease-out active:scale-[0.98] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-ink-2"
            >
              Selected work
            </a>
            <a
              href="#research"
              className="text-[15px] font-medium text-ink underline decoration-ink/25 decoration-1 underline-offset-[6px] transition-colors duration-300 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-ink"
            >
              Read the papers
            </a>
          </div>
        </div>

        <div className="md:col-span-5 md:col-start-8">
          {/* The width is capped from the viewport height so the portrait
              and the top 7rem of the Proof row share the first screen:
              18rem = pt-28 + pb-16 + 7rem. Never narrower than 18rem. */}
          {/* No opacity fade: the portrait is the LCP element, so it paints at
              once (under the intro curtain on a first visit) and only the
              photo inside the frame settles with a transform. */}
          <div className="relative aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-surface bg-panel md:ml-auto md:max-w-[max(18rem,calc((100dvh_-_18rem)_*_0.8))]">
            <Image
              src="/portrait.jpg"
              alt="Portrait of me"
              fill
              priority
              sizes="(min-width: 1280px) 484px, (min-width: 768px) 38vw, (min-width: 452px) 420px, calc(100vw - 32px)"
              className="settle object-cover"
              style={delay(150)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
