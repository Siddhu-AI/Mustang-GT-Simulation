
import React, { useRef, useMemo, useEffect } from 'react';
import { Sky, Plane } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PlaneMesh: React.FC<{ position: [number, number, number]; rotationY: number }> = ({ position, rotationY }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Fuselage */}
      <mesh castShadow>
        <cylinderGeometry args={[1, 1, 10, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Wings */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[12, 0.2, 2]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Tail */}
      <mesh position={[0, 1.5, -4]}>
        <boxGeometry args={[0.2, 3, 1.5]} />
        <meshStandardMaterial color="#cc0000" />
      </mesh>
      {/* Cockpit Window */}
      <mesh position={[0, 0.4, 4.5]}>
        <boxGeometry args={[1.5, 0.5, 1]} />
        <meshStandardMaterial color="#111" metalness={1} roughness={0} />
      </mesh>
    </group>
  );
};

const TrafficCar: React.FC<{ initialZ: number; lane: number; speed: number; color: string; rotationY?: number }> = ({ initialZ, lane, speed, color, rotationY = 0 }) => {
  const ref = useRef<THREE.Group>(null!);
  
  useEffect(() => {
    if (ref.current) {
      (ref.current as any).isTrafficCar = true;
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
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.7, 0, 1.95]}>
        <planeGeometry args={[0.3, 0.2]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

const Building: React.FC<{ position: [number, number, number]; width: number; height: number; depth: number; color: string }> = ({ position, width, height, depth, color }) => {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  );
};

const Environment: React.FC = () => {
  const buildings = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    z: (i - 20) * 40,
    side: i % 2 === 0 ? 1 : -1,
    h: 15 + Math.random() * 40,
    w: 12 + Math.random() * 8,
    d: 12 + Math.random() * 8,
    c: ['#636e72', '#b2bec3', '#dfe6e9'][Math.floor(Math.random() * 3)]
  })), []);

  const traffic = useMemo(() => [
    { z: -100, lane: 5.5, speed: 0.2, color: '#aa0000', rot: 0 },
    { z: -400, lane: 5.5, speed: 0.18, color: '#ffffff', rot: 0 },
    { z: -200, lane: -5.5, speed: -0.3, color: '#444444', rot: Math.PI },
    { z: 0, lane: -5.5, speed: -0.22, color: '#005500', rot: Math.PI },
  ], []);

  return (
    <>
      <Sky sunPosition={[10, 10, 10]} turbidity={0.05} rayleigh={0.5} />
      <fog attach="fog" args={['#f0f9ff', 10, 800]} />
      
      <ambientLight intensity={0.6} />
      <directionalLight position={[50, 100, 50]} intensity={2.0} castShadow shadow-mapSize={[2048, 2048]} />
      
      <Plane args={[5000, 5000]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#2d3436" roughness={0.9} />
      </Plane>

      {/* Main Highway */}
      <group position={[0, 0.02, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[22, 1000]} />
          <meshStandardMaterial color="#1a1c1e" roughness={0.7} />
        </mesh>
        {Array.from({ length: 100 }).map((_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, (i - 50) * 15]}>
            <planeGeometry args={[0.2, 8]} />
            <meshStandardMaterial color="#f1c40f" />
          </mesh>
        ))}
      </group>

      {/* AIRPORT SECTION */}
      <group position={[0, 0.05, 600]}>
        {/* Huge Concrete Tarmac */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[200, 600]} />
          <meshStandardMaterial color="#3d3d3d" roughness={0.8} />
        </mesh>

        {/* Runway Markings */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[4, 500]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -240]}>
           <planeGeometry args={[30, 2]} />
           <meshStandardMaterial color="white" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 240]}>
           <planeGeometry args={[30, 2]} />
           <meshStandardMaterial color="white" />
        </mesh>

        {/* Hangars */}
        <Building position={[-60, 10, 0]} width={40} height={20} depth={60} color="#444" />
        <Building position={[60, 10, 0]} width={40} height={20} depth={60} color="#444" />
        
        {/* Parked Planes */}
        <PlaneMesh position={[-40, 1, -100]} rotationY={Math.PI / 4} />
        <PlaneMesh position={[40, 1, 100]} rotationY={-Math.PI / 6} />
        <PlaneMesh position={[-40, 1, 200]} rotationY={0} />

        {/* Control Tower */}
        <group position={[80, 0, -200]}>
           <mesh position={[0, 25, 0]}>
              <cylinderGeometry args={[2, 3, 50, 8]} />
              <meshStandardMaterial color="#555" />
           </mesh>
           <mesh position={[0, 52, 0]}>
              <boxGeometry args={[8, 6, 8]} />
              <meshStandardMaterial color="#222" emissive="#111" />
           </mesh>
        </group>
      </group>

      {buildings.map((b, i) => (
        <Building key={i} position={[b.side * 38, b.h/2, b.z]} width={b.w} height={b.h} depth={b.d} color={b.c} />
      ))}

      {traffic.map((t, i) => (
        <TrafficCar key={i} initialZ={t.z} lane={t.lane} speed={t.speed} color={t.color} rotationY={t.rot} />
      ))}
    </>
  );
};

export default Environment;
