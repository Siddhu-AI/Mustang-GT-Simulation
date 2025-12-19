
import React from 'react';
import { CarState } from '../types';

interface DashboardProps {
  state: CarState;
}

const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const rpmPercentage = (state.rpm / 8000) * 100;
  const isDamaged = state.damage > 0;

  return (
    <div className="absolute bottom-6 right-6 pointer-events-none select-none flex flex-col items-end gap-3">
      {/* Damage Alert */}
      {state.damage > 70 && (
        <div className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded animate-pulse uppercase tracking-widest">
          Engine Damage Critical
        </div>
      )}

      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-6 shadow-2xl">
        {/* Speed & Gear */}
        <div className="flex flex-col items-center min-w-[80px]">
          <span className="text-4xl font-bold font-orbitron text-white leading-none">{state.speed}</span>
          <span className="text-[10px] text-white/40 uppercase tracking-tighter">KM/H</span>
          <div className="mt-2 text-blue-500 font-orbitron font-bold text-sm bg-blue-500/10 px-3 py-0.5 rounded-full border border-blue-500/20">
            {state.gear === 0 ? 'R' : state.speed === 0 ? 'N' : `G${state.gear}`}
          </div>
        </div>

        {/* Small RPM & Damage Ring */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            {/* Background */}
            <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
            {/* RPM */}
            <circle 
              cx="40" cy="40" r="35" 
              fill="none" stroke="currentColor" 
              strokeWidth="4" 
              strokeDasharray="220"
              strokeDashoffset={220 - (220 * rpmPercentage) / 100}
              className="text-blue-500 transition-all duration-300"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
             <span className="text-[8px] text-white/30 uppercase font-orbitron">RPM</span>
          </div>
        </div>

        {/* Vertical Bars (Damage & Health) */}
        <div className="flex flex-col gap-3 w-24">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[8px] uppercase font-bold text-white/40">
              <span>Integrity</span>
              <span className={state.damage > 50 ? "text-red-500" : "text-green-500"}>{100 - state.damage}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${state.damage > 50 ? 'bg-red-500' : 'bg-green-500'}`} 
                style={{ width: `${100 - state.damage}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex gap-2">
             <div className={`w-2 h-2 rounded-full ${state.indicators.left ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-white/10'}`}></div>
             <div className={`w-2 h-2 rounded-full ${state.indicators.right ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-white/10'}`}></div>
             <div className={`w-2 h-2 rounded-full ${state.isBraking ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-white/10'}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
