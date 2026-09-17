import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

export default function TelemetryMultiChart({ data = [] }) {
  const { isDark } = useTheme();

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-slate-400">
        No comparative telemetry available.
      </div>
    );
  }

  const strokeGrid = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={strokeGrid} vertical={false} />
          <XAxis
            dataKey="label"
            stroke={textColor}
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: strokeGrid }}
          />
          <YAxis
            stroke={textColor}
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="p-3.5 rounded-xl shadow-xl glass-panel border border-slate-200 dark:border-slate-800 text-xs">
                    <p className="font-bold text-slate-900 dark:text-white mb-2">{label}</p>
                    {payload.map((entry, index) => (
                      <p
                        key={`item-${index}`}
                        className="flex items-center justify-between gap-3 font-semibold py-0.5"
                        style={{ color: entry.color }}
                      >
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          {entry.name}:
                        </span>
                        <span>{entry.value} {entry.name === 'Temperature' ? '°C' : '%'}</span>
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
          />
          <Line
            type="monotone"
            dataKey="moisture"
            name="Soil Moisture (%)"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            name="Temperature (°C)"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="humidity"
            name="Humidity (%)"
            stroke="#0ea5e9"
            strokeWidth={1.8}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
