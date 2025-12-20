
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
    respawn: false,
    flyMode: false,
    boost: false,
    up: false,
    down: false,
    interact: false,
    jump: false,
    aiming: false,
    firing: false
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': setControls((c) => ({ ...c, forward: true })); break;
        case 'KeyS': setControls((c) => ({ ...c, backward: true })); break;
        case 'KeyA': setControls((c) => ({ ...c, left: true })); break;
        case 'KeyD': setControls((c) => ({ ...c, right: true })); break;
        case 'KeyB': setControls((c) => ({ ...c, boost: true })); break;
        case 'KeyZ': setControls((c) => ({ ...c, interact: true })); break;
        case 'ArrowUp': setControls((c) => ({ ...c, up: true })); break;
        case 'ArrowDown': setControls((c) => ({ ...c, down: true })); break;
        case 'Space': setControls((c) => ({ ...c, brake: true, jump: true })); break;
        case 'KeyQ': setControls((c) => ({ ...c, indicatorLeft: !c.indicatorLeft, indicatorRight: false })); break;
        case 'KeyE': setControls((c) => ({ ...c, indicatorRight: !c.indicatorRight, indicatorLeft: false })); break;
        case 'KeyC': setControls((c) => ({ ...c, cameraToggle: true })); break;
        case 'KeyR':
          if (e.shiftKey) setControls((c) => ({ ...c, respawn: true, repair: false }));
          else setControls((c) => ({ ...c, repair: true, respawn: false }));
          break;
        case 'KeyF': setControls((c) => ({ ...c, flyMode: !c.flyMode })); break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': setControls((c) => ({ ...c, forward: false })); break;
        case 'KeyS': setControls((c) => ({ ...c, backward: false })); break;
        case 'KeyA': setControls((c) => ({ ...c, left: false })); break;
        case 'KeyD': setControls((c) => ({ ...c, right: false })); break;
        case 'KeyB': setControls((c) => ({ ...c, boost: false })); break;
        case 'KeyZ': setControls((c) => ({ ...c, interact: false })); break;
        case 'ArrowUp': setControls((c) => ({ ...c, up: false })); break;
        case 'ArrowDown': setControls((c) => ({ ...c, down: false })); break;
        case 'Space': setControls((c) => ({ ...c, brake: false, jump: false })); break;
        case 'KeyC': setControls((c) => ({ ...c, cameraToggle: false })); break;
        case 'KeyR': setControls((c) => ({ ...c, repair: false, respawn: false })); break;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) setControls(c => ({ ...c, aiming: true }));
      if (e.button === 0) setControls(c => ({ ...c, firing: true }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) setControls(c => ({ ...c, aiming: false }));
      if (e.button === 0) setControls(c => ({ ...c, firing: false }));
    };

    const preventContext = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', preventContext);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', preventContext);
    };
  }, []);

  return controls;
};
