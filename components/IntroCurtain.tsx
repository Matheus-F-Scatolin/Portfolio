import { person } from '@/lib/profile';

// White curtain that introduces the name, then blur-dissolves into the
// page. Server-rendered; the animation is pure CSS (app/globals.css) and
// the inline script in layout.tsx hides it on repeat visits. The floor is
// an iOS-only backup that covers the page under Safari's toolbar.
// The name stays on one line: its size is capped so it fits the screen width
// (it is about 11.6em wide).
export default function IntroCurtain() {
  return (
    <>
      <div className="intro-floor" aria-hidden="true" />
      <div className="intro-curtain" aria-hidden="true">
        <div className="intro-curtain__inner px-6 text-center">
          <p className="text-[min(clamp(2.25rem,6vw,4.75rem),calc((100vw_-_3rem)/11.8))] font-medium leading-none tracking-[-0.045em] text-ink">
            {person.name}
          </p>
          <p className="mt-4 text-[clamp(1rem,1.4vw,1.25rem)] tracking-[-0.01em] text-muted">
            {person.role}
          </p>
        </div>
      </div>
    </>
  );
}
