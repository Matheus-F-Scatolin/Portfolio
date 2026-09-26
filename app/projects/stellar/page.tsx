import type { Metadata } from 'next';
import {
  CaseShell,
  StatGrid,
  CaseSection,
  CapabilityGrid,
  CaseFigure,
  CaseLinks,
  NextCase,
} from '@/components/CaseStudy';

const title = 'STELLAR | Matheus Ferracciú Scatolin';
const description =
  'An LLM architecture for reliable customer support, built as a directed acyclic graph of nine specialized modules and eleven predefined workflows. Published in the Journal of the Brazilian Computer Society.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, url: '/projects/stellar' },
};

export default function StellarCaseStudy() {
  return (
    <CaseShell
      title="STELLAR"
      subtitle="An LLM architecture for reliable customer support, built as a directed acyclic graph of nine specialized modules and eleven predefined workflows."
      meta={['Semantix AI, Mar 2024 - Aug 2025', 'Journal of the Brazilian Computer Society, 2026']}
    >
      <StatGrid
        stats={[
          { value: '9', label: 'Specialized modules' },
          { value: '11', label: 'Predefined workflows' },
          { value: 'A2', label: 'Qualis rating of the journal, indexed in Scopus' },
          { value: '2026', label: 'Published in JBCS, vol. 32, as first author' },
        ]}
      />

      <CaseSection heading="One LLM call is hard to trust">
        <p>
          When a single model call answers the customer directly, its answers are difficult to explain, a
          hallucination goes straight to the customer, and there is no structural place to check compliance or to
          decide when a person should take over.
        </p>
      </CaseSection>

      <CaseSection heading="Nine modules, eleven workflows">
        <p>
          STELLAR (Structured, Trustworthy, and Explainable LLM-Led Architecture for Reliable Customer Support)
          replaces the single call with a directed acyclic graph of nine specialized modules, composed into eleven
          predefined workflows. Together the modules cover:
        </p>
        <CapabilityGrid
          items={[
            'Few-shot classification',
            'Retrieval-augmented generation (RAG)',
            'Sentiment analysis',
            'Urgency-aware human escalation',
            'Compliance verification',
            'User interaction validation',
            'Semi-automated knowledge base refinement',
          ]}
        />
      </CaseSection>

      <CaseFigure
        src="/previews/stellar.png"
        alt="STELLAR diagram: a classification module routes each request to RAG, direct information or sentiment analysis, followed by compliance, verification, feedback, FAQ and human escalation paths."
        aspect="16/11"
        fit="contain"
        caption="The nine STELLAR modules as a directed acyclic graph."
      />

      <CaseSection heading="Three branches after classification">
        <p>
          Every request starts at classification and takes one of three branches: retrieval-augmented generation, a
          direct-information answer, or sentiment analysis. The first two pass through compliance and verification
          modules, and a failure at either point sends the conversation to a person or to an FAQ path. The sentiment
          branch leads to human escalation, which feeds knowledge base refinement.
        </p>
      </CaseSection>

      <CaseSection heading="First-author paper in JBCS">
        <p>
          I designed, developed and led STELLAR at Semantix AI as a production-ready architecture, then published it
          as first author with Hélio Pedrini in the Journal of the Brazilian Computer Society, vol. 32(1), pp.
          128-144, 2026. The journal is Qualis A2 and indexed in Scopus.
        </p>
      </CaseSection>

      <CaseSection heading="Also at Semantix">
        <p>
          Separately from STELLAR, I built a hallucination benchmark that evaluated 7 models across 90,000+ questions
          in English and Portuguese. I also researched RAG techniques and built data pipelines for RAG-based
          retrieval.
        </p>
      </CaseSection>

      <CaseLinks
        links={[
          { label: 'Read the paper', href: 'https://doi.org/10.5753/jbcs.2026.6044' },
          { label: 'Code on GitHub', href: 'https://github.com/Matheus-F-Scatolin/STELLAR' },
        ]}
      />

      <NextCase current="stellar" />
    </CaseShell>
  );
}
