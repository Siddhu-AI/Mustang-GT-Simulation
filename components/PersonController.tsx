
import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useControls } from '../hooks/useControls';
import PersonModel from './PersonModel';

interface Missile {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
}

interface PersonControllerProps {
  initialPosition: THREE.Vector3;
  onUpdatePosition: (pos: THREE.Vector3) => void;
  sensitivity: number;
}

const PersonController: React.FC<PersonControllerProps> = ({ initialPosition, onUpdatePosition, sensitivity }) => {
  const { camera, scene } = useThree();
  const controls = useControls();
  const personRef = useRef<THREE.Group>(null!);
  const verticalVelocity = useRef(0);
  const currentSpeedFactor = useRef(0);
  const wasFlying = useRef(false);
  const [isLanding, setIsLanding] = useState(false);
  const landingMaxTime = 45;
  const landingTimer = useRef(0);
  const [laserHitPoint, setLaserHitPoint] = useState<THREE.Vector3 | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  
  // Missile System
  const [missiles, setMissiles] = useState<Missile[]>([]);
  const missileIdCounter = useRef(0);
  const lastFireTime = useRef(0);
  
  const shakeOffset = useRef(new THREE.Vector3());
  const smoothedLookAt = useRef(new THREE.Vector3());
  const orbitOffset = useRef({ x: 0, y: 0 });
  const isOrbiting = useRef(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });

  const gravity = 0.005;
  const liftForce = 0.015;
  const airFriction = 0.95;

  useEffect(() => {
    personRef.current.position.copy(initialPosition);
    
    const handlePointerDown = (e: PointerEvent) => {
      // button 0 = Left Click, button 2 = Right Click
      // We allow orbiting with Left Click (if not aiming) OR Right Click (for aiming)
      if ((e.button === 0 && !controls.aiming) || e.button === 2) {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
        isOrbiting.current = true;
        lastPointerPos.current = { x: e.clientX, y: e.clientY };
      }
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (isOrbiting.current) {
        orbitOffset.current.x -= (e.clientX - lastPointerPos.current.x) * 0.005 * sensitivity;
        // Clamp pitch to avoid flipping camera
        orbitOffset.current.y = THREE.MathUtils.clamp(orbitOffset.current.y + (e.clientY - lastPointerPos.current.y) * 0.005 * sensitivity, -0.6, 1.2);
        lastPointerPos.current = { x: e.clientX, y: e.clientY };
      }
    };
    const handlePointerUp = (e: PointerEvent) => {
        // Only stop orbiting if the specific buttons are released
        isOrbiting.current = false;
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [sensitivity, controls.aiming]);

  useFrame((state, delta) => {
    if (!personRef.current) return;

    if (landingTimer.current > 0) {
      landingTimer.current -= delta * 60;
      if (landingTimer.current <= 0) setIsLanding(false);
    }

    const isFlying = controls.flyMode;
    if (wasFlying.current && !isFlying && personRef.current.position.y < 0.2) {
      setIsLanding(true);
      landingTimer.current = landingMaxTime;
    }
    wasFlying.current = isFlying;

    const isAiming = controls.aiming;
    const baseMoveSpeed = (isLanding) ? 0 : (isFlying ? 0.4 : isAiming ? 0.07 : 0.15);
    const moveDir = new THREE.Vector3();
    
    if (!isLanding) {
      if (controls.forward) moveDir.z += 1;
      if (controls.backward) moveDir.z -= 1;
      if (controls.left) moveDir.x += 1;
      if (controls.right) moveDir.x -= 1;
    }

    if (isFlying) {
      if (controls.up) verticalVelocity.current += liftForce;
      else if (controls.down) verticalVelocity.current -= liftForce;
      else verticalVelocity.current *= airFriction;
    } else {
      if (personRef.current.position.y > 0) verticalVelocity.current -= gravity;
      else { verticalVelocity.current = 0; personRef.current.position.y = 0; }
    }
    personRef.current.position.y += verticalVelocity.current;

    const isMoving = moveDir.length() > 0;
    currentSpeedFactor.current = THREE.MathUtils.lerp(currentSpeedFactor.current, isMoving ? 1 : 0, 0.1);

    if (isMoving) {
      moveDir.normalize();
      // Calculate movement relative to camera yaw
      const camYaw = Math.atan2(camera.position.x - personRef.current.position.x, camera.position.z - personRef.current.position.z);
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), camYaw);
      personRef.current.position.addScaledVector(moveDir, baseMoveSpeed);
      
      // Rotate character to face movement direction (if not aiming)
      if (!isAiming) {
        const targetRotation = Math.atan2(moveDir.x, moveDir.z);
        const currentRotation = personRef.current.rotation.y;
        let diff = targetRotation - currentRotation;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        personRef.current.rotation.y += diff * 0.15;
      }
    }

    // Missile Spawning logic (Left Click while Aiming)
    if (isAiming && controls.firing && state.clock.getElapsedTime() - lastFireTime.current > 0.25) {
      lastFireTime.current = state.clock.getElapsedTime();
      
      const spawnPos = personRef.current.position.clone().add(new THREE.Vector3(0.4, 1.4, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), personRef.current.rotation.y));
      
      raycaster.current.setFromCamera({ x: 0, y: 0.1 }, camera);
      const intersects = raycaster.current.intersectObjects(scene.children, true);
      const targetHit = intersects.find(hit => hit.object.name === "target" || hit.object.parent?.name === "target" || (hit.object as any).isTrafficCar);
      
      const targetPoint = targetHit ? targetHit.point : camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(100));
      const velocity = targetPoint.clone().sub(spawnPos).normalize().multiplyScalar(2.0);

      setMissiles(prev => [
        ...prev, 
        { id: missileIdCounter.current++, position: spawnPos, velocity, life: 100 }
      ]);
    }

    if (missiles.length > 0) {
      setMissiles(prev => prev.map(m => ({
        ...m,
        position: m.position.clone().add(m.velocity),
        life: m.life - 1
      })).filter(m => m.life > 0));
    }

    // Dynamic camera shake
    const speedFactor = isFlying ? (isMoving ? 1.0 : 0.2) : (isMoving ? 0.3 : 0);
    const totalShake = (controls.forward ? 0.03 : 0.01) * speedFactor;
    shakeOffset.current.set(
      (Math.random() - 0.5) * totalShake,
      (Math.random() - 0.5) * totalShake,
      (Math.random() - 0.5) * totalShake
    );

    camera.fov = THREE.MathUtils.lerp(camera.fov, 65 + (isMoving && isFlying ? 15 : 0), 0.1);
    camera.updateProjectionMatrix();

    if (isAiming) {
        // In Aim Mode, we rotate the character based on the accumulated orbit offset
        // This ensures mouse rotation directly moves the aim/character
        personRef.current.rotation.y += orbitOffset.current.x * 0.5;
        orbitOffset.current.x = 0; // Consumption of offset into character rotation

        // Visual aiming feedback
        raycaster.current.setFromCamera({ x: 0, y: 0.1 }, camera);
        const intersects = raycaster.current.intersectObjects(scene.children, true);
        const targetHit = intersects.find(hit => hit.object.name === "target" || hit.object.parent?.name === "target" || (hit.object as any).isTrafficCar);
        setLaserHitPoint(targetHit ? targetHit.point : null);
    } else {
        // If not aiming and not actively orbiting, slowly snap back to default view
        if (!isOrbiting.current) {
            orbitOffset.current.x = THREE.MathUtils.lerp(orbitOffset.current.x, 0, 0.05);
            orbitOffset.current.y = THREE.MathUtils.lerp(orbitOffset.current.y, 0, 0.05);
        }
    }

    const radius = isAiming ? 4 : (isFlying ? 8 : (isLanding ? 5 : 6));
    const height = isAiming ? 1.8 : (isFlying ? 1.5 : (isLanding ? 1.0 : 2.5));
    const personPos = personRef.current.position;
    
    // Final camera rotation combines character rotation and mouse offset
    const finalYaw = personRef.current.rotation.y + Math.PI + (isAiming ? 0 : orbitOffset.current.x);
    const finalPitch = (isAiming ? 0.1 : 0.2) + orbitOffset.current.y;
    
    const targetCameraPos = new THREE.Vector3(
      personPos.x + Math.sin(finalYaw) * radius * Math.cos(finalPitch),
      personPos.y + height + Math.sin(finalPitch) * radius,
      personPos.z + Math.cos(finalYaw) * radius * Math.cos(finalPitch)
    ).add(shakeOffset.current);

    camera.position.lerp(targetCameraPos, 0.15);
    const targetLookAt = new THREE.Vector3(personPos.x, personPos.y + (isAiming ? 1.7 : 1.5), personPos.z).add(shakeOffset.current);
    smoothedLookAt.current.lerp(targetLookAt, 0.15);
    camera.lookAt(smoothedLookAt.current);

    onUpdatePosition(personRef.current.position.clone());
  });

  return (
    <group ref={personRef}>
      <PersonModel 
        isMoving={currentSpeedFactor.current > 0.1} 
        isFlying={controls.flyMode}
        isAiming={controls.aiming}
        isFiring={controls.firing && controls.aiming}
        isLanding={isLanding}
        landingProgress={landingTimer.current / landingMaxTime}
        moveSpeedFactor={currentSpeedFactor.current}
        laserHitPoint={laserHitPoint}
        verticalVelocity={verticalVelocity.current}
      />
      
      {missiles.map(missile => (
        <group key={missile.id} position={missile.position}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
            <meshStandardMaterial color="#FFFFFF" emissive="#00FFFF" emissiveIntensity={5} />
          </mesh>
          <pointLight color="#00FFFF" intensity={15} distance={6} />
          <mesh position={[0, 0, -0.4]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color="#00FFFF" transparent opacity={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export default PersonController;
