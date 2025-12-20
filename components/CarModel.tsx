
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CarModelProps {
  steering: number;
  damage: number;
  isFlying: boolean;
  isBoosting: boolean;
  isBraking?: boolean;
  currentSpeed?: number;
}

const CarModel: React.FC<CarModelProps> = ({ steering, damage, isFlying, isBoosting, isBraking = false, currentSpeed = 0 }) => {
  const wheelFLRef = useRef<THREE.Group>(null!);
  const wheelFRRef = useRef<THREE.Group>(null!);
  const steeringWheelRef = useRef<THREE.Group>(null!);
  const smokeRef = useRef<THREE.Points>(null!);
  const boostParticlesRef = useRef<THREE.Points>(null!);
  const tireSmokeRef = useRef<THREE.Points>(null!);
  const wingLeftRef = useRef<THREE.Group>(null!);
  const wingRightRef = useRef<THREE.Group>(null!);
  const thrusterLeftRef = useRef<THREE.Mesh>(null!);
  const thrusterRightRef = useRef<THREE.Mesh>(null!);
  const heatRingRef = useRef<THREE.Group>(null!);

  const particlesCount = 50;
  const positions = useMemo(() => new Float32Array(particlesCount * 3), []);
  const velocities = useMemo(() => Array.from({ length: particlesCount }, () => new THREE.Vector3(
    (Math.random() - 0.5) * 0.1,
    Math.random() * 0.2,
    (Math.random() - 0.5) * 0.1
  )), []);

  const boostParticlesCount = 60;
  const boostPositions = useMemo(() => new Float32Array(boostParticlesCount * 3), []);
  const boostVelocities = useMemo(() => Array.from({ length: boostParticlesCount }, () => new THREE.Vector3(
    (Math.random() - 0.5) * 0.15,
    (Math.random() - 0.5) * 0.15,
    -Math.random() * 0.8 - 0.4
  )), []);

  const tireParticlesCount = 80;
  const tirePositions = useMemo(() => new Float32Array(tireParticlesCount * 3), []);
  const tireVelocities = useMemo(() => Array.from({ length: tireParticlesCount }, () => new THREE.Vector3(
    (Math.random() - 0.5) * 0.08,
    Math.random() * 0.15,
    (Math.random() - 0.5) * 0.08
  )), []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (wheelFLRef.current && wheelFRRef.current) {
      wheelFLRef.current.rotation.y = steering * 0.45;
      wheelFRRef.current.rotation.y = steering * 0.45;
    }
    if (steeringWheelRef.current) {
      steeringWheelRef.current.rotation.z = -steering * 2.5;
    }

    // Wings
    const wingTargetScale = isFlying ? 1 : 0.001;
    const wingTargetPosX = isFlying ? 2.2 : 0.8;
    if (wingLeftRef.current && wingRightRef.current) {
      wingLeftRef.current.scale.x = THREE.MathUtils.lerp(wingLeftRef.current.scale.x, wingTargetScale, 0.1);
      wingLeftRef.current.position.x = THREE.MathUtils.lerp(wingLeftRef.current.position.x, -wingTargetPosX, 0.1);
      wingRightRef.current.scale.x = THREE.MathUtils.lerp(wingRightRef.current.scale.x, wingTargetScale, 0.1);
      wingRightRef.current.position.x = THREE.MathUtils.lerp(wingRightRef.current.position.x, wingTargetPosX, 0.1);
    }

    // Plasma Flicker & Thrusters
    const showThruster = isFlying || isBoosting;
    const thrusterScale = showThruster ? (isBoosting ? 3.5 : 1.8) : 0.001;
    if (thrusterLeftRef.current && thrusterRightRef.current) {
      const noise = (Math.sin(t * 40) + Math.sin(t * 67)) * 0.2; // Chaotic flicker
      const targetScale = THREE.MathUtils.lerp(thrusterLeftRef.current.scale.x, thrusterScale + noise, 0.2);
      thrusterLeftRef.current.scale.set(targetScale, targetScale * (isBoosting ? 2.0 : 1.2), targetScale);
      thrusterRightRef.current.scale.set(targetScale, targetScale * (isBoosting ? 2.0 : 1.2), targetScale);
      
      const intensity = showThruster ? (isBoosting ? 25 : 10) + noise * 10 : 0;
      (thrusterLeftRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
      (thrusterRightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
    }

    // Heat Rings
    if (heatRingRef.current) {
      if (showThruster) {
        heatRingRef.current.visible = true;
        heatRingRef.current.children.forEach((child, i) => {
          const mesh = child as THREE.Mesh;
          const cycle = (t * 2 + i * 0.33) % 1;
          mesh.scale.setScalar(0.5 + cycle * 4);
          mesh.position.z = -0.5 - cycle * 3;
          (mesh.material as THREE.MeshBasicMaterial).opacity = (1 - cycle) * 0.5;
        });
      } else {
        heatRingRef.current.visible = false;
      }
    }

    // Boost Particles
    if (boostParticlesRef.current) {
      const posAttr = boostParticlesRef.current.geometry.attributes.position;
      if (isBoosting) {
        boostParticlesRef.current.visible = true;
        for (let i = 0; i < boostParticlesCount; i++) {
          const idx = i * 3;
          posAttr.array[idx] += boostVelocities[i].x;
          posAttr.array[idx + 1] += boostVelocities[i].y;
          posAttr.array[idx + 2] += boostVelocities[i].z;
          if (posAttr.array[idx + 2] < -8) {
            const side = i % 2 === 0 ? -0.6 : 0.6;
            posAttr.array[idx] = side + (Math.random() - 0.5) * 0.1;
            posAttr.array[idx + 1] = 0.6 + (Math.random() - 0.5) * 0.1;
            posAttr.array[idx + 2] = -2.1;
          }
        }
        posAttr.needsUpdate = true;
        (boostParticlesRef.current.material as THREE.PointsMaterial).opacity = THREE.MathUtils.lerp((boostParticlesRef.current.material as THREE.PointsMaterial).opacity, 0.8, 0.1);
      } else {
        (boostParticlesRef.current.material as THREE.PointsMaterial).opacity = THREE.MathUtils.lerp((boostParticlesRef.current.material as THREE.PointsMaterial).opacity, 0, 0.2);
        if ((boostParticlesRef.current.material as THREE.PointsMaterial).opacity < 0.01) boostParticlesRef.current.visible = false;
      }
    }

    // Tire Smoke
    const isHardBraking = isBraking && Math.abs(currentSpeed) > 0.6;
    const isDrifting = Math.abs(steering) > 0.3 && Math.abs(currentSpeed) > 0.8;
    const isBurnout = isBoosting && Math.abs(currentSpeed) < 1.0;
    const shouldEmitTireSmoke = !isFlying && (isHardBraking || isDrifting || isBurnout);

    if (tireSmokeRef.current) {
      const posAttr = tireSmokeRef.current.geometry.attributes.position;
      if (shouldEmitTireSmoke) {
        tireSmokeRef.current.visible = true;
        const smokeIntensity = isBurnout ? 1.0 : (isHardBraking ? 0.7 : 0.5);
        for (let i = 0; i < tireParticlesCount; i++) {
          const idx = i * 3;
          posAttr.array[idx] += tireVelocities[i].x;
          posAttr.array[idx + 1] += tireVelocities[i].y;
          posAttr.array[idx + 2] += tireVelocities[i].z;
          if (posAttr.array[idx + 1] > 1.2) {
            const tireIdx = i % 4;
            const tx = tireIdx < 2 ? -1.02 : 1.02;
            const tz = tireIdx % 2 === 0 ? 1.45 : -1.45;
            posAttr.array[idx] = tx + (Math.random() - 0.5) * 0.4;
            posAttr.array[idx + 1] = 0.1;
            posAttr.array[idx + 2] = tz + (Math.random() - 0.5) * 0.4;
          }
        }
        posAttr.needsUpdate = true;
        (tireSmokeRef.current.material as THREE.PointsMaterial).opacity = THREE.MathUtils.lerp((tireSmokeRef.current.material as THREE.PointsMaterial).opacity, smokeIntensity, 0.1);
      } else {
        (tireSmokeRef.current.material as THREE.PointsMaterial).opacity = THREE.MathUtils.lerp((tireSmokeRef.current.material as THREE.PointsMaterial).opacity, 0, 0.1);
        if ((tireSmokeRef.current.material as THREE.PointsMaterial).opacity < 0.01) tireSmokeRef.current.visible = false;
      }
    }

    // Damage Smoke
    if (smokeRef.current && damage > 30) {
      const posAttr = smokeRef.current.geometry.attributes.position;
      const smokeDensity = (damage - 30) / 70;
      for (let i = 0; i < particlesCount; i++) {
        const idx = i * 3;
        posAttr.array[idx] += velocities[i].x;
        posAttr.array[idx + 1] += velocities[i].y;
        posAttr.array[idx + 2] += velocities[i].z;
        if (posAttr.array[idx + 1] > 2) {
          posAttr.array[idx] = (Math.random() - 0.5) * 0.5;
          posAttr.array[idx + 1] = 1;
          posAttr.array[idx + 2] = 1.5;
        }
      }
      posAttr.needsUpdate = true;
      smokeRef.current.visible = true;
      smokeRef.current.material.opacity = smokeDensity * 0.5;
    } else if (smokeRef.current) {
      smokeRef.current.visible = false;
    }
  });

  const bodyMaterial = useMemo(() => (
    <meshStandardMaterial color="#ff5500" roughness={0.05 + (damage / 100) * 0.5} metalness={0.8 - (damage / 100) * 0.3} />
  ), [damage]);

  return (
    <group>
      <points ref={smokeRef} position={[0, 0, 0]}>
        <bufferGeometry><bufferAttribute attach="attributes-position" count={particlesCount} array={positions} itemSize={3} /></bufferGeometry>
        <pointsMaterial size={0.15} color="#444444" transparent opacity={0} depthWrite={false} />
      </points>
      <points ref={tireSmokeRef} position={[0, 0, 0]}>
        <bufferGeometry><bufferAttribute attach="attributes-position" count={tireParticlesCount} array={tirePositions} itemSize={3} /></bufferGeometry>
        <pointsMaterial size={0.4} color="#ffffff" transparent opacity={0} depthWrite={false} />
      </points>
      <points ref={boostParticlesRef} position={[0, 0, 0]}>
        <bufferGeometry><bufferAttribute attach="attributes-position" count={boostParticlesCount} array={boostPositions} itemSize={3} /></bufferGeometry>
        <pointsMaterial size={0.25} color="#00ffff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* FLYING WINGS */}
      <group ref={wingLeftRef} position={[-0.8, 0.7, -0.5]} scale={[0.001, 1, 1]}>
        <mesh castShadow><boxGeometry args={[2.5, 0.05, 1.8]} /><meshStandardMaterial color="#ff5500" metalness={0.7} /></mesh>
      </group>
      <group ref={wingRightRef} position={[0.8, 0.7, -0.5]} scale={[0.001, 1, 1]}>
        <mesh castShadow><boxGeometry args={[2.5, 0.05, 1.8]} /><meshStandardMaterial color="#ff5500" metalness={0.7} /></mesh>
      </group>

      {/* REAR THRUSTERS */}
      <group position={[0, 0.6, -2.1]}>
        <mesh ref={thrusterLeftRef} position={[-0.6, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.2, 0.8, 16]} />
          <meshStandardMaterial color="#00eeff" emissive="#00eeff" transparent opacity={0.8} />
        </mesh>
        <mesh ref={thrusterRightRef} position={[0.6, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.2, 0.8, 16]} />
          <meshStandardMaterial color="#00eeff" emissive="#00eeff" transparent opacity={0.8} />
        </mesh>
        {/* Heat distortion rings */}
        <group ref={heatRingRef} position={[0, 0, -0.5]}>
           {[0, 1, 2].map(i => (
             <mesh key={i} rotation={[Math.PI/2, 0, 0]}>
               <ringGeometry args={[0.3, 0.4, 32]} />
               <meshBasicMaterial color="#00ffff" transparent opacity={0} depthWrite={false} />
             </mesh>
           ))}
        </group>
        {isBoosting && <pointLight color="#00ffff" intensity={15} distance={8} position={[0, 0, -1]} />}
      </group>

      {/* Car Body Geometry */}
      <group position={[0, 0, 0]}>
        <mesh castShadow position={[0, 0.4, 0]}><boxGeometry args={[1.9, 0.2, 4.2]} /><meshStandardMaterial color="#111111" roughness={1} /></mesh>
        <mesh castShadow position={[0, 0.72, 0]}><boxGeometry args={[2.0, 0.55, 4.4]} />{bodyMaterial}</mesh>
        <mesh castShadow position={[0, 0.95, 1.25]}><boxGeometry args={[1.88, 0.18, 1.9]} />{bodyMaterial}</mesh>
        <group position={[0, 1.32, -0.4]}>
          <mesh castShadow><boxGeometry args={[1.68, 0.58, 2.0]} />{bodyMaterial}</mesh>
          <mesh position={[0, 0.05, 1.01]} rotation={[-0.4, 0, 0]}><planeGeometry args={[1.6, 0.6]} /><meshStandardMaterial color="#050505" metalness={1} roughness={0} transparent opacity={0.7} /></mesh>
        </group>
      </group>

      {/* Wheels */}
      {[
        { pos: [-1.02, 0.38, 1.45], ref: wheelFLRef },
        { pos: [1.02, 0.38, 1.45], ref: wheelFRRef },
        { pos: [-1.02, 0.38, -1.45], ref: null },
        { pos: [1.02, 0.38, -1.45], ref: null }
      ].map((wheel, idx) => (
        <group key={idx} position={wheel.pos as any} ref={wheel.ref as any}>
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.39, 0.39, 0.45, 64]} /><meshStandardMaterial color="#0a0a0a" roughness={1} /></mesh>
        </group>
      ))}
    </group>
  );
};

export default CarModel;
