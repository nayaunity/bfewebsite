"use client";

import { motion } from "framer-motion";

interface SkillCategory {
  category: string;
  items: string[];
}

interface SkillsCloudProps {
  skills: SkillCategory[];
  colorPalette: { primary: string; secondary: string; accent: string };
  sectionImage?: string | null;
}

export function SkillsCloud({ skills, colorPalette, sectionImage }: SkillsCloudProps) {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {sectionImage && (
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${sectionImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${colorPalette.primary}10 0%, #0a0a0f 40%, ${colorPalette.secondary}10 100%)`,
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-serif font-bold text-white mb-16"
        >
          Skills
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {skills.map((category, i) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 rounded-2xl border"
              style={{
                backgroundColor: `${colorPalette.primary}08`,
                borderColor: `${colorPalette.primary}20`,
              }}
            >
              <h3
                className="text-sm uppercase tracking-widest font-semibold mb-4"
                style={{ color: colorPalette.accent }}
              >
                {category.category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {category.items.map((skill, j) => (
                  <motion.span
                    key={skill}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.1 + j * 0.03 }}
                    className="px-3 py-1.5 rounded-lg text-sm text-white/80 transition-colors duration-200 hover:text-white"
                    style={{
                      backgroundColor: `${colorPalette.secondary}15`,
                      border: `1px solid ${colorPalette.secondary}25`,
                    }}
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
