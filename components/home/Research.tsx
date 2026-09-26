'use client';

import { Fragment, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import CopyBibtexButton from '@/components/home/CopyBibtexButton';
import { links, papers, type Paper } from '@/lib/profile';
import { ease, inView } from '@/lib/motion';

// Longest form first, so "Scatolin, M. F." is never split as "Scatolin, M.".
const SELF = /(Scatolin, M\. F\.|Scatolin, M\.)/;

const textLink =
  'text-ink underline decoration-ink/25 underline-offset-[5px] transition-colors duration-300 [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-ink';

function Authors({ authors }: { authors: string }) {
  return (
    <>
      {authors.split(SELF).map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="font-medium text-ink">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}

// "32(1), ..." and "pp. ..." continue the venue; "Submitted." starts a sentence.
function venueJoiner(details: string) {
  return /^[0-9a-z]/.test(details) ? ', ' : '. ';
}

// Authorship role with a highlighter stroke that draws in once, left to right.
function RoleMark({ role }: { role: Paper['role'] }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-block font-mono text-[13px] leading-5 text-ink">
      <motion.span
        aria-hidden
        className="absolute -inset-x-0.5 bottom-0.5 h-1.5 origin-left bg-signal/25"
        initial={reduce ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={inView}
        transition={{ duration: 0.6, ease: ease.out, delay: 0.35 }}
      />
      <span className="relative">{role}</span>
    </span>
  );
}

function ExternalLink({
  href,
  children,
  describedBy,
  className = '',
}: {
  href: string;
  children: ReactNode;
  describedBy?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-describedby={describedBy}
      className={`${textLink} ${className}`}
    >
      {children} <span aria-hidden>↗</span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default function Research() {
  return (
    <section id="research" aria-labelledby="research-title" className="py-24 md:py-32">
      <div className="mx-auto w-full max-w-page px-4 md:px-8">
        <SectionHeading
          id="research-title"
          lead="Research."
          tail="Four papers, from LLM systems to medical imaging."
        />

        <ol role="list" className="mt-14 space-y-12 md:mt-20">
          {papers.map((paper, i) => {
            const titleId = `paper-${paper.id}`;
            return (
              <Reveal
                as="li"
                key={paper.id}
                delay={i * 0.06}
                className="grid gap-y-2 md:grid-cols-[72px_1fr] md:gap-y-0"
              >
                <span aria-hidden className="font-mono text-[14px] leading-6 text-muted">
                  [{i + 1}]
                </span>

                <div className="min-w-0 max-w-[760px]">
                  <p className="text-[15px] leading-6 text-muted">
                    <Authors authors={paper.authors} /> ({paper.year}).
                  </p>
                  <h3
                    id={titleId}
                    className="mt-2 max-w-[62ch] text-pretty text-[20px] font-medium leading-[1.35] tracking-[-0.015em] text-ink"
                  >
                    {paper.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-[1.6] text-ink-2">
                    <em className="italic">{paper.venue}</em>
                    {venueJoiner(paper.details)}
                    {paper.details}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      <RoleMark role={paper.role} />
                      {paper.metric ? (
                        <span className="font-mono text-[13px] text-muted">{paper.metric}</span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      {paper.links.map((link) => (
                        <ExternalLink
                          key={link.href}
                          href={link.href}
                          describedBy={titleId}
                          className="text-[14px]"
                        >
                          {link.label}
                        </ExternalLink>
                      ))}
                      <CopyBibtexButton bibtex={paper.bibtex} describedBy={titleId} />
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </ol>

        <Reveal className="mt-16 space-y-3 text-[15px] leading-[1.6] text-muted md:pl-[72px]">
          <p className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <span>Profiles:</span>
            <ExternalLink href={links.scholar}>Google Scholar</ExternalLink>
            <ExternalLink href={links.researchgate}>ResearchGate</ExternalLink>
            <ExternalLink href={links.orcid}>ORCID</ExternalLink>
          </p>
          <p>
            Additional research: automatic knowledge graph generation and Graph-RAG at Instituto
            Kunumi (2025-2026).
          </p>
        </Reveal>
      </div>
    </section>
  );
}
