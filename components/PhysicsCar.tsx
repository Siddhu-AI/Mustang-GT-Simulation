
import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import CarModel from './CarModel';
import { useControls } from '../hooks/useControls';
import { CameraView, CarState } from '../types';

interface PhysicsCarProps {
  active: boolean;
  onStateUpdate: (state: CarState) => void;
  onPositionUpdate: (pos: THREE.Vector3, rot: number) => void;
  cameraView: CameraView;
  sensitivity: number;
}

const PhysicsCar: React.FC<PhysicsCarProps> = ({ active, onStateUpdate, onPositionUpdate, cameraView, sensitivity }) => {
  const { camera, scene } = useThree();
  const controls = useControls();
  const carRef = useRef<THREE.Group>(null!);
  const modelOffsetRef = useRef<THREE.Group>(null!);
  
  const speed = useRef(0);
  const steering = useRef(0);
  const rawSteeringInput = useRef(0);
  const damage = useRef(0);
  const verticalVelocity = useRef(0);
  const accelPitch = useRef(0);
  
  // Collision state
  const playerBox = useRef(new THREE.Box3());
  const obstacleBox = useRef(new THREE.Box3());
  const lastCollisionTime = useRef(0);

  // Camera shake state
  const shakeOffset = useRef(new THREE.Vector3());
  const orbitOffset = useRef({ x: 0, y: 0 });
  const isOrbiting = useRef(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });

  const baseMaxSpeed = 2.0;
  const boostMaxSpeed = 5.0; 
  const baseAcceleration = 0.008; 
  const boostAcceleration = 0.035; 
  const friction = 0.995;
  const gravity = 0.005;
  const liftForce = 0.012;
  const turnSpeed = 0.025; // Base turn authority

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!active) return;
      if (e.button === 0) {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input')) return;
        isOrbiting.current = true;
        lastPointerPos.current = { x: e.clientX, y: e.clientY };
      }
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (isOrbiting.current && active) {
        orbitOffset.current.x -= (e.clientX - lastPointerPos.current.x) * 0.005;
        orbitOffset.current.y = THREE.MathUtils.clamp(orbitOffset.current.y + (e.clientY - lastPointerPos.current.y) * 0.005, -0.5, 1.2);
        lastPointerPos.current = { x: e.clientX, y: e.clientY };
      }
    };
    const handlePointerUp = () => isOrbiting.current = false;

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [active]);

  const isBoosting = active && controls.boost && controls.forward && damage.current < 90;

  useFrame((state, delta) => {
    if (!carRef.current) return;

    if (active && controls.repair) damage.current = 0;
    if (active && controls.respawn) {
      carRef.current.position.set(0, 0, 10);
      carRef.current.rotation.set(0, 0, 0);
      speed.current = 0;
      verticalVelocity.current = 0;
      damage.current = 0;
      orbitOffset.current = { x: 0, y: 0 };
    }

    const currentMaxSpeed = isBoosting ? boostMaxSpeed : baseMaxSpeed;
    const currentAccel = isBoosting ? boostAcceleration : baseAcceleration;

    // Movement Physics
    if (active && controls.flyMode) {
      if (controls.up) verticalVelocity.current += liftForce;
      else if (controls.down) verticalVelocity.current -= liftForce;
      else verticalVelocity.current *= 0.9;
    } else {
      verticalVelocity.current -= gravity;
    }
    
    carRef.current.position.y += verticalVelocity.current;
    if (carRef.current.position.y < 0) {
      carRef.current.position.y = 0;
      verticalVelocity.current = 0;
    }

    if (active && damage.current < 100) {
      if (controls.forward) {
        speed.current += currentAccel * (1 - damage.current / 400);
        accelPitch.current = THREE.MathUtils.lerp(accelPitch.current, -0.05, 0.1);
      }
      else if (controls.backward) {
        speed.current -= baseAcceleration * 0.5;
        accelPitch.current = THREE.MathUtils.lerp(accelPitch.current, 0.03, 0.1);
      } else {
        accelPitch.current = THREE.MathUtils.lerp(accelPitch.current, 0, 0.1);
      }
    }

    // STEERING SENSITIVITY REFINEMENT
    const normSpeed = Math.abs(speed.current) / boostMaxSpeed;
    // Non-linear response: Steering is much stiffer at high speeds
    const speedFactor = 1.0 / (1.0 + Math.pow(normSpeed * 5.0, 2));
    const targetRawInput = active ? (controls.left ? 1 : controls.right ? -1 : 0) : 0;
    
    // Smooth input using sensitivity slider as weight
    const smoothFactor = 0.05 + (sensitivity * 0.15); 
    rawSteeringInput.current = THREE.MathUtils.lerp(rawSteeringInput.current, targetRawInput, smoothFactor);
    
    const finalSteeringPower = turnSpeed * rawSteeringInput.current * speedFactor * sensitivity;
    steering.current = THREE.MathUtils.lerp(steering.current, finalSteeringPower, 0.2);

    speed.current *= friction;
    if (active && controls.brake) {
      speed.current *= 0.92;
      accelPitch.current = THREE.MathUtils.lerp(accelPitch.current, 0.08, 0.2);
    }
    speed.current = THREE.MathUtils.clamp(speed.current, -baseMaxSpeed / 3, currentMaxSpeed);

    carRef.current.rotation.y += steering.current * speed.current * 8.0;
    carRef.current.translateZ(speed.current);

    // COLLISION DETECTION - Stop and Bounce
    playerBox.current.setFromObject(carRef.current);
    playerBox.current.expandByScalar(-0.2); // Tighten hitboxes

    scene.traverse((obj) => {
      if (obj.name === "target" && obj !== carRef.current) {
        obstacleBox.current.setFromObject(obj);
        if (playerBox.current.intersectsBox(obstacleBox.current)) {
          const impactStrength = Math.abs(speed.current);
          if (impactStrength > 0.05) {
            // Stop and bounce
            speed.current = -speed.current * 0.4; 
            damage.current = Math.min(100, damage.current + impactStrength * 60);
            
            // Push player out to resolve collision overlap
            const pushDir = carRef.current.position.clone().sub(obj.position).normalize();
            carRef.current.position.addScaledVector(pushDir, 0.4);
            
            lastCollisionTime.current = state.clock.getElapsedTime();
          }
        }
      }
    });

    modelOffsetRef.current.rotation.x = accelPitch.current;

    const carPos = carRef.current.position;
    onPositionUpdate(carPos.clone(), carRef.current.rotation.y);

    if (active) {
      // DYNAMIC CAMERA SHAKE
      const baseShake = active && controls.forward ? 0.015 : 0;
      const boostShake = isBoosting ? 0.04 : 0;
      const collisionShake = (state.clock.getElapsedTime() - lastCollisionTime.current < 0.15) ? 0.3 : 0;
      const totalIntensity = (baseShake + boostShake + collisionShake) * (1 + normSpeed);
      
      shakeOffset.current.set(
        (Math.random() - 0.5) * totalIntensity,
        (Math.random() - 0.5) * totalIntensity,
        (Math.random() - 0.5) * totalIntensity
      );

      // FOV Kick
      const targetFov = 65 + (normSpeed * 22);
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.1);
      camera.updateProjectionMatrix();

      if (!isOrbiting.current) {
        orbitOffset.current.x = THREE.MathUtils.lerp(orbitOffset.current.x, 0, 0.1);
        orbitOffset.current.y = THREE.MathUtils.lerp(orbitOffset.current.y, 0, 0.1);
      }

      const carRot = carRef.current.rotation.y;
      if (cameraView === CameraView.ThirdPerson) {
        const radius = isBoosting ? 13 : 9;
        const height = isBoosting ? 4.2 : 3.5;
        const finalYaw = carRot + orbitOffset.current.x;
        const finalPitch = orbitOffset.current.y;
        const offset = new THREE.Vector3(
          -Math.sin(finalYaw) * radius * Math.cos(finalPitch),
          height + Math.sin(finalPitch) * radius,
          -Math.cos(finalYaw) * radius * Math.cos(finalPitch)
        );
        camera.position.lerp(carPos.clone().add(offset).add(shakeOffset.current), 0.15);
        camera.lookAt(carPos.clone().add(new THREE.Vector3(0, 1, 2)).add(shakeOffset.current));
      } else {
        const headPos = new THREE.Vector3(0.4, 1.4, 0.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), carRot);
        camera.position.copy(carPos.clone().add(headPos).add(shakeOffset.current));
        const lookDir = new THREE.Vector3(Math.sin(carRot) * 10, -0.1, Math.cos(carRot) * 10);
        camera.lookAt(carPos.clone().add(headPos).add(lookDir).add(shakeOffset.current));
      }

      onStateUpdate({
        speed: Math.round(Math.abs(speed.current) * 200),
        gear: speed.current < 0 ? 0 : (speed.current > 4.0 ? 6 : (speed.current > 2.5 ? 5 : (speed.current > 1.5 ? 4 : (speed.current > 0.8 ? 3 : (speed.current > 0.3 ? 2 : 1))))),
        rpm: Math.round(Math.abs(speed.current) * (isBoosting ? 2000 : 4000) + (controls.forward ? 2000 : 0)),
        steering: steering.current,
        damage: Math.round(damage.current),
        isBraking: controls.brake,
        indicators: { left: controls.indicatorLeft, right: controls.indicatorRight }
      });
    }
  });

  return (
    <group ref={carRef}>
      <group ref={modelOffsetRef}>
        <CarModel 
          steering={steering.current * 15} 
          damage={damage.current} 
          isFlying={active && controls.flyMode} 
          isBoosting={isBoosting}
          isBraking={active && controls.brake}
          currentSpeed={speed.current}
        />
      </group>
    </group>
  );
};

export default PhysicsCar;
