import type { Metadata } from 'next';
import {
  CaseShell,
  StatGrid,
  CaseSection,
  CaseFigureRow,
  CaseLinks,
  NextCase,
} from '@/components/CaseStudy';

const title = 'KernelNet | Matheus Ferracciú Scatolin';
const description =
  'A market-neutral algorithmic trading strategy built on nonlinear causality networks. 2nd place in the Itaú Asset Quant AI Challenge 2025.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, url: '/projects/kernelnet' },
};

export default function KernelNetCaseStudy() {
  return (
    <CaseShell
      title="KernelNet"
      subtitle="A market-neutral trading strategy that generalizes pairs trading by replacing static correlations with nonlinear causality networks."
      meta={['Itaú Asset Quant AI Challenge 2025', 'Itaú Asset Management, Dec 2025']}
    >
      <StatGrid
        stats={[
          { value: '1.29', label: 'Sharpe ratio' },
          { value: '54.85%', label: 'Annualized return' },
          { value: '22.78%', label: 'Annualized return of the benchmark' },
          { value: '2nd', label: 'Of ~1,000 teams and 2,500+ participants' },
        ]}
      />

      <CaseSection heading="Why pairs trading breaks">
        <p>
          Pairs trading bets that two historically correlated assets will return to their usual relationship. That
          correlation is static and linear, so when the market regime changes, a pair can stop behaving as it did and
          the trade stops working.
        </p>
      </CaseSection>

      <CaseSection heading="Causality instead of correlation">
        <p>
          KernelNet generalizes the idea. Instead of a static correlation between two assets, it builds a nonlinear
          causality network across assets, which captures which assets drive others rather than which ones happened
          to move together. The strategy trades those relationships while staying market-neutral.
        </p>
      </CaseSection>

      <CaseSection heading="The result">
        <p>
          The strategy reached a Sharpe ratio of 1.29 and a 54.85% annualized return, against 22.78% for the
          benchmark, and held up across different market regimes.
        </p>
        <p>
          We placed 2nd (Silver Medal) among nearly 1,000 teams and 2,500+ participants in Brazil&apos;s largest
          challenge for undergraduate students. The field also included Brazilian competitors from MIT, Stanford and
          Berkeley.
        </p>
      </CaseSection>

      <CaseFigureRow
        figures={[
          {
            src: '/gallery/itau-quant-stage.jpg',
            alt: 'Matheus speaking into a microphone on stage next to his two teammates, in front of the Desafio Quant AI backdrop.',
            aspect: '3/4',
            caption: 'Presenting KernelNet at the final of the Itaú Asset Quant AI Challenge.',
          },
          {
            src: '/gallery/itau-quant-award.jpg',
            alt: 'Matheus and his two teammates holding Desafio Quant AI 2025 trophies in front of the Itaú Asset Management sign.',
            aspect: '4/3',
          },
        ]}
      />

      <CaseLinks
        links={[
          {
            label: 'Announcement on LinkedIn',
            href: 'https://www.linkedin.com/posts/matheus-scatolin_desafioquantai2025-itaaeqasset-finanaexasquantitativas-activity-7406379037675294720-anxi',
          },
        ]}
      />

      <NextCase current="kernelnet" />
    </CaseShell>
  );
}
