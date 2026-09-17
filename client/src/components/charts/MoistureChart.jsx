import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export default function MoistureChart({ data = [] }) {
  const { isDark } = useTheme();

  // If data is empty or loading
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-slate-400">
        Loading soil telemetry...
      </div>
    );
  }

  const strokeGrid = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke={strokeGrid} vertical={false} />
          <XAxis
            dataKey="label"
            stroke={textColor}
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: strokeGrid }}
          />
          <YAxis
            domain={[10, 90]}
            stroke={textColor}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}%`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const val = payload[0].value;
                return (
                  <div className="p-3 rounded-xl shadow-lg border text-xs glass-panel border-slate-200 dark:border-slate-800">
                    <p className="font-bold text-slate-900 dark:text-white mb-1">{label}</p>
                    <p className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Soil Moisture: {val}%
                    </p>
                    <p className={`text-[10px] mt-1 font-medium ${val < 35 ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                      {val < 35 ? '⚠️ Below 35% Critical Threshold' : '✅ Optimal Moisture Zone'}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          {/* 35% Critical Threshold Line */}
          <ReferenceLine
            y={35}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: '35% Irrigation Threshold',
              position: 'insideTopRight',
              fill: '#f59e0b',
              fontSize: 10,
              fontWeight: 600
            }}
          />
          <Area
            type="monotone"
            dataKey="moisture"
            stroke="#10b981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#moistureGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
