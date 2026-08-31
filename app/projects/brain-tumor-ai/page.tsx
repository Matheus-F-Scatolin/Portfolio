import type { Metadata } from 'next';
import {
  CaseShell,
  StatGrid,
  CaseSection,
  CaseLinks,
} from '@/components/CaseStudy';

export const metadata: Metadata = {
  title: 'Brain Tumor AI at MBZUAI | Matheus Ferracciú Scatolin',
  description:
    '3D brain tumor segmentation, missing-modality synthesis, and therapy-response prediction for the BraTS 2025 Challenge. Best Team Award at MBZUAI UGRIP 2025.',
};

export default function BrainTumorCaseStudy() {
  return (
    <CaseShell
      title="Brain Tumor AI"
      subtitle="A complete pipeline for 3D tumor segmentation, missing-modality synthesis, and therapy-response prediction, built for the BraTS 2025 Challenge."
      meta={[
        'MBZUAI UGRIP 2025, supervised by Dr. Mohammad Yaqub',
        'Best Team Award among 15 research groups',
      ]}
    >
      <StatGrid
        stats={[
          { value: '3', label: 'Papers authored during the program' },
          { value: '0.897', label: 'Avg. LesionWise DSC, segmentation (hidden validation)' },
          { value: '0.81', label: 'Mean ROC AUC, 4-class response prediction' },
          { value: 'Top 3%', label: 'UGRIP acceptance rate, 2,000+ applicants' },
        ]}
      />

      <CaseSection heading="The setting">
        <p>
          I was selected among the top 3% of 2,000+ international applicants
          for UGRIP 2025, MBZUAI&apos;s fully funded AI research program in Abu
          Dhabi. Over one summer, our team built a complete medical-imaging
          pipeline for the BraTS 2025 Challenge, and I served as one of the
          final presenters when the team received the Best Team Award among 15
          research groups.
        </p>
      </CaseSection>

      <CaseSection heading="Three connected workstreams">
        <p>
          <span className="text-neutral-200 font-medium">Segmentation (EMedNeXt).</span>{' '}
          An enhanced MedNeXt V2 framework with deep supervision for robust
          glioma segmentation in sub-Saharan Africa, reaching an average
          LesionWise DSC of 0.897 on the hidden validation set. Published as a
          MICCAI 2025 LNCS chapter.
        </p>
        <p>
          <span className="text-neutral-200 font-medium">Missing-modality synthesis (MISFIT).</span>{' '}
          A two-stage generative framework for 3D brain MRI synthesis operating
          entirely in the wavelet domain, built for the BraSyn task. Also
          published as a MICCAI 2025 LNCS chapter.
        </p>
        <p>
          <span className="text-neutral-200 font-medium">Therapy-response prediction.</span>{' '}
          A hybrid framework fusing fine-tuned ResNet-18 deep features with
          4,800+ radiomic and clinically driven features; a CatBoost classifier
          reaches a mean ROC AUC of 0.81 on the 4-class RANO response
          prediction task. I co-first-authored this paper.
        </p>
      </CaseSection>

      <CaseLinks
        links={[
          { label: 'Response prediction (arXiv)', href: 'https://arxiv.org/abs/2509.06511' },
          { label: 'EMedNeXt (Springer)', href: 'https://doi.org/10.1007/978-3-032-16365-3_21' },
          { label: 'MISFIT (Springer)', href: 'https://doi.org/10.1007/978-3-032-16370-7_4' },
          { label: 'EMedNeXt code', href: 'https://github.com/BioMedIA-MBZUAI/EMedNeXt-BraTS-SSA-2025' },
        ]}
      />
    </CaseShell>
  );
}
