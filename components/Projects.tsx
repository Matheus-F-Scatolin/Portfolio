'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const projects = [
  {
    title: 'STELLAR (AI Architecture)',
    description:
      'Structured, Trustworthy, and Explainable LLM-Led Architecture. Replaces monolithic calls with 9-module DAG logic for safety.',
    tags: ['Python', 'RAG', 'Vector DB', 'DAG'],
  },
  {
    title: 'KernelNet (Quant Finance)',
    description:
      '2nd Place in Itaú Quant AI Challenge. Generalizes pairs trading via non-linear causality networks to map driver/follower assets.',
    tags: ['Python', 'Time-Series', 'Network Theory'],
  },
  {
    title: 'Applied Cryptography Labs',
    description:
      'Implemented Padding Oracle Attacks and RSA factorization scripts to expose vulnerabilities in secure systems.',
    tags: ['Cybersecurity', 'RSA/AES', 'Python'],
  },
  {
    title: 'Hardware & Low-Level Design',
    description:
      'Designed ALU, Cache Memory, and SDRAM controllers in VHDL. Implemented RISC-V assembly solutions.',
    tags: ['VHDL', 'Assembly', 'RISC-V'],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function Projects() {
  return (
    <section id="projects" className="py-20">
      <h2 className="text-2xl font-bold tracking-tight mb-12 text-white">
        Technical Projects
      </h2>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {projects.map((project) => (
          <motion.div
            key={project.title}
            variants={itemVariants}
            className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 transition-all hover:border-neutral-700 hover:bg-neutral-900"
          >
            {/* Header: Title & Arrow */}
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">
                {project.title}
              </h3>
              <ArrowUpRight
                size={18}
                className="text-neutral-400 transition-transform group-hover:scale-110 group-hover:text-white"
              />
            </div>

            {/* Description */}
            <p className="text-neutral-400 text-sm leading-relaxed mt-2 mb-6">
              {project.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
