
import React, { useRef, useMemo, useEffect } from 'react';
import { Sky, Plane } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PlaneMesh: React.FC<{ position: [number, number, number]; rotationY: number }> = ({ position, rotationY }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Fuselage */}
      <mesh castShadow name="target">
        <cylinderGeometry args={[1, 1, 10, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Wings */}
      <mesh position={[0, 0, 0]} name="target">
        <boxGeometry args={[12, 0.2, 2]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      {/* Tail */}
      <mesh position={[0, 1.5, -4]} name="target">
        <boxGeometry args={[0.2, 3, 1.5]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      {/* Cockpit Window */}
      <mesh position={[0, 0.4, 4.5]} name="target">
        <boxGeometry args={[1.5, 0.5, 1]} />
        <meshStandardMaterial color="#222" metalness={1} roughness={0} />
      </mesh>
    </group>
  );
};

const TrafficCar: React.FC<{ initialZ: number; lane: number; speed: number; color: string; rotationY?: number }> = ({ initialZ, lane, speed, color, rotationY = 0 }) => {
  const ref = useRef<THREE.Group>(null!);
  
  useEffect(() => {
    if (ref.current) {
      (ref.current as any).isTrafficCar = true;
      ref.current.name = "target";
    }
  }, []);

  useFrame((state, delta) => {
    ref.current.position.z += speed;
    if (speed > 0 && ref.current.position.z > 200) ref.current.position.z = -600;
    if (speed < 0 && ref.current.position.z < -600) ref.current.position.z = 200;
  });

  return (
    <group ref={ref} position={[lane, 0.4, initialZ]} rotation={[0, rotationY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.8, 0.6, 3.8]} />
        <meshStandardMaterial color={color} roughness={0.1} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.5, 0.2]}>
        <boxGeometry args={[1.6, 0.5, 1.8]} />
        <meshStandardMaterial color="#333333" roughness={0.5} />
      </mesh>
      <mesh position={[0.7, 0, 1.95]}>
        <planeGeometry args={[0.3, 0.2]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} />
      </mesh>
      <mesh position={[-0.7, 0, 1.95]}>
        <planeGeometry args={[0.3, 0.2]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} />
      </mesh>
    </group>
  );
};

const Building: React.FC<{ position: [number, number, number]; width: number; height: number; depth: number; color: string }> = ({ position, width, height, depth, color }) => {
  return (
    <group position={position} name="target">
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Decorative windows */}
      <mesh position={[0, 0, depth/2 + 0.1]}>
        <planeGeometry args={[width * 0.8, height * 0.8]} />
        <meshStandardMaterial color="#222" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

/**
 * Environment component: Defines the world, buildings, traffic, and lighting.
 * Completed the truncated component and added default export to resolve import error.
 */
const Environment: React.FC = () => {
  const vibrantColors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#eccc68', '#70a1ff', '#5352ed', '#ff6b81'];
  
  const buildings = useMemo(() => Array.from({ length: 45 }).map((_, i) => ({
    z: (i - 22) * 45,
    side: i % 2 === 0 ? 1 : -1,
    h: 20 + Math.random() * 50,
    w: 14 + Math.random() * 10,
    d: 14 + Math.random() * 10,
    c: vibrantColors[Math.floor(Math.random() * vibrantColors.length)]
  })), []);

  const traffic = useMemo(() => [
    { z: -100, lane: 5.5, speed: 0.2, color: '#ff4757', rot: 0 },
    { z: -400, lane: 5.5, speed: 0.18, color: '#ffffff', rot: 0 },
    { z: -200, lane: -5.5, speed: -0.3, color: '#2f3542', rot: Math.PI },
    { z: 0, lane: -5.5, speed: -0.22, color: '#2ed573', rot: Math.PI },
  ], []);

  return (
    <>
      <Sky sunPosition={[100, 100, 100]} turbidity={0.01} rayleigh={0.1} />
      <fog attach="fog" args={['#dbeafe', 10, 1000]} />
      
      <ambientLight intensity={1.2} />
      <directionalLight 
        position={[100, 200, 100]} 
        intensity={3.5} 
        castShadow 
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />

      <Plane receiveShadow rotation-x={-Math.PI / 2} args={[2000, 2000]}>
        <meshStandardMaterial color="#f0f9ff" />
      </Plane>

      <gridHelper args={[2000, 200, "#cbd5e1", "#e2e8f0"]} position={[0, 0.01, 0]} />

      {/* Buildings */}
      {buildings.map((b, i) => (
        <Building 
          key={i} 
          position={[b.side * (25 + b.w / 2), b.h / 2, b.z]} 
          width={b.w} 
          height={b.h} 
          depth={b.d} 
          color={b.c} 
        />
      ))}

      {/* Road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[16, 2000]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      
      {/* Road markings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[0.2, 2000]} />
        <meshStandardMaterial color="white" transparent opacity={0.5} />
      </mesh>

      {/* Traffic */}
      {traffic.map((t, i) => (
        <TrafficCar 
          key={i} 
          initialZ={t.z} 
          lane={t.lane} 
          speed={t.speed} 
          color={t.color} 
          rotationY={t.rot} 
        />
      ))}

      {/* Distant Plane */}
      <PlaneMesh position={[100, 150, -600]} rotationY={Math.PI} />
    </>
  );
};

// Fixed: Added the missing default export to satisfy App.tsx import.
export default Environment;
