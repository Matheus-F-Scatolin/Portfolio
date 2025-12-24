'use client';

import { motion } from 'framer-motion';
import { Globe, Plane, Dumbbell } from 'lucide-react';

const highlights = [
  { icon: Globe, label: '24 Countries Visited' },
  { icon: Plane, label: '6 Months in Canada' },
  { icon: Dumbbell, label: 'Gym & Soccer' },
];

const skills = {
  core: ['Python (Expert)', 'Java', 'C', 'VHDL', 'RISC-V', 'SQL', 'HTML/CSS', 'JavaScript'],
  aiData: ['PyTorch', 'Pandas', 'RAG', 'LLMs', 'Neo4j', 'SKLearn', 'NumPy'],
  softskills: ['Teamwork', 'Communication', 'Problem-Solving', 'Adaptability', 'Leadership'],
};

export default function About() {
  return (
    <section id="about" className="py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="grid md:grid-cols-[1.5fr_1fr] gap-12"
      >
        {/* Left Column: Narrative */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">About Me</h2>

          <div className="space-y-4 text-neutral-400 text-sm leading-relaxed">
            <p>
              My journey began with Kumon, competitive mathematics, and academic Olympiads, 
              which shaped my analytical mindset. Today, I apply that rigor to AI research, 
              quantitative finance, and cybersecurity. Currently ranked 
              <span className="text-white font-medium"> 1st out of 102</span> at UNICAMP, 
              I am motivated by tackling complex problems at the intersection of theory 
              and real-world applications.
            </p>

            <p>
              Beyond engineering, I have a global perspective developed by visiting{' '}
              <span className="text-white font-medium">24 countries</span> and living abroad in{' '}
              <span className="text-white font-medium">Canada</span> (High School) and{' '}
              <span className="text-white font-medium">Abu Dhabi</span> (MBZUAI Research). These
              experiences allow me to collaborate effectively in multicultural
              environments.
            </p>

            <p>
              To maintain peak performance, I'm a regular gym-goer and soccer
              player. When I'm offline, I'm likely watching Palmeiras, following
              soccer, or catching up on TV Shows.
            </p>
          </div>

          {/* Highlight Cards */}
          <div className="flex flex-wrap gap-3 mt-8">
            {highlights.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 border border-neutral-800 bg-neutral-900/30 p-3 rounded-lg text-xs text-neutral-400"
              >
                <item.icon size={14} className="text-blue-400" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Technical Arsenal */}
        <div className="space-y-6">
          {/* Core Technologies */}
          <div>
            <h3 className="text-zinc-500 uppercase text-[10px] tracking-widest mb-3">
              Core Technologies
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.core.map((skill) => (
                <span
                  key={skill}
                  className="bg-neutral-900 border border-neutral-800 text-neutral-300 px-3 py-1.5 rounded-md text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* AI & Data */}
          <div>
            <h3 className="text-zinc-500 uppercase text-[10px] tracking-widest mb-3">
              AI & Data
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.aiData.map((skill) => (
                <span
                  key={skill}
                  className="bg-neutral-900 border border-neutral-800 text-neutral-300 px-3 py-1.5 rounded-md text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Soft Skills */}
          <div>
            <h3 className="text-zinc-500 uppercase text-[10px] tracking-widest mb-3">
              Soft Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.softskills.map((skill) => (
                <span
                  key={skill}
                  className="bg-neutral-900 border border-neutral-800 text-neutral-300 px-3 py-1.5 rounded-md text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
