
import React, { useState, Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Environment from './components/Environment';
import PhysicsCar from './components/PhysicsCar';
import PersonController from './components/PersonController';
import Dashboard from './components/Dashboard';
import TutorialPanel from './components/TutorialPanel';
import { CameraView, CarState, PlayerMode } from './types';
import { useControls } from './hooks/useControls';

const App: React.FC = () => {
  const [playerMode, setPlayerMode] = useState<PlayerMode>(PlayerMode.Driving);
  const [carState, setCarState] = useState<CarState>({
    speed: 0, gear: 1, rpm: 0, steering: 0, damage: 0, isBraking: false, indicators: { left: false, right: false }
  });
  const [cameraView, setCameraView] = useState<CameraView>(CameraView.ThirdPerson);
  const [sensitivity, setSensitivity] = useState<number>(0.8);
  
  const lastCarPos = useRef(new THREE.Vector3(0, 0, 0));
  const lastCarRot = useRef(0);
  const lastPersonPos = useRef(new THREE.Vector3(0, 0, 0));

  const controls = useControls();

  useEffect(() => {
    if (controls.interact) {
      if (playerMode === PlayerMode.Driving) {
        const exitOffset = new THREE.Vector3(-2.5, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), lastCarRot.current);
        lastPersonPos.current.copy(lastCarPos.current).add(exitOffset);
        setPlayerMode(PlayerMode.Walking);
      } else {
        const dist = lastPersonPos.current.distanceTo(lastCarPos.current);
        if (dist < 6) setPlayerMode(PlayerMode.Driving);
      }
    }
  }, [controls.interact]);

  const toggleCamera = () => {
    setCameraView(prev => prev === CameraView.ThirdPerson ? CameraView.FirstPerson : CameraView.ThirdPerson);
  };

  return (
    <div className="relative w-full h-screen bg-[#f0f9ff] overflow-hidden">
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 65 }} gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 1.4 }}>
        <Suspense fallback={null}>
          <Environment />
          <PhysicsCar 
            active={playerMode === PlayerMode.Driving}
            onStateUpdate={setCarState} 
            onPositionUpdate={(pos, rot) => {
              lastCarPos.current.copy(pos);
              lastCarRot.current = rot;
            }}
            cameraView={cameraView} 
            sensitivity={sensitivity} 
          />
          {playerMode === PlayerMode.Walking && (
            <PersonController 
              initialPosition={lastPersonPos.current}
              onUpdatePosition={(pos) => lastPersonPos.current.copy(pos)}
              sensitivity={sensitivity}
            />
          )}
        </Suspense>
      </Canvas>

      {/* Targeting Scope Overlay */}
      {playerMode === PlayerMode.Walking && controls.aiming && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
            {/* Outer Tech Ring */}
            <div className="absolute inset-0 border border-blue-500/20 rounded-full scale-110 animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute inset-0 border-2 border-dashed border-blue-500/30 rounded-full animate-[pulse_2s_ease-in-out_infinite]"></div>
            
            {/* Crosshairs */}
            <div className="absolute w-full h-[1px] bg-blue-500/40"></div>
            <div className="absolute h-full w-[1px] bg-blue-500/40"></div>
            
            {/* Center Reticle */}
            <div className="w-12 h-12 border border-blue-500/60 rounded-full flex items-center justify-center">
              <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-150 ${controls.firing ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-blue-400 shadow-[0_0_8px_#60a5fa]'}`}></div>
            </div>

            {/* Corner Brackets */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-400/70 rounded-tl-sm"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-400/70 rounded-tr-sm"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-400/70 rounded-bl-sm"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-400/70 rounded-tr-sm"></div>

            {/* Tech Readouts */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[9px] text-blue-400 font-orbitron font-bold tracking-[0.3em] uppercase opacity-70">
              Weapon Targeting System v9.0
            </div>
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-4 text-[8px] text-blue-400/60 font-mono">
              <span>READY TO LAUNCH</span>
              <span>CALIBRATED</span>
            </div>
          </div>
        </div>
      )}

      {/* UI Overlays */}
      <div className="absolute top-6 left-6 flex flex-col gap-4 pointer-events-none">
        <h1 className="text-2xl font-bold font-orbitron text-slate-900 tracking-tighter flex items-center gap-3">
          <div className="relative">
             <span className="w-10 h-10 bg-red-700 rounded flex items-center justify-center text-xl shadow-[0_0_20px_rgba(185,28,28,0.4)] border border-red-400/50 text-white">
               {playerMode === PlayerMode.Driving ? 'M' : 'S'}
             </span>
          </div>
          <div className="flex flex-col">
            <span className="leading-none text-slate-900 uppercase">
              {playerMode === PlayerMode.Driving ? 'Mustang GT 400' : 'Mark VII Suit'}
            </span>
            <span className="text-[10px] text-red-600 tracking-[0.4em] font-orbitron mt-1">SIMULATOR</span>
          </div>
        </h1>

        {/* Sensitivity Control */}
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-4 rounded-xl shadow-lg pointer-events-auto w-64">
           <div className="flex justify-between items-center mb-2">
             <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Sensitivity</span>
             <span className="text-[10px] font-mono font-bold text-red-600">{sensitivity.toFixed(1)}x</span>
           </div>
           <input 
             type="range" min="0.1" max="2.0" step="0.1" 
             value={sensitivity} 
             onChange={(e) => setSensitivity(parseFloat(e.target.value))}
             className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
           />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
           <div className="bg-white/90 backdrop-blur-xl border border-slate-200 px-4 py-2 rounded-md text-slate-700 text-[9px] uppercase tracking-widest font-bold shadow-sm">
             <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 mr-2 border border-slate-300">WASD</kbd> Move
           </div>
           <div className="bg-white/90 backdrop-blur-xl border border-slate-200 px-4 py-2 rounded-md text-slate-700 text-[9px] uppercase tracking-widest font-bold shadow-sm">
             <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 mr-2 border border-slate-300">Z</kbd> Enter/Exit
           </div>
           
           <div className="bg-white/90 backdrop-blur-xl border border-slate-200 px-4 py-2 rounded-md text-slate-700 text-[9px] uppercase tracking-widest font-bold shadow-sm">
             <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 mr-2 border border-slate-300">F</kbd> Flight
           </div>

           {playerMode === PlayerMode.Walking && (
             <>
               <div className="bg-white/90 backdrop-blur-xl border border-slate-200 px-4 py-2 rounded-md text-slate-700 text-[9px] uppercase tracking-widest font-bold shadow-sm">
                 <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 mr-2 border border-slate-300">R-Click</kbd> Aim
               </div>
               <div className="bg-white/90 backdrop-blur-xl border border-slate-200 px-4 py-2 rounded-md text-slate-700 text-[9px] uppercase tracking-widest font-bold shadow-sm">
                 <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 mr-2 border border-slate-300">L-Click</kbd> Launch Missile
               </div>
               <div className="bg-white/90 backdrop-blur-xl border border-slate-200 px-4 py-2 rounded-md text-slate-700 text-[9px] uppercase tracking-widest font-bold shadow-sm">
                 <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 mr-2 border border-slate-300">↑/↓</kbd> Elevation
               </div>
             </>
           )}
           
           <div className="bg-white/90 backdrop-blur-xl border border-slate-200 px-4 py-2 rounded-md text-slate-700 text-[9px] uppercase tracking-widest font-bold shadow-sm">
             <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 mr-2 border border-slate-300">LMB</kbd> Orbit
           </div>
        </div>
      </div>

      <button onClick={toggleCamera} className="absolute bottom-6 left-6 group bg-white px-8 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-xl border border-slate-200 pointer-events-auto">
        Toggle View
      </button>

      <TutorialPanel />
      {playerMode === PlayerMode.Driving && <Dashboard state={carState} />}

      {playerMode === PlayerMode.Walking && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-red-600/50 backdrop-blur-xl text-white px-6 py-2 rounded-full text-xs font-bold animate-pulse border border-white/10">
          Combat Systems Online - RMB to Aim, LMB to Fire
        </div>
      )}
    </div>
  );
};

export default App;
