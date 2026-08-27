'use client';

import { motion } from 'framer-motion';

const experiences = [
  {
    company: 'Valor Capital Group',
    role: 'AI Engineer',
    date: 'Jun 2026 – Present',
    description:
      'Selected for the Tech Summer program in San Francisco, working directly with the Head of AI. Building agentic systems, data pipelines, and intelligence infrastructure for venture operations and investment analysis, plus technical diligence on early and growth-stage startups.',
  },
  {
    company: 'Enter',
    role: 'AI Fellow',
    date: 'Mar 2026 – Jun 2026',
    description:
      "AI Fellowship at LatAm's largest AI startup ($1.2B unicorn). Architected a distributed, concurrent pipeline (FastAPI, Hatchet, React, LLMs) that processed thousands of judicial decisions, and built an automated framework for evolving enterprise argument taxonomies with embeddings and LLMs.",
  },
  {
    company: 'XP Inc.',
    role: 'Summer Intern',
    date: 'Jan 2026 – Feb 2026',
    description:
      'Built an end-to-end ML MVP to identify HNW clients at risk of churn, combining robust data engineering, XGBoost modeling, STL-based temporal analysis, and feature optimization to support retention strategies with projected impact in the hundreds of millions of BRL.',
  },
  {
    company: 'Instituto Kunumi',
    role: 'AI Researcher',
    date: 'Aug 2025 – Aug 2026',
    description:
      'One-year undergraduate research position on automatic Knowledge Graph generation and Graph-RAG techniques, building entity/relation extraction pipelines and Graph-RAG question-answering prototypes.',
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
