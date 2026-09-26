import type { Metadata } from 'next';
import {
  CaseShell,
  StatGrid,
  CaseSection,
  CaseFigureRow,
  CaseLinks,
  NextCase,
} from '@/components/CaseStudy';

const title = 'Brain tumor AI | Matheus Ferracciú Scatolin';
const description =
  '3D brain tumor segmentation, missing-modality synthesis and therapy response prediction for the BraTS 2025 Challenge. Best Team Award at MBZUAI UGRIP 2025.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, url: '/projects/brain-tumor-ai' },
};

export default function BrainTumorCaseStudy() {
  return (
    <CaseShell
      title="Brain tumor AI"
      subtitle="A multimodal 3D MRI pipeline for brain tumor segmentation, missing-modality synthesis and therapy response prediction, built for the BraTS 2025 Challenge."
      meta={['MBZUAI, UGRIP Research Intern, Jun 2025 - Sep 2025', 'Supervised by Dr. Mohammad Yaqub']}
    >
      <StatGrid
        stats={[
          { value: '3', label: 'Papers from the program: 1 co-first author, 2 co-author' },
          { value: '0.897', label: 'Average LesionWise DSC on the hidden validation set' },
          { value: '0.81', label: 'Mean ROC AUC, 4-class RANO response prediction' },
          { value: '60', label: 'Selected from 2,000+ international applicants' },
        ]}
      />

      <CaseSection heading="One summer at MBZUAI">
        <p>
          UGRIP is MBZUAI&apos;s fully funded AI research program in Abu Dhabi. I was selected among the top 3% of
          2,000+ international applicants, one of about 60 students. In one summer, our team built a complete 3D
          medical imaging pipeline for the BraTS 2025 Challenge.
        </p>
        <p>
          I was one of the final presenters, and the team received the Best Team Award, the top award among 15
          research groups.
        </p>
      </CaseSection>

      <CaseFigureRow
        figures={[
          {
            src: '/gallery/mbzuai-best-team.jpg',
            alt: 'Matheus and his UGRIP teammates holding Best Team certificates in front of an MBZUAI screen.',
            aspect: '3/2',
            caption: 'Best Team Award, UGRIP 2025.',
          },
          {
            src: '/gallery/mbzuai-entrance.jpg',
            alt: 'Matheus wearing a Brazilian flag at the main entrance of MBZUAI in Abu Dhabi.',
            aspect: '3/4',
          },
        ]}
      />

      <CaseSection heading="One paper per task">
        <p>
          <span className="font-medium text-ink">Segmentation.</span> EMedNeXt is an enhanced MedNeXt V2 framework
          with deep supervision for glioma segmentation in sub-Saharan Africa. It reached an average LesionWise DSC
          of 0.897 on the hidden validation set and was published in Lecture Notes in Computer Science, vol. 16376,
          with me as co-author.
        </p>
        <p>
          <span className="font-medium text-ink">Missing-modality synthesis.</span> MISFIT is a two-stage generative
          framework for cross-modality synthesis of 3D brain MRI that operates entirely in the wavelet domain, built
          for the BraSyn task. It was published in Lecture Notes in Computer Science, vol. 16377, with me as
          co-author.
        </p>
        <p>
          <span className="font-medium text-ink">Response prediction.</span> A hybrid framework fuses fine-tuned
          ResNet-18 deep features with 4,800+ radiomic and clinically driven features, and a CatBoost classifier
          reaches a mean ROC AUC of 0.81 on 4-class RANO response prediction. I am co-first author of this paper,
          submitted to the BraTS-Lighthouse 2025 Challenge and available on arXiv.
        </p>
      </CaseSection>

      <CaseLinks
        links={[
          { label: 'Response prediction on arXiv', href: 'https://arxiv.org/abs/2509.06511' },
          { label: 'EMedNeXt on Springer', href: 'https://doi.org/10.1007/978-3-032-16365-3_21' },
          { label: 'MISFIT on Springer', href: 'https://doi.org/10.1007/978-3-032-16370-7_4' },
          { label: 'EMedNeXt code', href: 'https://github.com/BioMedIA-MBZUAI/EMedNeXt-BraTS-SSA-2025' },
          { label: 'MISFIT code', href: 'https://github.com/mohrsalt/MISFIT' },
        ]}
      />

      <NextCase current="brain-tumor-ai" />
    </CaseShell>
  );
}
