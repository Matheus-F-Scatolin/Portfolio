import { readFileSync } from 'fs';
import path from 'path';
import SectionHeading from '@/components/ui/SectionHeading';
import FooterTabs from '@/components/home/FooterTabs';
import { person } from '@/lib/profile';

const PREVIEW_LINES = 14;

// Read at build time (server component): the head of the real llms.txt,
// with bold markers removed so the preview reads as plain text.
function readPreview(): string[] {
  try {
    const raw = readFileSync(path.join(process.cwd(), 'public', 'llms.txt'), 'utf8');
    return raw
      .split(/\r?\n/)
      .slice(0, PREVIEW_LINES)
      .map((line) => line.replace(/\*\*/g, ''));
  } catch {
    return [];
  }
}

export default function SiteFooter() {
  const previewLines = readPreview();

  return (
    <footer id="contact" data-surface="dark" className="px-3 pb-3">
      <div className="overflow-hidden rounded-surface bg-stage text-stage-ink">
        <div className="mx-auto w-full max-w-page px-6 pb-10 pt-20 md:px-12 md:pt-28">
          <div className="grid gap-y-12 lg:grid-cols-12 lg:gap-x-10">
            <SectionHeading
              surface="stage"
              lead="Say hello."
              tail="LinkedIn is the fastest way to reach me."
              className="lg:col-span-5"
            />
            <div className="min-w-0 lg:col-span-7 lg:pt-2">
              <FooterTabs previewLines={previewLines} />
            </div>
          </div>

          <p className="mt-24 font-mono text-[12px] text-stage-muted md:mt-32">© 2026 {person.name}</p>
        </div>
      </div>
    </footer>
  );
}
