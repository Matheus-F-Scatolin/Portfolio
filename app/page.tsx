import Hero from '@/components/home/Hero';
import Proof from '@/components/home/Proof';
import GraphOfWork from '@/components/graph/GraphOfWork';
import SelectedWork from '@/components/home/SelectedWork';
import Experience from '@/components/home/Experience';
import Education from '@/components/home/Education';
import Research from '@/components/home/Research';
import SiteFooter from '@/components/home/SiteFooter';

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <Proof />
        <GraphOfWork />
        <SelectedWork />
        <Experience />
        <Education />
        <Research />
      </main>
      <SiteFooter />
    </>
  );
}
