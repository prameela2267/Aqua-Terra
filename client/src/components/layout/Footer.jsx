import React from 'react';
import { Droplets, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md py-6 text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Droplets className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            AquaTerra Smart Irrigation System
          </span>
          <span className="text-slate-400">| Precision Agriculture Telemetry</span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            Sensors & Simulation Operational
          </span>
          <span>© {new Date().getFullYear()} College CSP Project</span>
        </div>
      </div>
    </footer>
  );
}
