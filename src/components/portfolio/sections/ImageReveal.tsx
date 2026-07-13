"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface ImageRevealProps {
  src: string;
  colorPalette: { primary: string; secondary: string; accent: string };
  aspectRatio?: "wide" | "standard";
}

export function ImageReveal({ src, colorPalette, aspectRatio = "wide" }: ImageRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.92, 1, 1, 0.96]);

  return (
    <div ref={ref} className="relative py-8 md:py-16 px-6 overflow-hidden">
      {/* Ambient glow behind image */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse at center, ${colorPalette.primary}40 0%, transparent 70%)`,
        }}
      />

      <motion.div
        className="relative max-w-5xl mx-auto"
        style={{ y, scale }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: "blur(20px)" }}
          whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative"
        >
          {/* Glow effect behind the image */}
          <div
            className="absolute -inset-4 rounded-3xl opacity-40 blur-2xl"
            style={{
              background: `linear-gradient(135deg, ${colorPalette.primary}, ${colorPalette.accent}, ${colorPalette.secondary})`,
            }}
          />

          {/* The image */}
          <div
            className={`relative rounded-2xl overflow-hidden ${
              aspectRatio === "wide" ? "aspect-[21/9]" : "aspect-[16/9]"
            }`}
          >
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover"
            />

            {/* Top vignette */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, #0a0a0f 0%, transparent 30%, transparent 70%, #0a0a0f 100%)`,
              }}
            />
            {/* Side vignettes */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, #0a0a0f 0%, transparent 20%, transparent 80%, #0a0a0f 100%)`,
              }}
            />

            {/* Color tint overlay */}
            <div
              className="absolute inset-0 mix-blend-overlay opacity-30"
              style={{
                background: `linear-gradient(135deg, ${colorPalette.primary}80, transparent, ${colorPalette.accent}60)`,
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
