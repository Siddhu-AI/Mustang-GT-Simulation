
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
  const [sensitivity, setSensitivity] = useState<number>(0.8);

  const toggleCamera = () => {
    setCameraView(prev => 
      prev === CameraView.ThirdPerson ? CameraView.FirstPerson : CameraView.ThirdPerson
    );
  };

  return (
    <div className="relative w-full h-screen bg-[#f0f9ff] overflow-hidden">
      {/* 3D Scene */}
      <Canvas 
        shadows 
        dpr={[1, 2]} 
        camera={{ fov: 65 }}
        gl={{ 
          antialias: true,
          toneMapping: 3,
          toneMappingExposure: 1.4
        }}
      >
        <Suspense fallback={null}>
          <Environment />
          <PhysicsCar onStateUpdate={setCarState} cameraView={cameraView} sensitivity={sensitivity} />
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
            <span className="leading-none text-slate-900 drop-shadow-sm uppercase">Mustang GT 400</span>
            <span className="text-[10px] text-orange-600 tracking-[0.4em] font-orbitron mt-1">HYPER SIMULATOR</span>
          </div>
        </h1>
        
        <div className="grid grid-cols-2 gap-2">
           <div className="bg-white/90 backdrop-blur-xl border border-slate-200 px-4 py-2 rounded-md text-slate-700 text-[9px] uppercase tracking-widest font-bold shadow-sm">
             <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 mr-2 border border-slate-300">WASD</kbd> Drive
           </div>
           <div className="bg-white/90 backdrop-blur-xl border border-slate-200 px-4 py-2 rounded-md text-slate-700 text-[9px] uppercase tracking-widest font-bold shadow-sm">
             <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 mr-2 border border-slate-300">F</kbd> Fly Mode
           </div>
           <div className="bg-white/90 backdrop-blur-xl border border-slate-200 px-4 py-2 rounded-md text-slate-700 text-[9px] uppercase tracking-widest font-bold shadow-sm">
             <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 mr-2 border border-slate-300">↑↓</kbd> Vertical
           </div>
           <div className="bg-white/90 backdrop-blur-xl border border-slate-200 px-4 py-2 rounded-md text-slate-700 text-[9px] uppercase tracking-widest font-bold shadow-sm">
             <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 mr-2 border border-slate-300">R</kbd> Repair
           </div>
        </div>
      </div>

      <div className="absolute top-52 left-6 pointer-events-auto bg-white/90 backdrop-blur-xl border border-slate-200 p-4 rounded-xl shadow-lg w-48 flex flex-col gap-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex justify-between">
          <span>Steering Sens</span>
          <span className="text-orange-600">{(sensitivity * 100).toFixed(0)}%</span>
        </label>
        <input 
          type="range" 
          min="0.1" 
          max="2.0" 
          step="0.1" 
          value={sensitivity} 
          onChange={(e) => setSensitivity(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
        />
      </div>

      <button 
        onClick={toggleCamera}
        className="absolute bottom-6 left-6 group bg-white hover:bg-orange-600 transition-all text-slate-900 hover:text-white px-8 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-xl backdrop-blur-xl border border-slate-200 flex items-center gap-2 pointer-events-auto"
      >
        <div className="w-2 h-2 bg-orange-500 rounded-full group-hover:bg-white"></div>
        Toggle View
      </button>

      <TutorialPanel />
      <Dashboard state={carState} />

      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.05)]"></div>
      
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
