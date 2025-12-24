'use client';

import { motion } from 'framer-motion';

const experiences = [
  {
    company: 'Instituto Kunumi',
    role: 'AI Researcher',
    date: 'Aug 2025 – Present',
    description:
      'Building pipelines for automatic Knowledge Graph generation and Graph-RAG architectures.',
  },
  {
    company: 'MBZUAI (Abu Dhabi)',
    role: 'Research Intern',
    date: 'June 2025 – July 2025',
    description:
      "Selected for fully funded program (3% acceptance). Received 'Best Team' award for 3D brain image segmentation, generation and classification models.",
  },
  {
    company: 'Hyundai',
    role: 'Data Analysis & ML Intern',
    date: 'Jan 2025 – Feb 2025',
    description:
      'Boosted lead segmentation F1 score from 21% to 39% and automated ETL pipelines reducing time by 99%.',
  },
  {
    company: 'Semantix AI',
    role: 'AI Researcher',
    date: 'Mar 2024 – Aug 2025',
    description:
      'Designed STELLAR (RAG/LLM architecture for customer service) and evaluated hallucination rates across 100k+ questions.',
  },
];

export default function Experience() {
  return (
    <section id="experience" className="py-20">
      <h2 className="text-2xl font-bold tracking-tight mb-12 text-white">
        Experience
      </h2>

      <div className="border-l border-neutral-800 ml-3 md:ml-4 space-y-12">
        {experiences.map((exp, index) => (
          <motion.div
            key={exp.company}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="relative pl-8 md:pl-12"
          >
            {/* Timeline Dot */}
            <span className="absolute left-[-5px] top-2 h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-neutral-900" />

            {/* Date */}
            <span className="text-xs font-mono text-blue-400 mb-1 block uppercase tracking-wider">
              {exp.date}
            </span>

            {/* Role & Company */}
            <h3 className="text-lg font-semibold text-neutral-200">
              {exp.role} <span className="text-neutral-400">@ {exp.company}</span>
            </h3>

            {/* Description */}
            <p className="text-neutral-400 text-sm leading-relaxed mt-2 max-w-prose">
              {exp.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
