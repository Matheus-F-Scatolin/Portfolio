'use client';

import { useState } from 'react';

export default function CopyProfileButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    let text: string;
    try {
      const res = await fetch('/llms.txt');
      text = await res.text();
    } catch {
      window.open('/llms.txt', '_blank');
      return;
    }

    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      ok = document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      window.open('/llms.txt', '_blank');
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        aria-label="Copy Matheus's full profile as Markdown"
        className="flex items-center text-zinc-400 hover:text-white transition-colors border border-white/10 hover:border-white/30 rounded-full p-1.5 md:gap-1.5 md:px-2.5 md:py-1 md:text-sm"
      >
        {copied ? (
          <svg
            className="w-3.5 h-3.5 md:w-3 md:h-3 text-emerald-400 md:text-current"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            className="w-3.5 h-3.5 md:w-3 md:h-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
        <span className="hidden md:inline">{copied ? 'Copied!' : 'Copy'}</span>
      </button>
      <span
        role="tooltip"
        className="pointer-events-none hidden md:block absolute right-0 top-full mt-2 w-max max-w-[240px] rounded-md border border-white/10 bg-black/90 px-2.5 py-1.5 text-[11px] leading-snug text-zinc-300 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      >
        Copy the Markdown file with Matheus&apos;s full profile
      </span>
    </div>
  );
}
