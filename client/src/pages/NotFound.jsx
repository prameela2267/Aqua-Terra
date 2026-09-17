import React from 'react';
import { Link } from 'react-router-dom';
import { Droplets, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-16 h-16 rounded-3xl agri-gradient text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <Droplets className="w-8 h-8" />
        </div>
        <h1 className="text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          404
        </h1>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Field Sector Not Found
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The requested station telemetry route does not exist or has been relocated.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
        >
          <Home className="w-4 h-4" /> Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
