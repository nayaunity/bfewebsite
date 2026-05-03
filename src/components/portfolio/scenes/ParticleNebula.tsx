"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleNebulaProps {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  particleCount?: number;
  heroTexture?: string;
}

export function ParticleNebula({
  primaryColor = "#6b21a8",
  secondaryColor = "#2563eb",
  accentColor = "#8b5cf6",
  particleCount = 2000,
}: ParticleNebulaProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const siz = new Float32Array(particleCount);

    const c1 = new THREE.Color(primaryColor);
    const c2 = new THREE.Color(secondaryColor);
    const c3 = new THREE.Color(accentColor);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Distribute in a spherical cloud
      const radius = 3 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = radius * Math.cos(phi);

      // Random color blend between the three colors
      const t = Math.random();
      const color = t < 0.4 ? c1.clone().lerp(c2, t / 0.4) : c2.clone().lerp(c3, (t - 0.4) / 0.6);
      col[i3] = color.r;
      col[i3 + 1] = color.g;
      col[i3 + 2] = color.b;

      siz[i] = 0.02 + Math.random() * 0.06;
    }

    return { positions: pos, colors: col, sizes: siz };
  }, [particleCount, primaryColor, secondaryColor, accentColor]);

  useFrame((state) => {
    if (!pointsRef.current) return;

    // Smooth mouse tracking
    const pointer = state.pointer;
    mouse.current.x += (pointer.x * viewport.width * 0.3 - mouse.current.x) * 0.02;
    mouse.current.y += (pointer.y * viewport.height * 0.3 - mouse.current.y) * 0.02;

    // Gentle rotation + mouse influence
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03 + mouse.current.x * 0.1;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.02) * 0.1 + mouse.current.y * 0.05;

    // Breathe effect on particle sizes
    const geo = pointsRef.current.geometry;
    const sizeAttr = geo.getAttribute("size") as THREE.BufferAttribute;
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const x = posAttr.array[i3];
      const y = posAttr.array[i3 + 1];

      // Sine wave size oscillation based on position
      const wave = Math.sin(state.clock.elapsedTime * 0.5 + x * 0.5 + y * 0.3) * 0.5 + 0.5;
      (sizeAttr.array as Float32Array)[i] = sizes[i] * (0.6 + wave * 0.8);
    }
    sizeAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
