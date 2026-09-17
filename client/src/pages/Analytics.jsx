import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import TelemetryMultiChart from '../components/charts/TelemetryMultiChart';
import WaterUsageChart from '../components/charts/WaterUsageChart';
import {
  BarChart3,
  Droplets,
  ShieldCheck,
  Activity,
  Clock,
  Calendar,
  Sparkles,
  PieChart
} from 'lucide-react';

export default function Analytics() {
  const [days, setDays] = useState(7);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/analytics?days=${days}`);
        if (res.data.success) {
          setAnalytics(res.data);
        }
      } catch (err) {
        console.error('[Analytics Fetch Error]', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [days]);

  const summary = analytics?.summary || {
    totalWaterUsedLiters: 0,
    totalWaterSavedLiters: 0,
    totalPumpCycles: 0,
    totalPumpMinutes: 0,
    recommendationSplit: { irrigateNow: 0, noIrrigation: 0 }
  };

  const trendData = analytics?.trend || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-emerald-600" /> Agricultural Analytics & Conservation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quantitative correlation of soil hydration, ambient heat, and water resource efficiency
          </p>
        </div>

        {/* Days range selector */}
        <div className="flex items-center gap-1.5 glass-panel p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                days === d
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Last {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Top Level Conservation & Efficiency KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Water Conserved"
          value={loading ? '--' : `${summary.totalWaterSavedLiters}`}
          unit="Liters"
          subtitle="Saved via Rain & Decision Hold"
          icon={ShieldCheck}
          colorScheme="emerald"
          badge="ECO-SAVED"
        />

        <StatCard
          title="Water Dispensed"
          value={loading ? '--' : `${summary.totalWaterUsedLiters}`}
          unit="Liters"
          subtitle="Direct Agricultural Consumption"
          icon={Droplets}
          colorScheme="blue"
          badge="IRRIGATED"
        />

        <StatCard
          title="Pump Cycles"
          value={loading ? '--' : summary.totalPumpCycles}
          unit="Sessions"
          subtitle="Completed Drip Activations"
          icon={Activity}
          colorScheme="purple"
        />

        <StatCard
          title="Total Runtime"
          value={loading ? '--' : summary.totalPumpMinutes}
          unit="Mins"
          subtitle="Cumulative Motor Run Time"
          icon={Clock}
          colorScheme="cyan"
        />
      </div>

      {/* Chart Row 1: Soil Moisture vs Temperature & Humidity Correlation */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" /> Multi-Parameter Telemetry Curve
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Correlating Soil Moisture (%) against Ambient Temperature (°C) and Atmospheric Humidity (%)
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Source: Live MongoDB Records
          </span>
        </div>

        <TelemetryMultiChart data={trendData} />
      </div>

      {/* Chart Row 2: Water Dispensed per Day & Decision Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Daily Water Consumption Bar Chart */}
        <div className="lg:col-span-2 glass-panel p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mb-1">
            Daily Water Dispensed (Liters)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Derived from exact pump start/stop durations (15 L/min flow rate)
          </p>
          <WaterUsageChart data={trendData} />
        </div>

        {/* Right (1 col): Decision Engine Performance Ratio Card */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <PieChart className="w-5 h-5 text-emerald-600" /> Decision Engine Split
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Distribution of automated telemetry evaluations
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    IRRIGATE NOW
                  </span>
                  <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                    {summary.recommendationSplit.irrigateNow}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                  Triggered when soil &lt; 35% and rain &lt; 40%
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800 dark:text-blue-300">
                    NO IRRIGATION NEEDED
                  </span>
                  <span className="text-lg font-extrabold text-blue-700 dark:text-blue-300">
                    {summary.recommendationSplit.noIrrigation}
                  </span>
                </div>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">
                  Water conserved due to adequate moisture or approaching rain
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400">
            <strong>Efficiency Index:</strong>{' '}
            {summary.recommendationSplit.irrigateNow + summary.recommendationSplit.noIrrigation > 0
              ? `${Math.round(
                  (summary.recommendationSplit.noIrrigation /
                    (summary.recommendationSplit.irrigateNow + summary.recommendationSplit.noIrrigation)) *
                    100
                )}% of checks conserved water`
              : 'Awaiting telemetry checks'}
          </div>
        </div>
      </div>
    </div>
  );
}
