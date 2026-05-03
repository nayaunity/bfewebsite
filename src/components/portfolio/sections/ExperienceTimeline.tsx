"use client";

import { motion } from "framer-motion";

interface Experience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface ExperienceTimelineProps {
  experience: Experience[];
  colorPalette: { primary: string; secondary: string; accent: string };
  sectionImage?: string | null;
}

export function ExperienceTimeline({ experience, colorPalette, sectionImage }: ExperienceTimelineProps) {
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
      <div className="absolute inset-0 bg-[#0a0a0f]/90" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-serif font-bold text-white mb-16"
        >
          Experience
        </motion.h2>

        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-4 md:left-8 top-0 bottom-0 w-px"
            style={{ backgroundColor: `${colorPalette.primary}40` }}
          />

          <div className="space-y-12">
            {experience.map((exp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative pl-12 md:pl-20 group"
              >
                {/* Timeline dot */}
                <div
                  className="absolute left-2 md:left-6 top-1 w-5 h-5 rounded-full border-2 transition-colors duration-300"
                  style={{
                    borderColor: colorPalette.primary,
                    backgroundColor: "transparent",
                  }}
                >
                  <div
                    className="absolute inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ backgroundColor: colorPalette.accent }}
                  />
                </div>

                <div
                  className="p-6 rounded-2xl border transition-all duration-300 hover:translate-y-[-2px]"
                  style={{
                    backgroundColor: `${colorPalette.primary}08`,
                    borderColor: `${colorPalette.primary}20`,
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">{exp.title}</h3>
                    <span
                      className="text-sm font-mono mt-1 md:mt-0"
                      style={{ color: colorPalette.accent }}
                    >
                      {exp.duration}
                    </span>
                  </div>
                  <p
                    className="text-sm font-semibold mb-3"
                    style={{ color: colorPalette.secondary }}
                  >
                    {exp.company}
                  </p>
                  <p className="text-white/70 text-sm leading-relaxed">{exp.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
