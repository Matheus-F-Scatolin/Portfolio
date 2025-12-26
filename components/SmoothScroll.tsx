'use client';

import { ReactLenis, useLenis } from 'lenis/react';
import { ReactNode, useEffect } from 'react';

interface SmoothScrollProps {
  children: ReactNode;
}

function LenisAnchorHandler() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href?.startsWith('/#') || href?.startsWith('#')) {
          e.preventDefault();
          const targetId = href.replace('/#', '#');
          const targetElement = document.querySelector(targetId);
          
          if (targetElement) {
            lenis.scrollTo(targetElement, {
              offset: 0,
              duration: 1.5,
            });
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, [lenis]);

  return null;
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 1.5,
        smoothWheel: true,
      }}
    >
      <LenisAnchorHandler />
      {children}
    </ReactLenis>
  );
}
