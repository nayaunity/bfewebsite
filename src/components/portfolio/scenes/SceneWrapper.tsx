"use client";

import { Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";

const Canvas = dynamic(
  () => import("@react-three/fiber").then((mod) => mod.Canvas),
  { ssr: false }
);

interface SceneWrapperProps {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  className?: string;
}

function CSSFallback({
  primaryColor = "#6b21a8",
  secondaryColor = "#2563eb",
  className = "",
}: {
  primaryColor?: string;
  secondaryColor?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(ellipse at 30% 50%, ${primaryColor}33 0%, transparent 50%),
                     radial-gradient(ellipse at 70% 30%, ${secondaryColor}33 0%, transparent 50%),
                     linear-gradient(135deg, #0a0a0f 0%, #111122 50%, #0a0a0f 100%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${primaryColor}22, transparent 60%)`,
          animation: "pulse 4s ease-in-out infinite",
        }}
      />
    </div>
  );
}

export function SceneWrapper({
  primaryColor,
  secondaryColor,
  accentColor,
  className = "",
}: SceneWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [ParticleNebula, setParticleNebula] = useState<React.ComponentType<{
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  }> | null>(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);

    if (window.innerWidth >= 768) {
      import("./ParticleNebula").then((mod) => {
        setParticleNebula(() => mod.ParticleNebula);
      });
    }
  }, []);

  if (isMobile || !ParticleNebula) {
    return (
      <CSSFallback
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        className={className}
      />
    );
  }

  return (
    <div className={className}>
      <Suspense
        fallback={
          <CSSFallback
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            className="absolute inset-0"
          />
        }
      >
        <Canvas
          camera={{ position: [0, 0, 8], fov: 60 }}
          style={{ background: "transparent" }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
        >
          <ambientLight intensity={0.3} />
          <ParticleNebula
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            accentColor={accentColor}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
