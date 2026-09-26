'use client';

import { useEffect, useRef, useState } from 'react';

// A string, or a getter for text that may still be loading.
type Source = string | (() => string | Promise<string>);

async function writeToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and non-secure contexts.
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

// Copies text, swaps its label to "Copied" for 2s and announces the result.
// Both labels share one grid cell so the button never changes width.
export function CopyButton({
  source,
  label,
  copiedLabel = 'Copied',
  announcement,
  className = '',
  describedBy,
  onFail,
}: {
  source: Source;
  label: string;
  copiedLabel?: string;
  announcement: string;
  className?: string;
  describedBy?: string;
  onFail?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleClick = async () => {
    let ok = false;
    try {
      const value = typeof source === 'function' ? source() : source;
      // A ready string is written synchronously, inside the click gesture.
      const text = typeof value === 'string' ? value : await value;
      ok = await writeToClipboard(text);
    } catch {
      ok = false;
    }
    if (!ok) {
      onFail?.();
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button type="button" onClick={handleClick} aria-describedby={describedBy} className={className}>
        <span className="grid justify-items-center">
          <span className={`col-start-1 row-start-1 ${copied ? 'invisible' : ''}`}>{label}</span>
          <span className={`col-start-1 row-start-1 ${copied ? '' : 'invisible'}`}>{copiedLabel}</span>
        </span>
      </button>
      <span role="status" className="sr-only">
        {copied ? announcement : ''}
      </span>
    </>
  );
}

export default function CopyBibtexButton({
  bibtex,
  describedBy,
}: {
  bibtex: string;
  describedBy?: string;
}) {
  return (
    <CopyButton
      source={bibtex}
      label="Copy BibTeX"
      announcement="BibTeX copied to clipboard."
      describedBy={describedBy}
      className="rounded-full border border-line px-3 py-1 text-[13px] text-ink-2 transition-[border-color,color,transform] duration-300 ease-out active:scale-[0.98] [@media(hover:hover)_and_(pointer:fine)]:hover:border-ink/30 [@media(hover:hover)_and_(pointer:fine)]:hover:text-ink"
    />
  );
}
