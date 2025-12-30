'use client';

import { motion } from 'framer-motion';

const images = [
  // Row 1-2: Feature image + 4 squares
  {
    id: 1,
    src: '/images/Best_team.JPEG',
    caption: 'Best Team Award (UGRIP)',
    span: 'col-span-2 row-span-2',
  },
  {
    id: 2,
    src: '/images/quant_1.jpeg',
    caption: 'Itaú Quant AI Challenge Team',
    span: 'col-span-1',
  },
  {
    id: 3,
    src: '/images/UGRIP_1.jpeg',
    caption: 'MBZUAI Main Entrance',
    span: 'col-span-1',
  },
  {
    id: 4,
    src: '/images/quant_2.jpeg',
    caption: 'Itaú Quant AI Challenge Final Presentation',
    span: 'col-span-1',
  },
  {
    id: 5,
    src: '/images/UGRIP_2.jpeg',
    caption: 'Final Presentation at MBZUAI',
    span: 'col-span-1',
  },
  // Row 3: 4 squares
  {
    id: 6,
    src: '/images/interview.jpg',
    caption: 'Interview at MBZUAI',
    span: 'col-span-1',
  },
  {
    id: 7,
    src: '/images/Uni.jpeg',
    caption: 'Passing the University Entrance Exam',
    span: 'col-span-1',
  },
  {
    id: 8,
    src: '/images/Hyundai_1.jpeg',
    caption: 'Final Presentation at Hyundai',
    span: 'col-span-1',
  },
  {
    id: 9,
    src: '/images/Hyundai_2.jpeg',
    caption: 'Hyundai Team',
    span: 'col-span-1',
  },
  // Row 4: 2 wide images
  {
    id: 10,
    src: '/images/Hyundai_3.JPG',
    caption: 'Summer Interns at Hyundai',
    span: 'col-span-2',
  },
  {
    id: 11,
    src: '/images/UPA.JPEG',
    caption: 'Projects Coordinator at UPA (UNICAMP)',
    span: 'col-span-2',
  },
  // Row 5: 4 squares
  {
    id: 12,
    src: '/images/FE.JPEG',
    caption: 'Annual Event "Fundação Estudar"',
    span: 'col-span-1',
  },
  {
    id: 13,
    src: '/images/FE_2.JPEG',
    caption: 'Onboarding "Fundação Estudar"',
    span: 'col-span-1',
  },
  {
    id: 14,
    src: '/images/Orador.JPG',
    caption: 'High School Class Valedictorian',
    span: 'col-span-1',
  },
  {
    id: 15,
    src: '/images/volei.JPG',
    caption: 'University Volleyball Team',
    span: 'col-span-1',
  },
  // Row 6: 2 ultra-wide images
  {
    id: 16,
    src: '/images/Fut_Can.JPG',
    caption: 'High School Soccer Team (Canada)',
    span: 'col-span-2',
  },
  {
    id: 17,
    src: '/images/Hyundai_4.JPG',
    caption: 'Summer Interns at Hyundai',
    span: 'col-span-2',
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
      <h2 className="text-2xl font-bold tracking-tight mb-12 text-white">
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
            key={image.id}
            variants={itemVariants}
            className={`group relative overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800 ${image.span}`}
          >
            {/* Image */}
            <img
              src={image.src}
              alt={image.caption}
              className="h-full w-full object-cover transition-all duration-500 grayscale group-hover:grayscale-0 group-hover:scale-110"
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
