'use client';

import Image, { StaticImageData } from 'next/image';
import { motion } from 'framer-motion';

import mbzuaiBestTeam from '@/public/gallery/mbzuai-best-team.jpg';
import mbzuaiEntrance from '@/public/gallery/mbzuai-entrance.jpg';
import mbzuaiInterview from '@/public/gallery/mbzuai-interview.jpg';
import itauQuantAward from '@/public/gallery/itau-quant-award.jpg';
import itauQuantStage from '@/public/gallery/itau-quant-stage.jpg';
import unicampAdmission from '@/public/gallery/unicamp-admission.jpg';
import upaCoordination from '@/public/gallery/upa-coordination.jpg';
import hyundaiInterns from '@/public/gallery/hyundai-interns.jpg';
import estudarEvent from '@/public/gallery/estudar-event.jpg';
import volleyballTeam from '@/public/gallery/volleyball-team.jpg';

interface GalleryImage {
  src: StaticImageData;
  caption: string;
  span: string;
  sizes: string;
}

const singleSizes = '(min-width: 768px) 184px, 50vw';
const wideSizes = '(min-width: 768px) 376px, 100vw';

const images: GalleryImage[] = [
  // Rows 1-2: feature + tall portrait + 2 squares
  {
    src: mbzuaiBestTeam,
    caption: 'Best Team Award (UGRIP)',
    span: 'col-span-2 row-span-2',
    sizes: wideSizes,
  },
  {
    src: mbzuaiEntrance,
    caption: 'MBZUAI Main Entrance',
    span: 'col-span-1 row-span-2',
    sizes: singleSizes,
  },
  {
    src: mbzuaiInterview,
    caption: 'Interview at MBZUAI',
    span: 'col-span-1',
    sizes: singleSizes,
  },
  {
    src: itauQuantAward,
    caption: 'Itaú Quant AI Challenge Team',
    span: 'col-span-1',
    sizes: singleSizes,
  },
  // Row 3
  {
    src: unicampAdmission,
    caption: 'Passing the University Entrance Exam',
    span: 'col-span-1',
    sizes: singleSizes,
  },
  {
    src: hyundaiInterns,
    caption: 'Summer Interns at Hyundai',
    span: 'col-span-1',
    sizes: singleSizes,
  },
  {
    src: upaCoordination,
    caption: 'Projects Coordinator at UPA (UNICAMP)',
    span: 'col-span-2',
    sizes: wideSizes,
  },
  // Row 4
  {
    src: estudarEvent,
    caption: 'Annual Event "Fundação Estudar"',
    span: 'col-span-2',
    sizes: wideSizes,
  },
  {
    src: itauQuantStage,
    caption: 'Itaú Quant AI Challenge Final Presentation',
    span: 'col-span-1',
    sizes: singleSizes,
  },
  {
    src: volleyballTeam,
    caption: 'University Volleyball Team',
    span: 'col-span-1',
    sizes: singleSizes,
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

export default function Gallery() {
  return (
    <section id="gallery" className="py-20">
      <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-12 text-white">
        Gallery
      </h2>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]"
      >
        {images.map((image) => (
          <motion.div
            key={image.caption}
            variants={itemVariants}
            className={`group relative overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800 ${image.span}`}
          >
            <Image
              src={image.src}
              alt={image.caption}
              fill
              sizes={image.sizes}
              placeholder="blur"
              className="object-cover transition duration-500 grayscale group-hover:grayscale-0 group-hover:scale-105"
            />

            {/* Gradient Overlay with Caption */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <p className="text-white font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                {image.caption}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
