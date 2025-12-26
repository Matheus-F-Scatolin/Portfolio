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

// Blur reveal animation for text
const blurVariants = {
  hidden: {
    opacity: 0,
    filter: 'blur(10px)',
  },
  visible: (i: number) => ({
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      delay: i * 0.08,
      ease: 'easeOut',
    },
  }),
};

export default function Hero() {
  const name = 'Matheus Ferracciú Scatolin';
  const words = name.split(' ');

  return (
    <section className="min-h-[80vh] flex flex-col justify-center">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 text-left"
      >
        {/* Name with Blur Reveal */}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground">
          {words.map((word, i) => (
            <motion.span
              key={i}
              custom={i}
              variants={blurVariants}
              initial="hidden"
              animate="visible"
              className="inline-block mr-3 md:mr-4"
            >
              {word}
            </motion.span>
          ))}
        </h1>

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
          {/* Shimmer Button */}
          <Link
            href="#projects"
            className="group relative overflow-hidden bg-neutral-900 border border-neutral-800 text-white text-sm font-medium rounded-md px-6 py-3 transition-all hover:border-neutral-700"
          >
            <span className="relative z-10">View Projects</span>
            {/* Shimmer Effect */}
            <motion.span
              className="absolute inset-0 z-0"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: 'linear',
              }}
              style={{
                background:
                  'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)',
              }}
            />
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
