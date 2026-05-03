"use client";

import { motion } from "framer-motion";

interface Education {
  degree: string;
  school: string;
  year: string;
}

interface EducationSectionProps {
  education: Education[];
  colorPalette: { primary: string; secondary: string; accent: string };
}

export function EducationSection({ education, colorPalette }: EducationSectionProps) {
  if (!education.length) return null;

  return (
    <section className="relative py-24 px-6">
      <div className="absolute inset-0 bg-[#0a0a0f]" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-serif font-bold text-white mb-16"
        >
          Education
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {education.map((edu, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="p-6 rounded-2xl border group hover:translate-y-[-2px] transition-all duration-300"
              style={{
                backgroundColor: `${colorPalette.primary}08`,
                borderColor: `${colorPalette.primary}20`,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${colorPalette.accent}20` }}
              >
                <svg className="w-5 h-5" style={{ color: colorPalette.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{edu.degree}</h3>
              <p style={{ color: colorPalette.secondary }} className="text-sm font-semibold mb-1">
                {edu.school}
              </p>
              <p className="text-white/50 text-sm">{edu.year}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
