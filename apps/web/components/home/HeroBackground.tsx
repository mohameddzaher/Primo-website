"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sphere, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { prefersReducedMotion } from "@/lib/utils";

// Floating particles
function Particles({ count = 100 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 10;
      positions[i3 + 1] = (Math.random() - 0.5) * 10;
      positions[i3 + 2] = (Math.random() - 0.5) * 10;
      sizes[i] = Math.random() * 0.02 + 0.005;
    }

    return { positions, sizes };
  }, [count]);

  useFrame((state) => {
    if (!mesh.current || reducedMotion) return;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.02;
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particles.sizes.length}
          array={particles.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        sizeAttenuation
        transparent
        opacity={0.6}
        color="#b8935f"
      />
    </points>
  );
}

// Floating gradient orb
function GradientOrb() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  useFrame((state) => {
    if (!meshRef.current || reducedMotion) return;
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.1;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
  });

  return (
    <Float
      speed={reducedMotion ? 0 : 1.5}
      rotationIntensity={reducedMotion ? 0 : 0.5}
      floatIntensity={reducedMotion ? 0 : 1}
    >
      <Sphere ref={meshRef} args={[1.5, 64, 64]} position={[2, 0, -2]}>
        <MeshDistortMaterial
          color="#1a1a1a"
          attach="material"
          distort={reducedMotion ? 0 : 0.3}
          speed={reducedMotion ? 0 : 2}
          roughness={0.4}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

// Secondary smaller orb
function SecondaryOrb() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  useFrame((state) => {
    if (!meshRef.current || reducedMotion) return;
    meshRef.current.rotation.x = state.clock.elapsedTime * -0.2;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
  });

  return (
    <Float
      speed={reducedMotion ? 0 : 2}
      rotationIntensity={reducedMotion ? 0 : 0.3}
      floatIntensity={reducedMotion ? 0 : 0.8}
    >
      <Sphere ref={meshRef} args={[0.8, 32, 32]} position={[-3, 1, -1]}>
        <MeshDistortMaterial
          color="#b8935f"
          attach="material"
          distort={reducedMotion ? 0 : 0.4}
          speed={reducedMotion ? 0 : 3}
          roughness={0.2}
          metalness={0.9}
        />
      </Sphere>
    </Float>
  );
}

// Ring geometry
function FloatingRing() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  useFrame((state) => {
    if (!meshRef.current || reducedMotion) return;
    meshRef.current.rotation.x = Math.PI / 4 + state.clock.elapsedTime * 0.1;
    meshRef.current.rotation.z = state.clock.elapsedTime * 0.05;
  });

  return (
    <Float
      speed={reducedMotion ? 0 : 1}
      rotationIntensity={reducedMotion ? 0 : 0.2}
      floatIntensity={reducedMotion ? 0 : 0.5}
    >
      <mesh ref={meshRef} position={[-1, -1, -3]}>
        <torusGeometry args={[1.5, 0.05, 16, 100]} />
        <meshStandardMaterial color="#b8935f" metalness={0.8} roughness={0.2} />
      </mesh>
    </Float>
  );
}

// Camera controller
function CameraController() {
  const { camera } = useThree();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  useFrame((state) => {
    if (reducedMotion) return;
    camera.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.5;
    camera.position.y = Math.cos(state.clock.elapsedTime * 0.1) * 0.3;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// Scene component
function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      <pointLight position={[-5, -5, -5]} color="#b8935f" intensity={0.5} />
      <pointLight position={[5, -5, 5]} color="#ffffff" intensity={0.3} />

      {/* Objects */}
      <Particles count={80} />
      <GradientOrb />
      <SecondaryOrb />
      <FloatingRing />
      <CameraController />

      {/* Background gradient mesh */}
      <mesh position={[0, 0, -5]}>
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial color="#0f0f0f" />
      </mesh>
    </>
  );
}

export function HeroBackground() {
  const [mounted, setMounted] = useState(false);
  const [canRender, setCanRender] = useState(true);

  useEffect(() => {
    setMounted(true);

    // Check for low-end devices
    const checkPerformance = () => {
      if (typeof window === "undefined") return true;

      // Check if device memory is low (if available)
      const nav = navigator as any;
      if (nav.deviceMemory && nav.deviceMemory < 4) {
        return false;
      }

      // Check for hardware concurrency (CPU cores)
      if (nav.hardwareConcurrency && nav.hardwareConcurrency < 4) {
        return false;
      }

      // Check if mobile and prefer to disable for performance
      const isMobile = window.innerWidth < 768;
      if (isMobile && prefersReducedMotion()) {
        return false;
      }

      return true;
    };

    setCanRender(checkPerformance());
  }, []);

  if (!mounted || !canRender) {
    // Fallback gradient background
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-primary-800/10 via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 three-canvas-container">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <Scene />
      </Canvas>
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-950/30 to-dark-950/70 pointer-events-none" />
    </div>
  );
}

export default HeroBackground;
