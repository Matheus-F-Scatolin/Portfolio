import type { Metadata } from 'next';
import {
  CaseShell,
  StatGrid,
  CaseSection,
  CaseLinks,
  CapabilityGrid,
} from '@/components/CaseStudy';

export const metadata: Metadata = {
  title: 'STELLAR | Matheus Ferracciú Scatolin',
  description:
    'A structured, trustworthy, and explainable LLM-led architecture for reliable customer support, published in the Journal of the Brazilian Computer Society.',
};

export default function StellarCaseStudy() {
  return (
    <CaseShell
      title="STELLAR"
      subtitle="A structured, trustworthy, and explainable LLM-led architecture for reliable customer support."
      meta={[
        'AI Researcher @ Semantix AI, Mar 2024 - Aug 2025',
        'Published in the Journal of the Brazilian Computer Society, 2026',
      ]}
    >
      <StatGrid
        stats={[
          { value: '9', label: 'Specialized modules in the DAG' },
          { value: '11', label: 'Predefined workflows' },
          { value: '90,000+', label: 'Questions in the hallucination benchmark' },
          { value: '7', label: 'Models evaluated' },
        ]}
      />

      <CaseSection heading="The problem">
        <p>
          Customer support was an early production use case for LLMs, but a
          single monolithic model call is hard to trust: answers are difficult
          to explain, hallucinations reach customers directly, and there is no
          structural place to enforce compliance rules or decide when a human
          should take over.
        </p>
      </CaseSection>

      <CaseSection heading="The architecture">
        <p>
          STELLAR (Structured, Trustworthy, and Explainable LLM-Led
          Architecture for Reliable Customer Support) replaces the monolithic
          call with a Directed Acyclic Graph of nine specialized modules,
          composed into eleven predefined workflows. Each module owns one
          responsibility, which makes every answer traceable through the graph:
        </p>
        <CapabilityGrid
          items={[
            'Few-shot classification',
            'Retrieval-Augmented Generation (RAG)',
            'Sentiment analysis',
            'Urgency-aware human escalation',
            'Compliance verification',
            'User interaction validation',
            'Semi-automated knowledge-base refinement',
          ]}
        />
      </CaseSection>

      <CaseSection heading="The evidence">
        <p>
          To ground the design, I built a hallucination benchmark evaluating 7
          models across 90,000+ questions in English and Portuguese. The
          architecture was designed, developed, and led end to end at Semantix
          AI and published as a first-author paper in the Journal of the
          Brazilian Computer Society (Qualis A2, Scopus-indexed), vol. 32,
          2026, with Prof. Hélio Pedrini.
        </p>
      </CaseSection>

      <CaseLinks
        links={[
          { label: 'Read the paper', href: 'https://doi.org/10.5753/jbcs.2026.6044' },
          { label: 'View code', href: 'https://github.com/Matheus-F-Scatolin/STELLAR' },
        ]}
      />
    </CaseShell>
  );
}
