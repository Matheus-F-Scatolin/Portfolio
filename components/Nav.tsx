'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { person } from '@/lib/profile';

const items = [
  { name: 'Work', href: '/#work' },
  { name: 'Experience', href: '/#experience' },
  { name: 'Research', href: '/#research' },
];

// Floating glass pill. Flips to dark glass while it sits over any element
// marked data-surface="dark" (one IntersectionObserver, color transition only).
export default function Nav() {
  const pathname = usePathname();
  // The path on which a dark surface was last seen under the nav. Deriving
  // `dark` from it resets the pill on every route change without a
  // synchronous setState in the effect.
  const [darkPath, setDarkPath] = useState<string | null>(null);
  const dark = darkPath === pathname;

  // Re-scan on every route change: each page brings its own dark surfaces.
  // The band is rebuilt on resize because it is measured in pixels.
  useEffect(() => {
    let io: IntersectionObserver | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const build = () => {
      io?.disconnect();
      io = null;
      const targets = Array.from(document.querySelectorAll('[data-surface="dark"]'));
      if (!targets.length) return;
      const hits = new Set<Element>();
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) hits.add(e.target);
            else hits.delete(e.target);
          }
          setDarkPath(hits.size > 0 ? pathname : null);
        },
        // A thin band across the middle of the pill (40-48px from the top).
        // Pixels, not a percentage, so it holds on short viewports.
        { rootMargin: `-40px 0px -${Math.max(0, window.innerHeight - 48)}px 0px` }
      );
      targets.forEach((t) => io?.observe(t));
    };

    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(build, 150);
    };

    build();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(timer);
      io?.disconnect();
    };
  }, [pathname]);

  return (
    // The header spans the full width but only the pill takes clicks, so the
    // transparent area beside it never blocks the page underneath.
    <header
      className="fade-in pointer-events-none fixed inset-x-0 top-3 z-50 px-3 md:top-4"
      style={{ ['--d' as string]: '0ms' }}
    >
      <nav
        aria-label="Primary"
        className={`pointer-events-auto mx-auto flex h-14 max-w-[880px] items-center justify-between rounded-full border pl-5 pr-2 backdrop-blur-xl transition-colors duration-300 ${
          dark
            ? 'border-stage-ink/10 bg-stage-2/75 text-stage-ink'
            : 'border-ink/[0.06] bg-paper/75 text-ink shadow-[0_8px_30px_-18px_rgb(14_15_17/0.25)]'
        }`}
      >
        <Link href="/" className="text-[15px] font-medium tracking-[-0.02em]">
          {person.shortName}
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`rounded-full px-3.5 py-2 text-[14px] transition-colors duration-300 ${
                dark ? 'text-stage-label hover:text-stage-ink' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <Link
          href="/#contact"
          className={`rounded-full px-5 py-2.5 text-[14px] font-medium transition-[background-color,color,transform] duration-300 active:scale-[0.98] ${
            dark ? 'bg-stage-ink text-stage hover:bg-white' : 'bg-ink text-paper hover:bg-ink-2'
          }`}
        >
          Contact
        </Link>
      </nav>
    </header>
  );
}
