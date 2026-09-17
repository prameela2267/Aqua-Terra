import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import WaterAnimation from '../components/common/WaterAnimation';
import MoistureChart from '../components/charts/MoistureChart';
import {
  Thermometer,
  Droplets,
  CloudRain,
  Sprout,
  Power,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info,
  Wind
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  // Telemetry States
  const [soil, setSoil] = useState({ moisture: 40, sensorId: 'SENSOR-SOIL-01', loading: true });
  const [weather, setWeather] = useState({
    city: 'Bengaluru',
    temperature: 26,
    humidity: 65,
    rainProbability: 20,
    windSpeed: 3.5,
    description: 'Scattered clouds',
    loading: true
  });
  const [recommendation, setRecommendation] = useState({
    decision: 'NO_IRRIGATION_NEEDED',
    reason: 'Loading telemetry evaluation...',
    loading: true
  });
  const [pump, setPump] = useState({
    isRunning: false,
    activeSession: null,
    loading: true
  });
  const [chartData, setChartData] = useState([]);

  // UI action states
  const [togglingPump, setTogglingPump] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch all live dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const [soilRes, weatherRes, recRes, pumpRes, analyticsRes] = await Promise.all([
        api.get('/telemetry/soil/latest'),
        api.get('/telemetry/weather'),
        api.get('/recommendation/latest'),
        api.get('/pump/status'),
        api.get('/analytics?days=7')
      ]);

      if (soilRes.data.success) {
        setSoil({
          moisture: soilRes.data.latest.moisturePercent,
          sensorId: soilRes.data.latest.sensorId,
          loading: false
        });
      }

      if (weatherRes.data.success) {
        setWeather({
          ...weatherRes.data.weather,
          loading: false
        });
      }

      if (recRes.data.success) {
        setRecommendation({
          ...recRes.data.recommendation,
          loading: false
        });
      }

      if (pumpRes.data.success) {
        setPump({
          isRunning: pumpRes.data.isRunning,
          activeSession: pumpRes.data.activeSession,
          loading: false
        });
      }

      if (analyticsRes.data.success && analyticsRes.data.trend) {
        setChartData(analyticsRes.data.trend);
      }
    } catch (err) {
      console.error('[Dashboard Fetch Error]', err);
    }
  }, []);

  // Polling interval for live readings
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000); // 8-second refresh
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Toggle Pump Switch
  const handleTogglePump = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setTogglingPump(true);

    try {
      const targetAction = pump.isRunning ? 'OFF' : 'ON';
      const res = await api.post('/pump/toggle', { action: targetAction });

      if (res.data.success) {
        setPump(prev => ({
          ...prev,
          isRunning: res.data.isRunning,
          activeSession: res.data.session
        }));
        setSuccessMessage(res.data.message);
        // Refresh telemetry immediately
        setTimeout(fetchDashboardData, 500);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error || 'Pump operation failed. Ensure irrigation is recommended.'
      );
    } finally {
      setTogglingPump(false);
    }
  };

  // Re-evaluate Recommendation on demand
  const handleReevaluate = async () => {
    try {
      const res = await api.post('/recommendation/evaluate');
      if (res.data.success) {
        setRecommendation({
          ...res.data.recommendation,
          loading: false
        });
        setSuccessMessage('Decision Engine re-evaluated current environmental conditions.');
      }
    } catch (err) {
      setErrorMessage('Failed to recompute recommendation');
    }
  };

  // Sensor Simulation Demo Tool: Force moisture value
  const handleForceMoisture = async (value) => {
    setErrorMessage('');
    setSuccessMessage('');
    setSimulating(true);

    try {
      const res = await api.post('/telemetry/soil/simulate', { forceValue: value });
      if (res.data.success) {
        setSoil(prev => ({ ...prev, moisture: res.data.reading.moisturePercent }));
        // Re-evaluate decision engine automatically
        const recRes = await api.post('/recommendation/evaluate');
        if (recRes.data.success) {
          setRecommendation({ ...recRes.data.recommendation, loading: false });
        }
        setSuccessMessage(`Soil moisture sensor updated to ${value}%. Decision engine re-evaluated!`);
        fetchDashboardData();
      }
    } catch (err) {
      setErrorMessage('Simulation tick failed');
    } finally {
      setSimulating(false);
    }
  };

  const isIrrigateNeeded = recommendation.decision === 'IRRIGATE_NOW';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner: Farm Greeting & Quick Simulation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Farm Dashboard
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Live Sensor Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Station: <span className="font-semibold text-slate-700 dark:text-slate-300">{weather.city}</span> • Crop: <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.cropType || 'Vegetables'}</span>
          </p>
        </div>

        {/* Interactive Simulation Controls for Demo Evaluation */}
        <div className="glass-panel p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 pl-1">
            <Sliders className="w-3.5 h-3.5 text-emerald-500" /> Sensor Sim:
          </span>
          <button
            onClick={() => handleForceMoisture(24)}
            disabled={simulating}
            className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 font-semibold transition-colors"
            title="Sets moisture to 24% to test IRRIGATE_NOW trigger"
          >
            📉 Dry Soil (24%)
          </button>
          <button
            onClick={() => handleForceMoisture(52)}
            disabled={simulating}
            className="px-2.5 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/80 dark:hover:bg-blue-900 text-blue-900 dark:text-blue-200 font-semibold transition-colors"
            title="Sets moisture to 52% to test optimal soil condition"
          >
            💧 Optimal (52%)
          </button>
          <button
            onClick={fetchDashboardData}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Refresh Live Telemetry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Alert Notices (if any) */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-bold">Interlock Notice</p>
              <p className="mt-0.5 opacity-90">{errorMessage}</p>
            </div>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-rose-600">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
            <div>
              <p className="font-bold">Telemetry Acknowledged</p>
              <p className="mt-0.5 opacity-90">{successMessage}</p>
            </div>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-emerald-600">✕</button>
        </div>
      )}

      {/* Section 1: Live Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
        {/* Soil Moisture Card */}
        <StatCard
          title="Soil Moisture"
          value={soil.loading ? '--' : soil.moisture}
          unit="%"
          subtitle={soil.moisture < 35 ? '⚠️ Critical (<35%)' : '✅ Optimal Range'}
          icon={Sprout}
          colorScheme={soil.moisture < 35 ? 'amber' : 'emerald'}
          badge={soil.moisture < 35 ? 'DRY' : 'MOIST'}
          progress={soil.moisture}
          progressColor={soil.moisture < 35 ? 'bg-amber-500' : 'bg-emerald-500'}
        />

        {/* Rain Probability Card */}
        <StatCard
          title="Rain Probability"
          value={weather.loading ? '--' : weather.rainProbability}
          unit="%"
          subtitle={weather.rainProbability >= 40 ? 'Rain Impending' : 'Low Precipitation'}
          icon={CloudRain}
          colorScheme="blue"
          badge={weather.rainProbability >= 40 ? 'RAIN' : 'CLEAR'}
          progress={weather.rainProbability}
          progressColor="bg-blue-500"
        />

        {/* Ambient Temperature Card */}
        <StatCard
          title="Temperature"
          value={weather.loading ? '--' : weather.temperature}
          unit="°C"
          subtitle={weather.description}
          icon={Thermometer}
          colorScheme="amber"
          badge={`${weather.city}`}
        />

        {/* Humidity Card */}
        <StatCard
          title="Relative Humidity"
          value={weather.loading ? '--' : weather.humidity}
          unit="%"
          subtitle={`Wind: ${weather.windSpeed} m/s`}
          icon={Droplets}
          colorScheme="cyan"
          progress={weather.humidity}
          progressColor="bg-cyan-500"
        />

        {/* Pump Status Card */}
        <StatCard
          title="Irrigation Pump"
          value={pump.isRunning ? 'RUNNING' : 'STANDBY'}
          subtitle={pump.isRunning ? `${pump.activeSession?.elapsedMinutes || 1} min active` : 'Valves Shut'}
          icon={Power}
          colorScheme={pump.isRunning ? 'emerald' : 'purple'}
          badge={pump.isRunning ? 'ACTIVE' : 'IDLE'}
        />
      </div>

      {/* Section 2: Decision Engine & Pump Automation Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left (7 cols): Irrigation Decision Engine Card */}
        <div className={`lg:col-span-7 p-6 sm:p-7 rounded-3xl border transition-all duration-300 flex flex-col justify-between shadow-sm relative overflow-hidden ${
          isIrrigateNeeded
            ? 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white border-emerald-400 shadow-emerald-500/20'
            : 'glass-panel border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                  isIrrigateNeeded
                    ? 'bg-white/20 text-white border border-white/30 backdrop-blur-md'
                    : 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                }`}>
                  Core Decision Engine
                </span>
                <span className="text-[11px] opacity-80">Deterministic Rule: Soil &lt; 35% &amp; Rain &lt; 40%</span>
              </div>
              <button
                onClick={handleReevaluate}
                className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 font-medium ${
                  isIrrigateNeeded
                    ? 'hover:bg-white/20 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
                }`}
                title="Re-run evaluation rule"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Evaluate Now</span>
              </button>
            </div>

            <div className="mt-6 flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                isIrrigateNeeded
                  ? 'bg-white text-emerald-600'
                  : 'bg-blue-50 dark:bg-blue-950 text-blue-600 border border-blue-200 dark:border-blue-800'
              }`}>
                {isIrrigateNeeded ? <CheckCircle2 className="w-8 h-8" /> : <Info className="w-8 h-8" />}
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {isIrrigateNeeded ? 'IRRIGATE NOW' : 'NO IRRIGATION NEEDED'}
                </h2>
                <p className={`mt-2 text-xs sm:text-sm leading-relaxed ${
                  isIrrigateNeeded ? 'text-emerald-50' : 'text-slate-600 dark:text-slate-300'
                }`}>
                  {recommendation.reason}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <span>Evaluated Soil: <strong>{recommendation.soilMoisture || soil.moisture}%</strong></span>
              <span>Predicted Rain: <strong>{recommendation.weatherSnapshot?.rainProbability ?? weather.rainProbability}%</strong></span>
            </div>
            <span className="opacity-75">
              Refreshed: {recommendation.timestamp ? new Date(recommendation.timestamp).toLocaleTimeString() : 'Recent'}
            </span>
          </div>
        </div>

        {/* Right (5 cols): Pump Control Station */}
        <div className="lg:col-span-5 glass-panel p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Power className="w-4 h-4 text-emerald-600" /> Pump Actuator Station
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                pump.isRunning
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {pump.isRunning ? 'ENERGIZED' : 'LOCKED / OFF'}
              </span>
            </div>

            {/* Visual Water Stream Animation Component */}
            <WaterAnimation isRunning={pump.isRunning} flowRate={15} />

            {/* Interlock Safety Warning if pump cannot be turned ON */}
            {!pump.isRunning && !isIrrigateNeeded && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Safety Gate Engaged:</strong> Pump start blocked by system policy. Turning ON is only permitted when Decision Engine determines <em>IRRIGATE NOW</em>.
                </span>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={handleTogglePump}
              disabled={togglingPump || (!pump.isRunning && !isIrrigateNeeded)}
              className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center space-x-2.5 shadow-md transition-all ${
                pump.isRunning
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                  : isIrrigateNeeded
                  ? 'agri-gradient hover:opacity-95 text-white shadow-emerald-500/30'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
              }`}
            >
              <Power className={`w-5 h-5 ${pump.isRunning ? 'animate-pulse' : ''}`} />
              <span>
                {togglingPump
                  ? 'Processing Actuator...'
                  : pump.isRunning
                  ? 'Turn Pump OFF (Halt Irrigation)'
                  : isIrrigateNeeded
                  ? 'Turn Pump ON (Start Hydration)'
                  : 'Pump Locked (Irrigation Not Required)'}
              </span>
            </button>
            <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              Flow Rate: 15 Liters/min • Standard 1 HP Agricultural Drip Motor
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: 7-Day Soil Telemetry Line / Area Chart */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              7-Day Soil Moisture Curve
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Continuous soil telemetry logged to MongoDB with 35% Critical Irrigation Boundary
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Soil Moisture (%)
            </span>
            <span className="flex items-center gap-1.5 text-amber-500">
              <span className="w-3 h-0.5 bg-amber-500"></span> 35% Threshold Line
            </span>
          </div>
        </div>

        <MoistureChart data={chartData} />
      </div>
    </div>
  );
}
