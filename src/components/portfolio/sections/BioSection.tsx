"use client";

import { motion } from "framer-motion";

interface BioSectionProps {
  bio: string;
  colorPalette: { primary: string; secondary: string; accent: string };
}

export function BioSection({ bio, colorPalette }: BioSectionProps) {
  const paragraphs = bio.split("\n").filter((p) => p.trim());

  return (
    <section className="relative py-24 px-6">
      <div className="absolute inset-0 bg-[#0a0a0f]" />

      <div className="relative z-10 max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-serif font-bold text-white mb-10"
        >
          About
        </motion.h2>

        <div className="space-y-6">
          {paragraphs.map((paragraph, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-lg leading-relaxed text-white/70"
            >
              {paragraph}
            </motion.p>
          ))}
        </div>

        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-12 h-px origin-left"
          style={{
            background: `linear-gradient(90deg, ${colorPalette.primary}, ${colorPalette.secondary}, transparent)`,
          }}
        />
      </div>
    </section>
  );
}
