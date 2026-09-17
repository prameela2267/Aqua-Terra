import React from 'react';

export default function StatCard({
  title,
  value,
  unit = '',
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'emerald', // emerald, blue, amber, cyan, purple
  badge,
  progress = null,
  progressColor = 'bg-emerald-500'
}) {
  const schemeStyles = {
    emerald: {
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60',
      badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
    },
    blue: {
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/60',
      badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300'
    },
    amber: {
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/60',
      badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
    },
    cyan: {
      iconBg: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border-cyan-200/60 dark:border-cyan-800/60',
      badge: 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300'
    },
    purple: {
      iconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/60',
      badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300'
    }
  }[colorScheme] || {
    iconBg: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
  };

  return (
    <div className="glass-panel p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {value}
            </span>
            {unit && <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{unit}</span>}
          </div>
        </div>

        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs ${schemeStyles.iconBg} group-hover:scale-110 transition-transform duration-200`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Progress Bar (if provided) */}
      {progress !== null && (
        <div className="mt-4">
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor}`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtitle / Badge */}
      <div className="mt-3.5 flex items-center justify-between text-xs">
        {subtitle && (
          <span className="text-slate-500 dark:text-slate-400 font-medium truncate">
            {subtitle}
          </span>
        )}
        {badge && (
          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] tracking-wide uppercase ${schemeStyles.badge}`}>
            {badge}
          </span>
        )}
        {trend && (
          <span className={`font-semibold ${trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
            {trend.text}
          </span>
        )}
      </div>
    </div>
  );
}
