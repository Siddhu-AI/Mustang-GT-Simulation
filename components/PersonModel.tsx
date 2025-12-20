
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PersonModelProps {
  isMoving: boolean;
  isFlying: boolean;
  isAiming: boolean;
  isFiring: boolean;
  isLanding: boolean;
  landingProgress: number; // 1.0 at start, 0.0 at end
  moveSpeedFactor: number;
  laserHitPoint: THREE.Vector3 | null;
  verticalVelocity?: number;
}

const PersonModel: React.FC<PersonModelProps> = ({ 
  isMoving, isFlying, isAiming, isFiring, isLanding, landingProgress, moveSpeedFactor, laserHitPoint, verticalVelocity = 0 
}) => {
  const torsoRef = useRef<THREE.Group>(null!);
  const headRef = useRef<THREE.Group>(null!);
  const leftThighRef = useRef<THREE.Group>(null!);
  const rightThighRef = useRef<THREE.Group>(null!);
  const leftShinRef = useRef<THREE.Mesh>(null!);
  const rightShinRef = useRef<THREE.Mesh>(null!);
  const leftUpperArmRef = useRef<THREE.Group>(null!);
  const rightUpperArmRef = useRef<THREE.Group>(null!);
  const leftForearmRef = useRef<THREE.Mesh>(null!);
  const rightForearmRef = useRef<THREE.Mesh>(null!);
  const muzzleFlashRef = useRef<THREE.Mesh>(null!);
  const hitEffectRef = useRef<THREE.Group>(null!);
  const thrusterGroups = useRef<THREE.Group[]>([]);
  const flightTrailRef = useRef<THREE.Points>(null!);

  // Spark particles for impact
  const sparkParticles = useMemo(() => Array.from({ length: 15 }).map(() => ({
    velocity: new THREE.Vector3((Math.random() - 0.5) * 0.4, Math.random() * 0.4, (Math.random() - 0.5) * 0.4),
    meshRef: React.createRef<THREE.Mesh>()
  })), []);

  // Flight trail particles
  const trailCount = 60;
  const trailPositions = useMemo(() => new Float32Array(trailCount * 3), []);
  const trailData = useMemo(() => Array.from({ length: trailCount }).map(() => ({
    velocity: new THREE.Vector3(),
    life: Math.random(),
    offset: new THREE.Vector3((Math.random() - 0.5) * 0.3, -1.0, (Math.random() - 0.5) * 0.3)
  })), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const walkFreq = 12 * moveSpeedFactor;
    
    let torsoBob = 0, torsoTilt = 0, torsoY = 1.3;
    let torsoRotY = 0, torsoRotZ = 0;
    let headRotX = 0;
    let legL = 0, legR = 0, kneeL = 0, kneeR = 0;
    let armL = 0, armR = 0, elbowL = 0, elbowR = 0;

    if (isLanding) {
      const p = landingProgress;
      if (p > 0.4) {
        const alpha = (p - 0.4) / 0.6;
        const ease = 1 - Math.pow(1 - alpha, 3);
        torsoY = 0.35 + ease * 0.25;
        torsoTilt = 1.2 + ease * 0.1;
        legL = 1.7; kneeL = 1.9; legR = 0.6; kneeR = 1.3;
        armL = -1.2; elbowL = 1.8; armR = 1.0; elbowR = 0.8;
      } else {
        const alpha = p / 0.4;
        const bounce = Math.sin(alpha * Math.PI) * 0.15;
        torsoY = 1.3 - bounce;
        torsoTilt = alpha * 1.2;
        legL = alpha * 1.7; kneeL = alpha * 1.9; legR = alpha * 0.6; kneeR = alpha * 1.3;
        armL = alpha * -1.2; elbowL = alpha * 1.8; armR = alpha * 1.0; elbowR = alpha * 0.8;
      }
    } else if (isAiming) {
      armR = -Math.PI / 2; elbowR = 0; armL = 0.3; elbowL = 0.5; torsoTilt = 0.1;
      if (isMoving) {
        const cycle = t * walkFreq;
        legL = Math.sin(cycle) * 0.4; legR = Math.sin(cycle + Math.PI) * 0.4;
        kneeL = Math.max(0, Math.cos(cycle) * 0.6); kneeR = Math.max(0, Math.cos(cycle + Math.PI) * 0.6);
        torsoBob = Math.abs(Math.cos(cycle)) * 0.05;
        torsoRotY = Math.sin(cycle) * 0.1;
      }
    } else if (isFlying) {
      legL = 0.2; legR = 0.2; kneeL = 0.3; kneeR = 0.3;
      armL = 0.5; armR = 0.5; elbowL = 0.4; elbowR = 0.4;
      torsoTilt = isMoving ? 0.6 : 0.2;
      torsoBob = Math.sin(t * 8) * 0.06;
      headRotX = -torsoTilt * 0.9;
    } else if (isMoving) {
      const cycle = t * walkFreq;
      const step = Math.sin(cycle);
      const stepOffset = Math.sin(cycle + Math.PI);
      legL = step * 0.7; 
      legR = stepOffset * 0.7;
      kneeL = Math.max(0, Math.cos(cycle) * 1.0); 
      kneeR = Math.max(0, Math.cos(cycle + Math.PI) * 1.0);
      armL = stepOffset * 0.6; 
      armR = step * 0.6;
      elbowL = 0.4 + Math.abs(step) * 0.5; 
      elbowR = 0.4 + Math.abs(stepOffset) * 0.5;
      torsoBob = Math.abs(Math.cos(cycle)) * 0.1;
      torsoTilt = 0.1;
      torsoRotY = -step * 0.15;
      torsoRotZ = step * 0.05;
      headRotX = Math.abs(step) * 0.05;
    } else {
      const breath = Math.sin(t * 1.5);
      torsoBob = breath * 0.02; 
      armL = 0.1 + breath * 0.05; 
      armR = -0.1 - breath * 0.05;
      elbowL = 0.2; elbowR = 0.2;
    }

    const lerpSpeed = isLanding ? 0.4 : 0.15;
    torsoRef.current.position.y = THREE.MathUtils.lerp(torsoRef.current.position.y, torsoY + torsoBob, lerpSpeed);
    torsoRef.current.rotation.x = THREE.MathUtils.lerp(torsoRef.current.rotation.x, torsoTilt, lerpSpeed);
    torsoRef.current.rotation.y = THREE.MathUtils.lerp(torsoRef.current.rotation.y, torsoRotY, lerpSpeed);
    torsoRef.current.rotation.z = THREE.MathUtils.lerp(torsoRef.current.rotation.z, torsoRotZ, lerpSpeed);
    
    if (headRef.current) headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, headRotX, 0.1);

    leftThighRef.current.rotation.x = THREE.MathUtils.lerp(leftThighRef.current.rotation.x, legL, 0.2);
    rightThighRef.current.rotation.x = THREE.MathUtils.lerp(rightThighRef.current.rotation.x, legR, 0.2);
    leftShinRef.current.rotation.x = THREE.MathUtils.lerp(leftShinRef.current.rotation.x, -kneeL, 0.2);
    rightShinRef.current.rotation.x = THREE.MathUtils.lerp(rightShinRef.current.rotation.x, -kneeR, 0.2);
    leftUpperArmRef.current.rotation.x = THREE.MathUtils.lerp(leftUpperArmRef.current.rotation.x, armL, 0.2);
    rightUpperArmRef.current.rotation.x = THREE.MathUtils.lerp(rightUpperArmRef.current.rotation.x, armR, 0.2);
    leftForearmRef.current.rotation.x = THREE.MathUtils.lerp(leftForearmRef.current.rotation.x, -elbowL, 0.2);
    rightForearmRef.current.rotation.x = THREE.MathUtils.lerp(rightForearmRef.current.rotation.x, -elbowR, 0.2);

    if (muzzleFlashRef.current) muzzleFlashRef.current.scale.setScalar(isFiring ? 1.5 + Math.sin(t * 50) * 0.5 : 0.001);

    // FLIGHT VISUALS - ONLY FROM HANDS AND LEGS
    const thrustPower = (0.8 + Math.abs(verticalVelocity) * 20 + (isMoving ? 0.6 : 0)) + Math.sin(t * 40) * 0.15;
    thrusterGroups.current.forEach((group) => {
      if (!group) return;
      group.visible = isFlying;
      if (isFlying) {
        group.traverse((child) => {
          if ((child as any).isMesh) {
            child.scale.set(thrustPower, thrustPower * (child.name === "core" ? 2.0 : 4.0), thrustPower);
            if ((child as any).material) {
              (child as any).material.emissiveIntensity = thrustPower * (child.name === "core" ? 20 : 8);
            }
          } else if ((child as any).isPointLight) {
            (child as any).intensity = thrustPower * 5;
          }
        });
      }
    });

    if (isFlying) {
      if (flightTrailRef.current) {
        flightTrailRef.current.visible = true;
        const posAttr = flightTrailRef.current.geometry.attributes.position;
        const trailIntensity = 0.5 + Math.abs(verticalVelocity) * 10 + (isMoving ? 0.5 : 0);
        
        for (let i = 0; i < trailCount; i++) {
          const idx = i * 3;
          trailData[i].life -= 0.02;
          if (trailData[i].life <= 0) {
            trailData[i].life = 1.0;
            const side = i % 2 === 0 ? -0.2 : 0.2;
            posAttr.array[idx] = side + (Math.random() - 0.5) * 0.2;
            posAttr.array[idx + 1] = -0.5;
            posAttr.array[idx + 2] = (Math.random() - 0.5) * 0.2;
            trailData[i].velocity.set(
              (Math.random() - 0.5) * 0.05,
              -0.2 - Math.random() * 0.3 - Math.abs(verticalVelocity),
              (Math.random() - 0.5) * 0.05 - (isMoving ? 0.5 : 0)
            );
          } else {
            posAttr.array[idx] += trailData[i].velocity.x;
            posAttr.array[idx + 1] += trailData[i].velocity.y;
            posAttr.array[idx + 2] += trailData[i].velocity.z;
          }
        }
        posAttr.needsUpdate = true;
        (flightTrailRef.current.material as THREE.PointsMaterial).opacity = trailIntensity * 0.6;
        (flightTrailRef.current.material as THREE.PointsMaterial).size = 0.2 * trailIntensity;
      }
    } else {
      if (flightTrailRef.current) flightTrailRef.current.visible = false;
    }

    // Impact effects (Laser Hit) - HIDDEN DURING FLIGHT
    if (hitEffectRef.current && laserHitPoint && isFiring && !isFlying) {
      hitEffectRef.current.position.copy(laserHitPoint);
      hitEffectRef.current.visible = true;
      sparkParticles.forEach((p, i) => {
        if (p.meshRef.current) {
          const mesh = p.meshRef.current;
          const cycle = (t * 5 + i * 0.1) % 1;
          mesh.position.copy(p.velocity).multiplyScalar(cycle * 3);
          mesh.scale.setScalar(1 - cycle);
          (mesh.material as any).opacity = 1 - cycle;
        }
      });
    } else if (hitEffectRef.current) {
      hitEffectRef.current.visible = false;
    }
  });

  const redMat = <meshStandardMaterial color="#AA0505" metalness={0.9} roughness={0.2} />;
  const thrusterMat = <meshStandardMaterial color="#FFFFFF" emissive="#00FFFF" emissiveIntensity={10} transparent opacity={0.6} />;
  const thrusterCoreMat = <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={20} transparent opacity={0.9} />;

  const ThrusterSet = ({ idx }: { idx: number }) => (
    <group ref={(el) => { if (el) thrusterGroups.current[idx] = el; }} visible={false}>
      <mesh name="outer" position={[0, -0.15, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />{thrusterMat}
      </mesh>
      <mesh name="core" position={[0, -0.15, 0]}>
        <sphereGeometry args={[0.02, 8, 8]} />{thrusterCoreMat}
      </mesh>
      <pointLight color="#00FFFF" intensity={0} distance={3} />
    </group>
  );

  return (
    <group>
      <points ref={flightTrailRef} position={[0, 0.5, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={trailCount} array={trailPositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.3} color="#00FFFF" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      <group ref={torsoRef}>
        <mesh castShadow><boxGeometry args={[0.6, 0.8, 0.4]} />{redMat}</mesh>
        <mesh position={[0, 0.1, 0.21]}>
           <circleGeometry args={[0.08, 16]} />
           <meshStandardMaterial color="#FFFFFF" emissive="#00FFFF" emissiveIntensity={5} />
        </mesh>
        
        <group ref={headRef} position={[0, 0.55, 0]}>
          <mesh castShadow><boxGeometry args={[0.3, 0.35, 0.3]} />{redMat}</mesh>
          <mesh position={[0, 0, 0.1]}><boxGeometry args={[0.22, 0.28, 0.12]} /><meshStandardMaterial color="#FFD700" metalness={1} /></mesh>
          <mesh position={[0.08, 0.05, 0.165]}>
            <planeGeometry args={[0.08, 0.03]} />
            <meshStandardMaterial color="#FFFFFF" emissive="#00FFFF" emissiveIntensity={2} />
          </mesh>
          <mesh position={[-0.08, 0.05, 0.165]}>
            <planeGeometry args={[0.08, 0.03]} />
            <meshStandardMaterial color="#FFFFFF" emissive="#00FFFF" emissiveIntensity={2} />
          </mesh>
        </group>
      </group>

      <group ref={leftUpperArmRef} position={[-0.45, 1.6, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow><boxGeometry args={[0.2, 0.4, 0.2]} />{redMat}</mesh>
        <mesh ref={leftForearmRef} position={[0, -0.4, 0]} castShadow>
          <boxGeometry args={[0.18, 0.4, 0.18]} />{redMat}
          <ThrusterSet idx={0} />
        </mesh>
      </group>

      <group ref={rightUpperArmRef} position={[0.45, 1.6, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow><boxGeometry args={[0.2, 0.4, 0.2]} />{redMat}</mesh>
        <mesh ref={rightForearmRef} position={[0, -0.4, 0]} castShadow>
          <boxGeometry args={[0.18, 0.4, 0.18]} />{redMat}
          <mesh ref={muzzleFlashRef}><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color="#FFFFFF" emissive="#00FFFF" emissiveIntensity={10} /></mesh>
          <ThrusterSet idx={1} />
        </mesh>
      </group>

      <group ref={leftThighRef} position={[-0.2, 0.9, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow><boxGeometry args={[0.25, 0.5, 0.25]} />{redMat}</mesh>
        <mesh ref={leftShinRef} position={[0, -0.5, 0]} castShadow>
          <boxGeometry args={[0.22, 0.5, 0.22]} />{redMat}
          <ThrusterSet idx={2} />
        </mesh>
      </group>
      <group ref={rightThighRef} position={[0.2, 0.9, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow><boxGeometry args={[0.25, 0.5, 0.25]} />{redMat}</mesh>
        <mesh ref={rightShinRef} position={[0, -0.5, 0]} castShadow>
          <boxGeometry args={[0.22, 0.5, 0.22]} />{redMat}
          <ThrusterSet idx={3} />
        </mesh>
      </group>

      <group ref={hitEffectRef}>
        <pointLight color="#00FFFF" intensity={8} distance={12} />
        {sparkParticles.map((p, i) => (
          <mesh key={i} ref={p.meshRef}><boxGeometry args={[0.1, 0.1, 0.1]} /><meshStandardMaterial color="#FFFFFF" emissive="#00FFFF" transparent /></mesh>
        ))}
      </group>
    </group>
  );
};

export default PersonModel;
