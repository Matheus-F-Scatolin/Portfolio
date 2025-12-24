import Hero from '@/components/Hero';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import About from '@/components/About';

export default function Home() {
  return (
    <main className="min-h-screen px-4 md:px-0 flex flex-col">
      <div className="max-w-3xl mx-auto w-full">
        <Hero />
        <Experience />
        <Projects />
        <About />
      </div>
    </main>
  );
}
