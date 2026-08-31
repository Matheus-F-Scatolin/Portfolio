'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowRight } from 'lucide-react';

interface Publication {
  title: string;
  role: 'First author' | 'Co-first author' | 'Co-author';
  venue: string;
  year: string;
  summary: string;
  link: string;
  caseStudy?: string;
}

const publications: Publication[] = [
  {
    title:
      'STELLAR: A Structured, Trustworthy, and Explainable LLM-Led Architecture for Reliable Customer Support',
    role: 'First author',
    venue: 'Journal of the Brazilian Computer Society',
    year: '2026',
    summary:
      'A DAG of nine specialized modules and eleven workflows for reliable, explainable LLM-based customer support.',
    link: 'https://doi.org/10.5753/jbcs.2026.6044',
    caseStudy: '/projects/stellar',
  },
  {
    title:
      'Predicting Brain Tumor Response to Therapy using a Hybrid Deep Learning and Radiomics Approach',
    role: 'Co-first author',
    venue: 'BraTS-Lighthouse 2025 Challenge (MICCAI 2025)',
    year: '2025',
    summary:
      'Fuses ResNet-18 deep features with 4,800+ radiomic features; reaches 0.81 mean ROC AUC on 4-class RANO response prediction.',
    link: 'https://arxiv.org/abs/2509.06511',
    caseStudy: '/projects/brain-tumor-ai',
  },
  {
    title:
      'EMedNeXt: An Enhanced Brain Tumor Segmentation Framework for Sub-Saharan Africa Using MedNeXt V2 with Deep Supervision',
    role: 'Co-author',
    venue: 'MICCAI 2025 / Springer LNCS',
    year: '2026',
    summary:
      'Robust glioma segmentation with an average LesionWise DSC of 0.897 on the hidden validation set.',
    link: 'https://doi.org/10.1007/978-3-032-16365-3_21',
  },
  {
    title:
      'MISFIT: Modality Inference via Style Fusion and Invertible Translation for Cross-Modality Synthesis of 3D MRI Volumes',
    role: 'Co-author',
    venue: 'MICCAI 2025 / Springer LNCS',
    year: '2026',
    summary:
      'Two-stage generative framework for 3D brain MRI synthesis operating entirely in the wavelet domain.',
    link: 'https://doi.org/10.1007/978-3-032-16370-7_4',
  },
];

export default function Research() {
  return (
    <section id="research" className="py-20">
      <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-12 text-white">
        Research & Publications
      </h2>

      <div className="space-y-10">
        {publications.map((pub, index) => (
          <motion.article
            key={pub.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
          >
            <a
              href={pub.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <h3 className="text-base font-semibold text-neutral-200 leading-snug group-hover:text-white transition-colors">
                {pub.title}
                <ArrowUpRight
                  size={14}
                  className="inline-block ml-1.5 -mt-0.5 text-neutral-500 group-hover:text-blue-400 transition-colors"
                />
              </h3>
            </a>
            <p className="text-xs font-mono text-blue-400 mt-1.5 uppercase tracking-wider">
              {pub.role} · {pub.venue}, {pub.year}
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed mt-2 max-w-prose">
              {pub.summary}
            </p>
            {pub.caseStudy && (
              <Link
                href={pub.caseStudy}
                className="inline-flex items-center gap-1 text-xs font-medium text-neutral-300 hover:text-white transition-colors mt-2"
              >
                Case study <ArrowRight size={12} />
              </Link>
            )}
          </motion.article>
        ))}
      </div>

      <a
        href="https://scholar.google.com/citations?hl=en&authuser=2&user=ieyEKR4AAAAJ"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors mt-10"
      >
        Google Scholar profile <ArrowUpRight size={14} />
      </a>
    </section>
  );
}
