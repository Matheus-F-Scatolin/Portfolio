import { Github, Linkedin, Mail, MapPin, GraduationCap } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="py-12 border-t border-neutral-800">
      <div className="flex flex-col items-center space-y-6">
        {/* Contact Info */}
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-sm text-neutral-500">
          <a
            href="mailto:m252099@dac.unicamp.br"
            className="flex items-center gap-2 hover:text-neutral-300 transition-colors"
          >
            <Mail size={16} />
            <span>m252099@dac.unicamp.br</span>
          </a>
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>Campinas, Brazil</span>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/Matheus-F-Scatolin"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 hover:text-neutral-300 transition-colors"
            aria-label="GitHub"
          >
            <Github size={20} />
          </a>
          <a
            href="https://linkedin.com/in/matheus-scatolin"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 hover:text-neutral-300 transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin size={20} />
          </a>
          <a
            href="https://scholar.google.com/citations?hl=en&authuser=2&user=ieyEKR4AAAAJ"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 hover:text-neutral-300 transition-colors"
            aria-label="Google Scholar"
          >
            <GraduationCap size={20} />
          </a>
        </div>

        {/* Copyright */}
        <p className="text-neutral-500 text-sm text-center">
          © {year} Matheus Ferracciú Scatolin. Engineered in Next.js.{' '}
          <a
            href="/llms.txt"
            className="underline underline-offset-2 hover:text-neutral-300 transition-colors"
          >
            llms.txt
          </a>
        </p>
      </div>
    </footer>
  );
}
