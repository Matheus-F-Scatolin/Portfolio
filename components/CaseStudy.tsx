import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { ReactNode } from 'react';

export function CaseShell({
  title,
  subtitle,
  meta,
  children,
}: {
  title: string;
  subtitle: string;
  meta: string[];
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen px-4 md:px-0">
      <article className="max-w-3xl mx-auto w-full pt-28 pb-20">
        <Link
          href="/#projects"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors mb-10"
        >
          <ArrowLeft size={14} /> Back to projects
        </Link>

        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-white">
          {title}
        </h1>
        <p className="text-lg text-zinc-400 mt-4 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
        <div className="mt-4 space-y-1">
          {meta.map((line) => (
            <p key={line} className="text-xs font-mono text-blue-400 uppercase tracking-wider">
              {line}
            </p>
          ))}
        </div>

        {children}
      </article>
    </main>
  );
}

export function StatGrid({
  stats,
}: {
  stats: { value: string; label: string }[];
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8 mt-12">
      {stats.map((stat) => (
        <div key={stat.label} className="border-l border-neutral-800 pl-4">
          <p className="text-2xl md:text-3xl font-semibold text-white">
            {stat.value}
          </p>
          <p className="text-xs text-zinc-500 mt-1 leading-snug">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

export function CaseSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-14">
      <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-white mb-4">
        {heading}
      </h2>
      <div className="space-y-4 text-neutral-400 text-sm md:text-base leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export function CaseLinks({
  links,
}: {
  links: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-3 mt-14">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 text-white text-sm font-medium rounded-md px-5 py-2.5 transition-colors hover:border-neutral-600 hover:bg-neutral-800"
        >
          {link.label} <ArrowUpRight size={14} />
        </a>
      ))}
    </div>
  );
}

export function CapabilityGrid({ items }: { items: string[] }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
      {items.map((item) => (
        <li
          key={item}
          className="text-sm text-neutral-300 bg-neutral-900/60 border border-neutral-800 rounded-md px-4 py-2.5"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
