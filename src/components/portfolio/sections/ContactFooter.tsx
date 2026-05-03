"use client";

import { motion } from "framer-motion";

interface ContactFooterProps {
  name: string;
  colorPalette: { primary: string; secondary: string; accent: string };
}

export function ContactFooter({ name, colorPalette }: ContactFooterProps) {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, #0a0a0f 0%, ${colorPalette.primary}15 100%)`,
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-serif font-bold text-white mb-4"
        >
          Let&apos;s Connect
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-white/60 mb-8"
        >
          Interested in working together? Get in touch.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <a
            href="mailto:"
            className="inline-block px-8 py-4 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: colorPalette.accent }}
          >
            Get in Touch
          </a>
        </motion.div>

        <div className="mt-16 pt-8 border-t border-white/10">
          <p className="text-white/30 text-sm">
            {name}&apos;s Portfolio. Powered by The Black Female Engineer.
          </p>
        </div>
      </div>
    </section>
  );
}
