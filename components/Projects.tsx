'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const projects = [
  {
    title: 'STELLAR (LLM Architecture)',
    description:
      'Structured, Trustworthy, and Explainable LLM-Led Architecture. Replaces monolithic calls with 9-module DAG logic.',
    tags: ['Python', 'RAG', 'Vector DB', 'DAG'],
    link: 'https://github.com/Matheus-F-Scatolin/STELLAR',
    image: '/previews/stellar.png',
  },
  {
    title: 'KernelNet (Quant Finance)',
    description:
      '2nd Place in Itaú Quant AI Challenge. Generalizes pairs trading via non-linear causality networks.',
    tags: ['Python', 'Time-Series', 'Network Theory'],
    link: 'https://www.linkedin.com/posts/matheus-scatolin_desafioquantai2025-itaaeqasset-finanaexasquantitativas-activity-7406379037675294720-anxi',
    image: '/previews/quant__.png',
  },
  {
    title: 'BookExchangePlatform',
    description:
      'web platform developed with Django that connects university students for donating used books.',
    tags: ['Python', 'Django', 'Web Development'],
    link: 'https://github.com/Matheus-F-Scatolin/BookExchangePlatform',
    image: '/previews/BookExchangePlatform.png',
  },
  {
    title: 'PDF Data Extraction System',
    description:
      'Complete PDF data extraction system using LLMs, with multi-layer caching, pattern learning, and intelligent fallback.',
    tags: ['AI', 'Caching', 'Python', 'PDF Extraction'],
    link: 'https://github.com/Matheus-F-Scatolin/ai-fellowship-project-matheus-scatolin',
    image: '/previews/ai-fellowship.png',
  },
  {
    title: 'Agri-Food Analysis (Databases)',
    description:
      'Dual-database architecture (PostgreSQL + Neo4j) analyzing land concentration vs. food security using FAOSTAT data.',
    tags: ['SQL', 'Cypher', 'Python', 'Neo4j'],
    link: 'https://github.com/Matheus-F-Scatolin/MC536-Database-Project-FoodSecurity',
    image: '/previews/Database-Project-FoodSecurity.png',
  },
  {
    title: 'Applied Cryptography Labs',
    description:
      'Implemented Padding Oracle Attacks and RSA factorization scripts to expose vulnerabilities in secure systems.',
    tags: ['Cybersecurity', 'RSA/AES', 'Python'],
    link: 'https://github.com/Matheus-F-Scatolin/Cryptography1-Stanford-University',
    image: '/previews/criptography__.png',
  },
  {
    title: 'Low-Level Design Labs',
    description:
      'Designed ALU, Cache Memory, and SDRAM controllers in VHDL. Implemented RISC-V assembly solutions.',
    tags: ['VHDL', 'Assembly', 'RISC-V'],
    link: 'https://github.com/Matheus-F-Scatolin/MC613-Digital-Circuits-Laboratory',
    image: '/previews/Digital-Circuits-Laboratory.png',
  },
  {
    title: 'Pokemon Game',
    description:
      'Pokemon game that implements core Pokemon battle mechanics, allowing two players to choose their Pokemon and battle each other.',
    tags: ['Java', 'OOP', 'Game Logic'],
    link: 'https://github.com/Matheus-F-Scatolin/MC322-Pokemon_Game_Project',
    image: '/previews/pokemon-game.jpeg',
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
          <motion.a
            key={project.title}
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            variants={itemVariants}
            className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 p-6 transition-all hover:border-neutral-700"
          >
            {/* Background Image - Reveal on Hover */}
            <img
              src={project.image}
              alt=""
              className="absolute inset-0 z-0 h-full w-full object-cover opacity-0 scale-110 grayscale transition-all duration-500 group-hover:opacity-30 group-hover:scale-100 group-hover:grayscale-0"
            />

            {/* Gradient Overlay for Text Legibility */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/80 to-black/40 transition-all duration-500 group-hover:from-black/70 group-hover:via-black/50 group-hover:to-black/20" />

            {/* Header: Title & Arrow */}
            <div className="relative z-20 flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">
                {project.title}
              </h3>
              <motion.div
                className="text-neutral-400 transition-colors group-hover:text-blue-500"
                whileHover={{ x: 4, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowUpRight size={18} />
              </motion.div>
            </div>

            {/* Description */}
            <p className="relative z-20 text-neutral-400 text-sm leading-relaxed mt-2 mb-6">
              {project.description}
            </p>

            {/* Tags */}
            <div className="relative z-20 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.a>
        ))}
      </motion.div>
    </section>
  );
}
