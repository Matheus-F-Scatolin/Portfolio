'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Github, Linkedin } from 'lucide-react';

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
      ease: 'easeOut',
    },
  },
};

export default function Hero() {
  return (
    <section className="min-h-[80vh] flex flex-col justify-center">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 text-left"
      >
        {/* Name */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground"
        >
          Matheus Ferracciú Scatolin
        </motion.h1>

        {/* Headline */}
        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-zinc-400 font-medium"
        >
          Computer Engineer & AI Researcher
        </motion.p>

        {/* Bio */}
        <motion.p
          variants={itemVariants}
          className="text-base text-zinc-500 max-w-lg leading-relaxed"
        >
          Developing autonomous systems, quantitative finance models, and
          cybersecurity solutions. Ranked 1st/102 at UNICAMP.
        </motion.p>

        {/* Buttons & Social Links */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-4 pt-2"
        >
          {/* Primary Button */}
          <Link
            href="#projects"
            className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-md hover:opacity-80 transition-opacity"
          >
            View Projects
          </Link>

          {/* Social Icons */}
          <a
            href="https://github.com/Matheus-F-Scatolin"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="GitHub"
          >
            <Github size={20} />
          </a>
          <a
            href="https://linkedin.com/in/matheus-scatolin"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin size={20} />
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
