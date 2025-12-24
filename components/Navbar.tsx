'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const navigation = [
  { name: 'Experience', href: '/#experience' },
  { name: 'Projects', href: '/#projects' },
  { name: 'About', href: '/#about' },
  { name: 'Awards', href: '/#awards' },
];

export default function Navbar() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/50 border-b border-white/10"
    >
      <nav className="flex items-center justify-between px-4 h-16 md:max-w-3xl md:mx-auto md:px-0">
        {/* Logo / Name */}
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-white"
        >
          Matheus F. Scatolin
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-4 md:gap-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-xs text-zinc-400 hover:text-white transition-colors md:text-sm"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </nav>
    </motion.header>
  );
}
