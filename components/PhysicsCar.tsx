
import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import CarModel from './CarModel';
import { useControls } from '../hooks/useControls';
import { CameraView, CarState } from '../types';

interface PhysicsCarProps {
  onStateUpdate: (state: CarState) => void;
  cameraView: CameraView;
  sensitivity: number;
}

const PhysicsCar: React.FC<PhysicsCarProps> = ({ onStateUpdate, cameraView, sensitivity }) => {
  const { camera, scene } = useThree();
  const controls = useControls();
  const carRef = useRef<THREE.Group>(null!);
  const modelOffsetRef = useRef<THREE.Group>(null!);
  
  const speed = useRef(0);
  const steering = useRef(0);
  const damage = useRef(0);
  const verticalVelocity = useRef(0);
  
  const maxSpeed = 2.0;
  const acceleration = 0.008; 
  const friction = 0.995;
  const gravity = 0.005;
  const liftForce = 0.012;
  const turnSpeed = 0.02;
  const lastCollisionTime = useRef(0);

  useFrame((state, delta) => {
    if (!carRef.current) return;

    if (controls.repair) {
      damage.current = 0;
    }

    // VERTICAL CONTROL (ARROW KEYS)
    if (controls.flyMode) {
      if (controls.up) {
        verticalVelocity.current += liftForce;
      } else if (controls.down) {
        verticalVelocity.current -= liftForce;
      } else {
        // Hover/Stabilize vertical
        verticalVelocity.current *= 0.9;
      }
    } else {
      // Normal gravity if not in flight mode
      verticalVelocity.current -= gravity;
    }
    
    carRef.current.position.y += verticalVelocity.current;

    if (carRef.current.position.y < 0) {
      carRef.current.position.y = 0;
      verticalVelocity.current = 0;
    }

    // MOVEMENT (WASD)
    if (damage.current < 100) {
      if (controls.forward) {
        speed.current += acceleration * (1 - damage.current / 300);
      } else if (controls.backward) {
        speed.current -= acceleration * 0.5;
      }
    }

    const isAirborne = carRef.current.position.y > 0.1;
    const highSpeedDamping = Math.max(0.15, 1 - (Math.abs(speed.current) / maxSpeed) * 0.85);
    const airDamping = isAirborne ? 0.7 : 1;
    
    const targetSteering = (controls.left ? turnSpeed : controls.right ? -turnSpeed : 0) * highSpeedDamping * airDamping * sensitivity;
    steering.current = THREE.MathUtils.lerp(steering.current, targetSteering, 0.1);

    speed.current *= friction;
    if (controls.brake) speed.current *= 0.92;
    speed.current = THREE.MathUtils.clamp(speed.current, -maxSpeed / 3, maxSpeed);

    carRef.current.rotation.y += steering.current * speed.current * 8;
    carRef.current.translateZ(speed.current);

    // STABILIZATION: The car should not rotate when flying
    if (controls.flyMode) {
      // Keep level (X and Z rotation)
      carRef.current.rotation.x = THREE.MathUtils.lerp(carRef.current.rotation.x, 0, 0.1);
      carRef.current.rotation.z = THREE.MathUtils.lerp(carRef.current.rotation.z, 0, 0.1);
    }

    // COLLISION DETECTION
    const carPos = carRef.current.position;
    if (carPos.y < 5) {
      const roadBounds = 11;
      if (Math.abs(carPos.x) > roadBounds && carPos.z < 300) {
        const now = performance.now();
        if (now - lastCollisionTime.current > 500) {
          damage.current = Math.min(100, damage.current + Math.abs(speed.current) * 30);
          speed.current *= -0.3;
          carRef.current.position.x = Math.sign(carPos.x) * roadBounds;
          lastCollisionTime.current = now;
        }
      }
    }

    if (carPos.y < 2) {
      scene.traverse((obj) => {
        if (obj.type === 'Group' && (obj as any).isTrafficCar) {
          const trafficPos = new THREE.Vector3();
          obj.getWorldPosition(trafficPos);
          const dist = carPos.distanceTo(trafficPos);
          if (dist < 4) {
            const now = performance.now();
            if (now - lastCollisionTime.current > 500) {
              damage.current = Math.min(100, damage.current + Math.abs(speed.current) * 50);
              speed.current *= -0.5;
              lastCollisionTime.current = now;
            }
          }
        }
      });
    }

    if (modelOffsetRef.current) {
       // Only apply roll if not in flight mode stabilization
       const rollAmount = controls.flyMode ? 0 : steering.current * speed.current * 10;
       const pitchAmount = controls.flyMode ? 0 : -verticalVelocity.current * 5 + (controls.forward ? -0.015 : 0);
       
       modelOffsetRef.current.rotation.z = THREE.MathUtils.lerp(modelOffsetRef.current.rotation.z, rollAmount, 0.1);
       modelOffsetRef.current.rotation.x = THREE.MathUtils.lerp(modelOffsetRef.current.rotation.x, pitchAmount, 0.1);
       
       if (damage.current > 70) {
         modelOffsetRef.current.position.x = (Math.random() - 0.5) * 0.03;
         modelOffsetRef.current.position.y = (Math.random() - 0.5) * 0.03;
       }
    }

    const carRot = carRef.current.rotation.y;
    if (cameraView === CameraView.ThirdPerson) {
      const offset = new THREE.Vector3(0, 3.5, -9).applyAxisAngle(new THREE.Vector3(0, 1, 0), carRot);
      camera.position.lerp(carPos.clone().add(offset), 0.12);
      camera.lookAt(carPos.clone().add(new THREE.Vector3(0, 1, 2)));
    } else {
      const offset = new THREE.Vector3(0.4, 1.4, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), carRot);
      camera.position.copy(carPos.clone().add(offset));
      camera.lookAt(carPos.clone().add(new THREE.Vector3(0.1, 1.35, 10).applyAxisAngle(new THREE.Vector3(0, 1, 0), carRot)));
    }

    onStateUpdate({
      speed: Math.round(Math.abs(speed.current) * 200),
      gear: speed.current < 0 ? 0 : (speed.current > 1.5 ? 5 : (speed.current > 1.1 ? 4 : (speed.current > 0.7 ? 3 : (speed.current > 0.3 ? 2 : 1)))),
      rpm: Math.round(Math.abs(speed.current) * 4000 + (controls.forward ? 2000 : 0)),
      steering: steering.current,
      damage: Math.round(damage.current),
      isBraking: controls.brake,
      indicators: { left: controls.indicatorLeft, right: controls.indicatorRight }
    });
  });

  return (
    <group ref={carRef}>
      <group ref={modelOffsetRef}>
        <CarModel steering={steering.current * 15} damage={damage.current} isFlying={controls.flyMode} />
      </group>
    </group>
  );
};

export default PhysicsCar;
