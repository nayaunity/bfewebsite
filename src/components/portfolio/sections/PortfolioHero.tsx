"use client";

import { motion } from "framer-motion";
import { SceneWrapper } from "../scenes/SceneWrapper";

interface PortfolioHeroProps {
  name: string;
  headline: string;
  heroImageUrl?: string | null;
  colorPalette: { primary: string; secondary: string; accent: string };
}

export function PortfolioHero({ name, headline, heroImageUrl, colorPalette }: PortfolioHeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 3D Scene / CSS fallback background */}
      <SceneWrapper
        primaryColor={colorPalette.primary}
        secondaryColor={colorPalette.secondary}
        accentColor={colorPalette.accent}
        className="absolute inset-0"
      />

      {/* Hero image as subtle overlay */}
      {heroImageUrl && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${heroImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-white/70 text-lg tracking-widest uppercase mb-4 font-light"
        >
          Portfolio
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-5xl md:text-7xl font-serif font-bold text-white mb-6"
        >
          {name}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-xl md:text-2xl text-white/80 font-light max-w-2xl mx-auto"
        >
          {headline}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-12"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full mx-auto flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-1.5 h-1.5 bg-white/60 rounded-full mt-2"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
