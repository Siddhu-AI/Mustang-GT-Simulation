
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
    flyMode: false, // Changed to a persistent toggle
    up: false,      // ArrowUp
    down: false,    // ArrowDown
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
          setControls((c) => ({ ...c, forward: true }));
          break;
        case 'KeyS':
          setControls((c) => ({ ...c, backward: true }));
          break;
        case 'KeyA':
          setControls((c) => ({ ...c, left: true }));
          break;
        case 'KeyD':
          setControls((c) => ({ ...c, right: true }));
          break;
        case 'ArrowUp':
          setControls((c) => ({ ...c, up: true }));
          break;
        case 'ArrowDown':
          setControls((c) => ({ ...c, down: true }));
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
          // Toggle flight mode on press
          setControls((c) => ({ ...c, flyMode: !c.flyMode }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
          setControls((c) => ({ ...c, forward: false }));
          break;
        case 'KeyS':
          setControls((c) => ({ ...c, backward: false }));
          break;
        case 'KeyA':
          setControls((c) => ({ ...c, left: false }));
          break;
        case 'KeyD':
          setControls((c) => ({ ...c, right: false }));
          break;
        case 'ArrowUp':
          setControls((c) => ({ ...c, up: false }));
          break;
        case 'ArrowDown':
          setControls((c) => ({ ...c, down: false }));
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
