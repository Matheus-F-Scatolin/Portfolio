'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const awards = [
  {
    title: '2nd Place - Itaú Asset Quant AI Challenge 2025',
    issuingOrganization: 'Itaú Asset Management',
    issueDate: 'Dec 2025',
    description:
      "Awarded 2nd place (Silver Medal) out of nearly 1,000 teams and 2,500+ participants. Designed 'KernelNet', a market-neutral algorithmic trading strategy using nonlinear causality networks, achieving a 1.29 Sharpe Ratio and 54.85% annualized return.",
  },
  {
    title: 'Best Team Award - UGRIP AI Research Internship',
    issuingOrganization:
      'MBZUAI (Mohamed bin Zayed University of Artificial Intelligence)',
    issueDate: 'Jul 2025',
    description:
      "Awarded 'Best Team' among 15 research groups for a solution to the BraTS 2025 Challenge. Selected for this fully funded program from a pool of over 2,000 international applicants (top 3% selection rate).",
  },
  {
    title: 'Gold Medal - Math Kangaroo Brazil (Canguru de Matemática)',
    issuingOrganization: 'Association Kangourou sans Frontières (AKSF)',
    issueDate: 'Jul 2021',
    description:
      "Awarded the Gold Medal (top 1% nationwide) in the world's largest international mathematics competition. Over 400,000 participants in the 2021 Brazilian edition.",
  },
  {
    title: 'Gold Medal - Brazilian Olympiad of Astronomy and Astronautics (OBA)',
    issuingOrganization: 'SAB & AEB',
    issueDate: 'Oct 2021',
    description:
      'Highest distinction awarded to the top 2-3% of participants nationwide. 2021 edition featured approximately 481,000 participants.',
  },
  {
    title: 'Gold Medal - National Science Olympiad (ONC)',
    issuingOrganization: 'Ministry of Science, Technology and Innovation (MCTI)',
    issueDate: 'Mar 2021',
    description:
      'Achieved the highest distinction in the 2020 edition among over 2 million students. Demonstrated advanced proficiency across Physics, Chemistry, Biology, Astronomy, and History.',
  },
  {
    title: 'Gold Medal - Brazilian Olympiad of Astronomy and Astronautics (OBA)',
    issuingOrganization: 'SAB & AEB',
    issueDate: 'Oct 2020',
    description:
      'Highest distinction (top 2-3% nationwide). 2020 Virtual Edition featured approximately 437,000 participants.',
  },
  {
    title: 'Honorable Mention - OBMEP (Mathematics Olympiad)',
    issuingOrganization: 'IMPA',
    issueDate: 'Dec 2019',
    description:
      'Achieved distinction in the 15th edition among 18.1 million participants. Awarded to the top 0.27% of students nationwide.',
  },
  {
    title: 'Gold Medal - Brazilian Olympiad of Astronomy and Astronautics (OBA)',
    issuingOrganization: 'SAB & AEB',
    issueDate: 'Oct 2019',
    description:
      'Highest distinction (top 2-3% nationwide). 2019 edition featured approximately 884,000 participants.',
  },
  {
    title: 'Gold Medal - Math Kangaroo Brazil (Canguru de Matemática)',
    issuingOrganization: 'Association Kangourou sans Frontières (AKSF)',
    issueDate: 'Jul 2019',
    description:
      'Awarded the Gold Medal (top 1% nationwide). Over 300,000 participants in the 2019 Brazilian edition.',
  },
  {
    title: 'Honorable Mention - OBMEP (Mathematics Olympiad)',
    issuingOrganization: 'IMPA',
    issueDate: 'Dec 2018',
    description:
      'Achieved distinction in the 14th edition among 18.2 million participants. Awarded to the top 0.25% of students nationwide.',
  },
  {
    title: 'Gold Medal - Brazilian Olympiad of Astronomy and Astronautics (OBA)',
    issuingOrganization: 'SAB & AEB',
    issueDate: 'Oct 2018',
    description:
      'Highest distinction (top 2-3% nationwide). 2018 edition featured approximately 774,000 participants.',
  },
];

export default function Awards() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <section id="awards" className="py-20">
      <h2 className="text-2xl font-bold tracking-tight mb-12 text-white">
        Honors & Awards
      </h2>

      <div className="space-y-4">
        {awards.map((award, index) => (
          <motion.div
            key={index}
            className="border border-neutral-800 bg-neutral-900/30 rounded-lg overflow-hidden transition-all hover:border-neutral-700"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
          >
            {/* Always Visible Header / Trigger */}
            <button
              onClick={() =>
                setExpandedIndex(expandedIndex === index ? null : index)
              }
              className="w-full text-left flex items-center justify-between p-4"
            >
              <div className="flex flex-col">
                <span className="text-xs font-mono text-blue-400 mb-1 uppercase">
                  {award.issueDate}
                </span>
                <span className="text-sm md:text-base font-medium text-white">
                  {award.title}
                </span>
              </div>

              <motion.div
                animate={{ rotate: expandedIndex === index ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="flex-shrink-0 ml-4"
              >
                <ChevronDown size={20} className="text-neutral-400" />
              </motion.div>
            </button>

            {/* Collapsible Content */}
            <AnimatePresence>
              {expandedIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 text-sm text-neutral-400">
                    <p className="text-neutral-500 text-xs mb-2">
                      {award.issuingOrganization}
                    </p>
                    <p className="leading-relaxed">{award.description}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
