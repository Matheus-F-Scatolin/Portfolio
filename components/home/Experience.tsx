import Reveal from '@/components/ui/Reveal';
import SectionHeading from '@/components/ui/SectionHeading';
import { education, roles, type Role } from '@/lib/profile';

const columns: { kind: Role['kind']; label: string }[] = [
  { kind: 'industry', label: 'Industry' },
  { kind: 'research', label: 'Research' },
];

const stagger = 0.06;

export default function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-title" className="py-24 md:py-32">
      <div className="mx-auto w-full max-w-page px-4 md:px-8">
        <SectionHeading
          id="experience-title"
          lead="Experience."
          tail="Seven roles since 2024, in industry and research."
        />

        <div className="mt-14 grid gap-y-16 md:mt-20 md:grid-cols-2 md:gap-x-16">
          {columns.map((column, c) => {
            const list = roles.filter((role) => role.kind === column.kind);
            return (
              <div key={column.kind}>
                {/* The only hairline in the group. The count is small text, so it
                    uses muted (5.1:1) rather than tone. */}
                <h3 className="border-b border-line pb-4 text-[15px] font-medium text-ink">
                  {column.label}{' '}
                  <span className="text-muted">
                    {list.length}
                    <span className="sr-only"> roles</span>
                  </span>
                </h3>
                <ol className="mt-8 space-y-10">
                  {list.map((role, i) => (
                    <Reveal as="li" key={`${role.org}-${role.dates}`} delay={(i + c) * stagger}>
                      <p className="font-mono text-[13px] text-muted">{role.dates}</p>
                      <h4 className="mt-2.5 text-[21px] font-medium leading-[1.25] tracking-[-0.02em] text-ink">
                        {role.org}
                      </h4>
                      <p className="mt-1 text-[15px] leading-[1.5] text-ink-2">{role.title}</p>
                      <p className="mt-3 max-w-[48ch] text-[15px] leading-[1.6] text-muted">
                        {role.summary}
                      </p>
                    </Reveal>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>

        <Reveal className="mt-20 rounded-surface bg-panel p-8 md:p-10">
          <h3 className="text-[clamp(1.5rem,2.2vw,1.875rem)] font-medium leading-[1.15] tracking-[-0.025em] text-ink">
            Education
          </h3>
          <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-16">
            {education.map((entry) => (
              <div key={entry.org}>
                <h4 className="text-[21px] font-medium leading-[1.25] tracking-[-0.02em] text-ink">
                  {entry.org}
                </h4>
                <p className="mt-1 text-[15px] leading-[1.5] text-ink-2">{entry.title}</p>
                <p className="mt-3 font-mono text-[13px] text-muted">{entry.dates}</p>
                <p className="mt-2 max-w-[48ch] text-[15px] leading-[1.6] text-muted">
                  {entry.note}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
