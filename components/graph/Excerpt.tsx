import type { ReactNode } from 'react';
import { excerptLines, mentions, type ExcerptLine } from './data';

// Phone version of the chapter 1 figure: the same llms.txt lines as HTML,
// wrapping naturally, with the entity mentions marked.

function marked(line: ExcerptLine): ReactNode[] {
  const spans = mentions
    .filter((m) => m.line === line.line)
    .map((m) => ({ start: m.start, end: m.start + m.text.length }))
    .sort((a, b) => a.start - b.start);

  const out: ReactNode[] = [];
  let cursor = 0;
  for (const s of spans) {
    if (s.start > cursor) out.push(line.text.slice(cursor, s.start));
    out.push(
      <mark
        key={s.start}
        className="rounded-[3px] bg-signal/30 px-px text-stage-ink [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
      >
        {line.text.slice(s.start, s.end)}
      </mark>
    );
    cursor = s.end;
  }
  if (cursor < line.text.length) out.push(line.text.slice(cursor));
  return out;
}

export default function Excerpt({ className = '' }: { className?: string }) {
  return (
    <figure className={className}>
      <figcaption className="sr-only">Selected lines of llms.txt with the entity mentions highlighted.</figcaption>
      <ol className="space-y-2 font-mono text-[12px] leading-[1.7] text-stage-label">
        {excerptLines.map((line) => (
          <li key={line.line} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3">
            <span className="text-right tabular-nums text-stage-muted">{line.line}</span>
            <span className="break-words">{marked(line)}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
