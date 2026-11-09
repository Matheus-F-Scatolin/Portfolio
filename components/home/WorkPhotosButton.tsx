'use client';

import { useRef, useState, type ReactNode } from 'react';

// The film carries each project now, so its photos wait behind a small pill
// and open in a native dialog: Escape and the backdrop close it, focus returns
// to the pill. The photos are rendered on the server as children but only
// mounted on the first open: lazy images inside a closed dialog can fail to
// start loading once it opens, and eager ones would all load with the page.
export default function WorkPhotosButton({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpened(true);
          ref.current?.showModal();
        }}
        className="tap rounded-full border border-line px-3.5 py-1.5 font-mono text-[12px] text-ink-2 transition-[border-color,color,transform] duration-300 active:scale-[0.98] [@media(hover:hover)_and_(pointer:fine)]:hover:border-ink/30 [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink"
      >
        {label}
        <span className="sr-only">: {title}</span>
      </button>
      <dialog
        ref={ref}
        aria-label={`${title}: ${label.toLowerCase()}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="w-[min(64rem,calc(100vw-2rem))] max-w-none overflow-visible bg-transparent p-0 backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
      >
        <div className="rounded-surface bg-paper p-3 md:p-4">
          {opened ? children : null}
          <div className="mt-3 flex justify-end md:mt-4">
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="rounded-full bg-ink px-4 py-2 text-[14px] font-medium text-paper transition-[background-color,transform] duration-300 active:scale-[0.98] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-ink-2"
            >
              Close
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
