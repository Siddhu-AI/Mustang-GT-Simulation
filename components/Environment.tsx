
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
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      {/* Tail */}
      <mesh position={[0, 1.5, -4]}>
        <boxGeometry args={[0.2, 3, 1.5]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      {/* Cockpit Window */}
      <mesh position={[0, 0.4, 4.5]}>
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
    <group position={position}>
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
      
      <Plane args={[10000, 10000]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#34d399" roughness={0.8} />
      </Plane>

      {/* Main Highway with more colorful markings */}
      <group position={[0, 0.02, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[22, 1200]} />
          <meshStandardMaterial color="#2d3436" roughness={0.4} />
        </mesh>
        {Array.from({ length: 150 }).map((_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, (i - 75) * 15]}>
            <planeGeometry args={[0.3, 8]} />
            <meshStandardMaterial color="#f1c40f" emissive="#f1c40f" emissiveIntensity={0.5} />
          </mesh>
        ))}
      </group>

      {/* AIRPORT SECTION */}
      <group position={[0, 0.05, 800]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[300, 800]} />
          <meshStandardMaterial color="#636e72" roughness={0.7} />
        </mesh>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[6, 700]} />
          <meshStandardMaterial color="white" />
        </mesh>

        <Building position={[-100, 15, 0]} width={60} height={30} depth={100} color="#ff7f50" />
        <Building position={[100, 15, 0]} width={60} height={30} depth={100} color="#1e90ff" />
        
        <PlaneMesh position={[-80, 1, -150]} rotationY={Math.PI / 4} />
        <PlaneMesh position={[80, 1, 150]} rotationY={-Math.PI / 6} />
      </group>

      {buildings.map((b, i) => (
        <Building key={i} position={[b.side * 42, b.h/2, b.z]} width={b.w} height={b.h} depth={b.d} color={b.c} />
      ))}

      {traffic.map((t, i) => (
        <TrafficCar key={i} initialZ={t.z} lane={t.lane} speed={t.speed} color={t.color} rotationY={t.rot} />
      ))}
    </>
  );
};

export default Environment;
