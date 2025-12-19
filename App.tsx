
import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Environment from './components/Environment';
import PhysicsCar from './components/PhysicsCar';
import Dashboard from './components/Dashboard';
import TutorialPanel from './components/TutorialPanel';
import { CameraView, CarState } from './types';

const App: React.FC = () => {
  const [carState, setCarState] = useState<CarState>({
    speed: 0,
    gear: 1,
    rpm: 0,
    steering: 0,
    damage: 0,
    isBraking: false,
    indicators: { left: false, right: false }
  });

  const [cameraView, setCameraView] = useState<CameraView>(CameraView.ThirdPerson);

  const toggleCamera = () => {
    setCameraView(prev => 
      prev === CameraView.ThirdPerson ? CameraView.FirstPerson : CameraView.ThirdPerson
    );
  };

  return (
    <div className="relative w-full h-screen bg-[#dcfce7] overflow-hidden">
      {/* 3D Scene */}
      <Canvas 
        shadows 
        dpr={[1, 2]} 
        camera={{ fov: 65 }}
        gl={{ 
          antialias: true,
          toneMapping: 3, // ACESFilmicToneMapping
          toneMappingExposure: 1.0
        }}
      >
        <Suspense fallback={null}>
          <Environment />
          <PhysicsCar onStateUpdate={setCarState} cameraView={cameraView} />
        </Suspense>
      </Canvas>

      {/* UI Overlays */}
      <div className="absolute top-6 left-6 flex flex-col gap-4 pointer-events-none">
        <h1 className="text-2xl font-bold font-orbitron text-slate-900 tracking-tighter flex items-center gap-3">
          <div className="relative">
             <span className="w-10 h-10 bg-orange-600 rounded flex items-center justify-center text-xl shadow-[0_0_20px_rgba(234,88,12,0.4)] border border-orange-400/50 text-white">M</span>
             <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-slate-200">
                <div className="w-2.5 h-2.5 bg-orange-600 rounded-full"></div>
             </div>
          </div>
          <div className="flex flex-col">
            <span className="leading-none text-slate-900 drop-shadow-sm">MUSTANG GT</span>
            <span className="text-[10px] text-orange-600 tracking-[0.4em] font-orbitron mt-1">PRO SIMULATOR</span>
          </div>
        </h1>
        
        <div className="grid grid-cols-2 gap-2">
           <div className="bg-white/80 backdrop-blur-xl border border-slate-200 px-4 py-2 rounded-md text-slate-700 text-[9px] uppercase tracking-widest font-bold shadow-sm">
             <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 mr-2 border border-slate-300">WASD</kbd> Drive
           </div>
           <div className="bg-white/80 backdrop-blur-xl border border-slate-200 px-4 py-2 rounded-md text-slate-700 text-[9px] uppercase tracking-widest font-bold shadow-sm">
             <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 mr-2 border border-slate-300">C</kbd> Camera
           </div>
           <div className="bg-white/80 backdrop-blur-xl border border-slate-200 px-4 py-2 rounded-md text-slate-700 text-[9px] uppercase tracking-widest font-bold shadow-sm">
             <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 mr-2 border border-slate-300">R</kbd> Repair
           </div>
           <div className="bg-white/80 backdrop-blur-xl border border-slate-200 px-4 py-2 rounded-md text-slate-700 text-[9px] uppercase tracking-widest font-bold shadow-sm">
             <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 mr-2 border border-slate-300">F</kbd> Fly
           </div>
        </div>
      </div>

      {/* View Toggle - Slimmer */}
      <button 
        onClick={toggleCamera}
        className="absolute bottom-6 left-6 group bg-white hover:bg-orange-600 transition-all text-slate-900 hover:text-white px-6 py-2 rounded-full font-bold text-[9px] uppercase tracking-widest shadow-lg backdrop-blur-xl border border-slate-200 flex items-center gap-2"
      >
        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full group-hover:bg-white"></div>
        View
      </button>

      {/* Tutorial Panel stays in Top Right */}
      <TutorialPanel />
      
      {/* Minimized Dashboard in Bottom Right */}
      <Dashboard state={carState} />

      {/* Aesthetic Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.1)]"></div>
      
      {/* Damage Filter */}
      {carState.damage > 0 && (
        <div 
          className="absolute inset-0 pointer-events-none border-[20px] border-red-500/0 transition-all duration-300"
          style={{ borderColor: `rgba(239, 68, 68, ${carState.damage / 300})`, boxShadow: `inset 0 0 ${carState.damage}px rgba(239, 68, 68, 0.1)` }}
        ></div>
      )}
    </div>
  );
};

export default App;
