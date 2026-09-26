'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { CopyButton } from '@/components/home/CopyBibtexButton';
import { links } from '@/lib/profile';
import { ease } from '@/lib/motion';

const tabs = [
  { key: 'contact', label: 'Contact' },
  { key: 'agent', label: 'For your agent' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const contacts = [
  { name: 'LinkedIn', handle: 'in/matheus-scatolin', href: links.linkedin },
  { name: 'GitHub', handle: 'Matheus-F-Scatolin', href: links.github },
  { name: 'Google Scholar', handle: 'scholar.google.com', href: links.scholar },
];

const CURL = `curl ${links.site}${links.llms}`;

async function fetchProfile() {
  const res = await fetch(links.llms);
  if (!res.ok) throw new Error(`llms.txt ${res.status}`);
  return res.text();
}

function openProfile() {
  window.open(links.llms, '_blank', 'noopener,noreferrer');
}

export default function FooterTabs({ previewLines }: { previewLines: string[] }) {
  const [active, setActive] = useState<TabKey>('contact');
  const reduce = useReducedMotion();
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const profile = useRef<string | null>(null);

  // Load the profile once the agent tab opens, so "Copy full profile" can
  // write to the clipboard inside the click instead of after a fetch.
  useEffect(() => {
    if (active !== 'agent' || profile.current) return;
    fetchProfile()
      .then((text) => {
        profile.current = text;
      })
      .catch(() => {});
  }, [active]);

  const getProfile = () => profile.current ?? fetchProfile();

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    setActive(tabs[next].key);
    tabRefs.current[next]?.focus();
  };

  const tabId = (key: TabKey) => `${baseId}-tab-${key}`;
  const panelId = (key: TabKey) => `${baseId}-panel-${key}`;

  return (
    <div>
      <div role="tablist" aria-label="Contact options" className="inline-flex rounded-full bg-stage-2 p-1">
        {tabs.map((tab, index) => {
          const selected = tab.key === active;
          return (
            <button
              key={tab.key}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={tabId(tab.key)}
              aria-selected={selected}
              aria-controls={selected ? panelId(tab.key) : undefined}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.key)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`relative rounded-full px-4 py-2 text-[14px] font-medium transition-colors duration-300 ${
                selected
                  ? 'text-stage'
                  : 'text-stage-label [@media(hover:hover)_and_(pointer:fine)]:hover:text-stage-ink'
              }`}
            >
              {selected ? (
                <motion.span
                  layoutId="footer-tab-indicator"
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-stage-ink"
                  style={{ borderRadius: 9999 }}
                  transition={{ duration: reduce ? 0 : 0.35, ease: ease.out }}
                />
              ) : null}
              <span className="relative">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={active}
          role="tabpanel"
          id={panelId(active)}
          aria-labelledby={tabId(active)}
          tabIndex={0}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: reduce ? 0 : 0.25, ease: ease.out } }}
          exit={{ opacity: 0, transition: { duration: reduce ? 0 : 0.15, ease: ease.out } }}
          className="mt-10 focus-visible:outline-offset-8"
        >
          {active === 'contact' ? (
            <ContactPanel />
          ) : (
            <AgentPanel previewLines={previewLines} getProfile={getProfile} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ContactPanel() {
  return (
    <>
      <ul role="list">
        {contacts.map((contact) => (
          <li key={contact.name} className="border-b border-stage-ink/10">
            <a
              href={contact.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group grid grid-cols-[1fr_auto] items-center gap-x-6 py-5 md:py-6"
            >
              <span className="flex min-w-0 flex-col gap-1 md:flex-row md:items-baseline md:justify-between md:gap-6">
                <span className="text-[28px] font-medium leading-[1.1] tracking-[-0.03em] text-stage-ink md:text-[36px]">
                  {contact.name}
                </span>
                <span className="font-mono text-[13px] text-stage-muted transition-colors duration-300 [@media(hover:hover)_and_(pointer:fine)]:group-hover:text-stage-label">
                  {contact.handle}
                </span>
              </span>
              <span
                aria-hidden
                className="text-[24px] leading-none text-stage-muted transition-[color,transform] duration-300 ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover:-translate-y-1 [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-1 [@media(hover:hover)_and_(pointer:fine)]:group-hover:text-stage-ink"
              >
                ↗
              </span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-[15px] text-stage-muted">Based in Campinas, Brazil.</p>
    </>
  );
}

function AgentPanel({
  previewLines,
  getProfile,
}: {
  previewLines: string[];
  getProfile: () => string | Promise<string>;
}) {
  return (
    <>
      <p className="max-w-[44ch] text-[17px] leading-[1.6] text-stage-label">
        My full profile as one Markdown file, written for LLMs and agents.
      </p>

      <div className="mt-6 flex flex-col items-start gap-4 rounded-surface bg-stage-2 p-6 font-mono text-[13px] sm:flex-row sm:items-center sm:justify-between">
        <code className="min-w-0 leading-[1.6] text-stage-ink [overflow-wrap:anywhere]">{CURL}</code>
        <CopyButton
          source={CURL}
          label="Copy"
          announcement="Command copied to clipboard."
          className="shrink-0 rounded-full border border-stage-ink/15 px-3 py-1 font-sans text-[13px] text-stage-label transition-[border-color,color,transform] duration-300 ease-out active:scale-[0.98] [@media(hover:hover)_and_(pointer:fine)]:hover:border-stage-ink/30 [@media(hover:hover)_and_(pointer:fine)]:hover:text-stage-ink"
        />
      </div>

      {previewLines.length > 0 ? (
        <figure className="mt-4 rounded-surface border border-stage-ink/10 p-5 md:p-6">
          <figcaption className="sr-only">The first {previewLines.length} lines of llms.txt</figcaption>
          <div className="font-mono text-[13px] leading-[1.7] text-stage-label [mask-image:linear-gradient(to_bottom,#000_60%,rgb(0_0_0/0.35))]">
            {previewLines.map((line, i) => (
              <div key={i} className="grid grid-cols-[2ch_1fr] gap-x-4 md:gap-x-5">
                <span aria-hidden className="select-none text-right text-stage-muted">
                  {i + 1}
                </span>
                <span
                  className={`min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere] ${
                    line.startsWith('#') ? 'text-stage-ink' : ''
                  }`}
                >
                  {line || ' '}
                </span>
              </div>
            ))}
          </div>
        </figure>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
        <CopyButton
          source={getProfile}
          label="Copy full profile"
          announcement="Full profile copied to clipboard."
          onFail={openProfile}
          className="rounded-full bg-stage-ink px-6 py-3 text-[15px] font-medium text-stage transition-[background-color,transform] duration-300 ease-out active:scale-[0.98] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-white"
        />
        <a
          href={links.llms}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[15px] text-stage-ink underline decoration-stage-ink/25 underline-offset-[6px] transition-colors duration-300 [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-stage-ink"
        >
          Open llms.txt <span aria-hidden>↗</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </>
  );
}
