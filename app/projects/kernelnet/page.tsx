import type { Metadata } from 'next';
import {
  CaseShell,
  StatGrid,
  CaseSection,
  CaseLinks,
} from '@/components/CaseStudy';

export const metadata: Metadata = {
  title: 'KernelNet | Matheus Ferracciú Scatolin',
  description:
    'A market-neutral algorithmic trading strategy using nonlinear causality networks. 2nd place in the Itaú Asset Quant AI Challenge 2025.',
};

export default function KernelNetCaseStudy() {
  return (
    <CaseShell
      title="KernelNet"
      subtitle="A market-neutral trading strategy that generalizes pairs trading by replacing static correlations with nonlinear causality networks."
      meta={[
        'Itaú Asset Quant AI Challenge 2025',
        '2nd place (Silver Medal) among ~1,000 teams',
      ]}
    >
      <StatGrid
        stats={[
          { value: '1.29', label: 'Sharpe ratio' },
          { value: '54.85%', label: 'Annualized return' },
          { value: '22.78%', label: 'Benchmark annualized return' },
          { value: '2nd', label: 'Of ~1,000 teams and 2,500+ participants' },
        ]}
      />

      <CaseSection heading="The problem">
        <p>
          Classic pairs trading rests on static correlations between assets.
          Those relationships are linear snapshots: when market regimes shift,
          the correlations that justified a pair can quietly break down, and
          the strategy degrades with them.
        </p>
      </CaseSection>

      <CaseSection heading="The approach">
        <p>
          KernelNet generalizes pairs trading by replacing static correlations
          with nonlinear causality networks: instead of asking which assets
          moved together historically, it models which assets drive each other,
          and trades those relationships while staying market-neutral. The
          design goal was robustness across different market regimes rather
          than performance in a single favorable window.
        </p>
      </CaseSection>

      <CaseSection heading="The result">
        <p>
          The strategy achieved a 1.29 Sharpe ratio and a 54.85% annualized
          return against the benchmark&apos;s 22.78%, earning 2nd place (Silver
          Medal) among nearly 1,000 teams and 2,500+ participants in
          Brazil&apos;s largest quant challenge for undergraduates, a field
          that included Brazilian competitors from MIT, Stanford, and
          Berkeley.
        </p>
      </CaseSection>

      <CaseLinks
        links={[
          {
            label: 'Announcement on LinkedIn',
            href: 'https://www.linkedin.com/posts/matheus-scatolin_desafioquantai2025-itaaeqasset-finanaexasquantitativas-activity-7406379037675294720-anxi',
          },
        ]}
      />
    </CaseShell>
  );
}
