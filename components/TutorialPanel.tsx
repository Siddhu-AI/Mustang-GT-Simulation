
import React, { useState, useEffect } from 'react';
import { getDrivingInstruction } from '../services/geminiService';
import { DrivingTip } from '../types';

const TutorialPanel: React.FC = () => {
  const [tip, setTip] = useState<DrivingTip | null>(null);
  const [loading, setLoading] = useState(false);

  const topics = [
    "safe braking techniques",
    "steering precision",
    "using turn signals properly",
    "maintaining speed limits",
    "parallel parking theory",
    "lane discipline"
  ];

  const fetchNewTip = async () => {
    setLoading(true);
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const newTip = await getDrivingInstruction(randomTopic);
    setTip(newTip);
    setLoading(false);
  };

  useEffect(() => {
    fetchNewTip();
    // Refresh tip every 60 seconds
    const interval = setInterval(fetchNewTip, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-6 right-6 w-80 bg-slate-900/90 border border-blue-500/30 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl">
      <div className="bg-blue-600/20 px-4 py-2 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider font-orbitron">AI Instructor</span>
        </div>
        <button 
          onClick={fetchNewTip}
          disabled={loading}
          className="text-white/40 hover:text-white transition-colors p-1"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      
      <div className="p-4">
        {loading && !tip ? (
          <div className="animate-pulse flex flex-col gap-2">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-2 bg-white/5 rounded w-full"></div>
            <div className="h-2 bg-white/5 rounded w-full"></div>
          </div>
        ) : (
          <>
            <h3 className="text-sm font-bold text-white mb-2">{tip?.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "{tip?.instruction}"
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default TutorialPanel;
