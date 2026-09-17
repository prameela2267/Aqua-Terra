import React from 'react';
import { Droplets, Activity } from 'lucide-react';

export default function WaterAnimation({ isRunning, flowRate = 15 }) {
  if (!isRunning) {
    return (
      <div className="h-32 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-400">
        <Droplets className="w-8 h-8 mb-2 opacity-40" />
        <span className="text-xs font-medium">Pump is in standby mode</span>
        <span className="text-[11px] text-slate-400/80">Water valves closed • 0.0 L/min</span>
      </div>
    );
  }

  return (
    <div className="relative h-32 rounded-2xl overflow-hidden shadow-inner border border-blue-400/30 flex flex-col justify-between p-4 water-flow-active">
      {/* Background Animated SVG Waves */}
      <div className="absolute inset-0 opacity-40 pointer-events-none overflow-hidden">
        <svg
          className="absolute bottom-0 w-[200%] h-20 animate-pulse-slow"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 L0,120 Z"
            fill="rgba(255, 255, 255, 0.4)"
          />
        </svg>
      </div>

      {/* Header Info */}
      <div className="relative z-10 flex items-center justify-between text-white">
        <div className="flex items-center space-x-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-200 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider">Hydration Stream Active</span>
        </div>
        <div className="text-[11px] bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full font-mono font-semibold">
          ~{flowRate} L/min
        </div>
      </div>

      {/* Floating Animated Droplets */}
      <div className="relative z-10 flex justify-around items-center text-white/90">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="animate-bounce"
            style={{ animationDelay: `${i * 0.2}s`, animationDuration: '1.2s' }}
          >
            <Droplets className="w-5 h-5 drop-shadow" />
          </div>
        ))}
      </div>

      {/* Footer Status */}
      <div className="relative z-10 flex items-center justify-between text-white/90 text-xs font-medium">
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" /> Drip Emitters Pressurized
        </span>
        <span className="text-[11px] opacity-90">Soil absorbing moisture</span>
      </div>
    </div>
  );
}
