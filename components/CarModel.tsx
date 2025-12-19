
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CarModelProps {
  steering: number;
  damage: number;
  isFlying: boolean;
}

const CarModel: React.FC<CarModelProps> = ({ steering, damage, isFlying }) => {
  const wheelFLRef = useRef<THREE.Group>(null!);
  const wheelFRRef = useRef<THREE.Group>(null!);
  const steeringWheelRef = useRef<THREE.Group>(null!);
  const smokeRef = useRef<THREE.Points>(null!);
  const wingLeftRef = useRef<THREE.Group>(null!);
  const wingRightRef = useRef<THREE.Group>(null!);

  const particlesCount = 50;
  const positions = useMemo(() => new Float32Array(particlesCount * 3), []);
  const velocities = useMemo(() => Array.from({ length: particlesCount }, () => new THREE.Vector3(
    (Math.random() - 0.5) * 0.1,
    Math.random() * 0.2,
    (Math.random() - 0.5) * 0.1
  )), []);

  useFrame((state, delta) => {
    if (wheelFLRef.current && wheelFRRef.current) {
      wheelFLRef.current.rotation.y = steering * 0.45;
      wheelFRRef.current.rotation.y = steering * 0.45;
    }
    if (steeringWheelRef.current) {
      steeringWheelRef.current.rotation.z = -steering * 2.5;
    }

    // Retract/Extend wings
    const wingTargetScale = isFlying ? 1 : 0.001;
    const wingTargetPosX = isFlying ? 2.2 : 0.8;
    if (wingLeftRef.current && wingRightRef.current) {
      wingLeftRef.current.scale.x = THREE.MathUtils.lerp(wingLeftRef.current.scale.x, wingTargetScale, 0.1);
      wingLeftRef.current.position.x = THREE.MathUtils.lerp(wingLeftRef.current.position.x, -wingTargetPosX, 0.1);
      wingRightRef.current.scale.x = THREE.MathUtils.lerp(wingRightRef.current.scale.x, wingTargetScale, 0.1);
      wingRightRef.current.position.x = THREE.MathUtils.lerp(wingRightRef.current.position.x, wingTargetPosX, 0.1);
      
      wingLeftRef.current.visible = wingLeftRef.current.scale.x > 0.01;
      wingRightRef.current.visible = wingRightRef.current.scale.x > 0.01;
    }

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
    <meshStandardMaterial 
      color="#ff5500" 
      roughness={0.05 + (damage / 100) * 0.5} 
      metalness={0.8 - (damage / 100) * 0.3} 
    />
  ), [damage]);

  const wingMaterial = useMemo(() => (
    <meshStandardMaterial color="#ff5500" roughness={0.1} metalness={0.7} />
  ), []);

  return (
    <group>
      <points ref={smokeRef} position={[0, 0, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particlesCount} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.15} color="#444444" transparent opacity={0} depthWrite={false} />
      </points>

      {/* FLYING WINGS */}
      <group ref={wingLeftRef} position={[-0.8, 0.7, -0.5]} scale={[0.001, 1, 1]}>
        <mesh rotation={[0, 0, 0]} castShadow>
          <boxGeometry args={[2.5, 0.05, 1.8]} />
          {wingMaterial}
        </mesh>
        <mesh position={[-1.25, 0.1, 0]}>
          <boxGeometry args={[0.05, 0.3, 1.2]} />
          <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={2} />
        </mesh>
      </group>
      <group ref={wingRightRef} position={[0.8, 0.7, -0.5]} scale={[0.001, 1, 1]}>
        <mesh rotation={[0, 0, 0]} castShadow>
          <boxGeometry args={[2.5, 0.05, 1.8]} />
          {wingMaterial}
        </mesh>
        <mesh position={[1.25, 0.1, 0]}>
          <boxGeometry args={[0.05, 0.3, 1.2]} />
          <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={2} />
        </mesh>
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[4.2, 6.2]} />
        <meshBasicMaterial color="black" transparent opacity={0.4} />
      </mesh>

      <group position={[0, 0, 0]}>
        <mesh castShadow position={[0, 0.4, 0]}>
          <boxGeometry args={[1.9, 0.2, 4.2]} />
          <meshStandardMaterial color="#111111" roughness={1} />
        </mesh>
        <mesh castShadow position={[0, 0.35, 2.15]}>
          <boxGeometry args={[2.05, 0.1, 0.4]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 0.72, 0]}>
          <boxGeometry args={[2.0, 0.55, 4.4]} />
          {bodyMaterial}
        </mesh>
        <mesh castShadow position={[0, 0.95, 1.25]}>
          <boxGeometry args={[1.88, 0.18, 1.9]} />
          {bodyMaterial}
        </mesh>
        <group position={[0, 1.05, 0]}>
          <mesh position={[-0.22, 0, 0.1]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.3, 4.6]} /><meshStandardMaterial color="#ffffff" roughness={0.1} /></mesh>
          <mesh position={[0.22, 0, 0.1]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.3, 4.6]} /><meshStandardMaterial color="#ffffff" roughness={0.1} /></mesh>
        </group>
        <group position={[0, 0.9, -2.15]}>
          <mesh position={[0, 0, 0.05]} rotation={[0, Math.PI, 0]}><planeGeometry args={[0.3, 0.2]} /><meshStandardMaterial color="#111111" /></mesh>
          <mesh position={[0, 0, 0.06]} rotation={[0, Math.PI, 0]}><boxGeometry args={[0.15, 0.08, 0.01]} /><meshStandardMaterial color="#cccccc" metalness={1} roughness={0.2} /></mesh>
        </group>
        <group position={[0, 1.32, -0.4]}>
          <mesh castShadow><boxGeometry args={[1.68, 0.58, 2.0]} />{bodyMaterial}</mesh>
          <mesh position={[0, 0.05, 1.01]} rotation={[-0.4, 0, 0]}><planeGeometry args={[1.6, 0.6]} /><meshStandardMaterial color="#050505" metalness={1} roughness={0} transparent opacity={0.7} /></mesh>
          <mesh position={[0.85, 0, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[1.9, 0.5]} /><meshStandardMaterial color="#050505" metalness={1} roughness={0} transparent opacity={0.7} /></mesh>
          <mesh position={[-0.85, 0, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[1.9, 0.5]} /><meshStandardMaterial color="#050505" metalness={1} roughness={0} transparent opacity={0.7} /></mesh>
        </group>
        <group position={[0.78, 0.8, 2.18]}>
           <mesh><planeGeometry args={[0.32, 0.18]} /><meshStandardMaterial color="#050505" metalness={1} /></mesh>
           {[-0.08, 0, 0.08].map((x, i) => (
             <mesh key={i} position={[x, 0, 0.01]} rotation={[0, 0, 0.3]}><boxGeometry args={[0.02, 0.12, 0.01]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={damage > 80 ? 0.5 : 4} /></mesh>
           ))}
        </group>
        <group position={[-0.78, 0.8, 2.18]}>
           <mesh><planeGeometry args={[0.32, 0.18]} /><meshStandardMaterial color="#050505" metalness={1} /></mesh>
           {[-0.08, 0, 0.08].map((x, i) => (
             <mesh key={i} position={[x, 0, 0.01]} rotation={[0, 0, -0.3]}><boxGeometry args={[0.02, 0.12, 0.01]} /><meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={damage > 80 ? 0.5 : 4} /></mesh>
           ))}
        </group>
      </group>

      {[
        { pos: [-1.02, 0.38, 1.45], ref: wheelFLRef },
        { pos: [1.02, 0.38, 1.45], ref: wheelFRRef },
        { pos: [-1.02, 0.38, -1.45], ref: null },
        { pos: [1.02, 0.38, -1.45], ref: null }
      ].map((wheel, idx) => (
        <group key={idx} position={wheel.pos as any} ref={wheel.ref as any}>
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.39, 0.39, 0.45, 64]} /><meshStandardMaterial color="#0a0a0a" roughness={1} /></mesh>
          <group rotation={[0, 0, Math.PI / 2]} position={[wheel.pos[0] > 0 ? 0.03 : -0.03, 0, 0]}>
             <mesh><cylinderGeometry args={[0.32, 0.32, 0.05, 10]} /><meshStandardMaterial color="#111111" metalness={0.8} roughness={0.4} /></mesh>
          </group>
        </group>
      ))}
    </group>
  );
};

export default CarModel;
