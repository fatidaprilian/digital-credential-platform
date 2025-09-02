'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
}

export const Section = ({ children, className = "" }: SectionProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });
  
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={`py-8 ${className}`}
    >
      {children}
    </motion.section>
  );
};