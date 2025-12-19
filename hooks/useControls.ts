
import { useState, useEffect } from 'react';

export const useControls = () => {
  const [controls, setControls] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
    indicatorLeft: false,
    indicatorRight: false,
    cameraToggle: false,
    repair: false,
    fly: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setControls((c) => ({ ...c, forward: true }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setControls((c) => ({ ...c, backward: true }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setControls((c) => ({ ...c, left: true }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setControls((c) => ({ ...c, right: true }));
          break;
        case 'Space':
          setControls((c) => ({ ...c, brake: true }));
          break;
        case 'KeyQ':
          setControls((c) => ({ ...c, indicatorLeft: !c.indicatorLeft, indicatorRight: false }));
          break;
        case 'KeyE':
          setControls((c) => ({ ...c, indicatorRight: !c.indicatorRight, indicatorLeft: false }));
          break;
        case 'KeyC':
          setControls((c) => ({ ...c, cameraToggle: true }));
          break;
        case 'KeyR':
          setControls((c) => ({ ...c, repair: true }));
          break;
        case 'KeyF':
          setControls((c) => ({ ...c, fly: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setControls((c) => ({ ...c, forward: false }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setControls((c) => ({ ...c, backward: false }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setControls((c) => ({ ...c, left: false }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setControls((c) => ({ ...c, right: false }));
          break;
        case 'Space':
          setControls((c) => ({ ...c, brake: false }));
          break;
        case 'KeyC':
          setControls((c) => ({ ...c, cameraToggle: false }));
          break;
        case 'KeyR':
          setControls((c) => ({ ...c, repair: false }));
          break;
        case 'KeyF':
          setControls((c) => ({ ...c, fly: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return controls;
};
