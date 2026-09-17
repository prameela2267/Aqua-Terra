import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, MapPin, Sprout, Shield, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function Profile() {
  const { user, updateUserData } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    city: user?.city || 'Bengaluru',
    cropType: user?.cropType || 'Tomatoes'
  });
  const [status, setStatus] = useState({ error: '', success: '', loading: false });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: '', success: '', loading: true });

    try {
      const res = await api.put('/auth/profile', formData);
      if (res.data.success) {
        updateUserData(res.data.user);
        setStatus({
          error: '',
          success: 'Farm profile & weather region updated successfully!',
          loading: false
        });
      }
    } catch (err) {
      setStatus({
        error: err.response?.data?.error || 'Failed to update profile',
        success: '',
        loading: false
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Farmer & Station Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your field location for meteorological forecasts and telemetry calibration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Account Summary Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl agri-gradient text-white flex items-center justify-center font-extrabold text-3xl shadow-lg shadow-emerald-500/20 uppercase mb-4">
            {user?.name ? user.name[0] : 'U'}
          </div>
          <h2 className="font-bold text-lg text-slate-900 dark:text-white">{user?.name}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user?.email}</p>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Shield className="w-3.5 h-3.5" />
            {user?.role === 'admin' ? 'System Administrator' : 'Certified Farmer'}
          </div>

          <div className="w-full mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-left space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Member Since:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Telemetry Sensor:</span>
              <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">SENSOR-SOIL-01</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Irrigation Mode:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">Decision-Gated</span>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="md:col-span-2 glass-panel p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
            Station Configurations
          </h3>

          {status.error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{status.error}</span>
            </div>
          )}

          {status.success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{status.success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Farmer / Operator Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Registered Email (Read-Only)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Farm City / Weather Station
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Bengaluru, London, Fresno"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Powers live OpenWeatherMap temperature, humidity, and rain predictions.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Crop Type
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="cropType"
                    value={formData.cropType}
                    onChange={handleChange}
                    placeholder="e.g. Organic Tomatoes"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={status.loading}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white agri-gradient hover:opacity-95 shadow-md shadow-emerald-500/20 flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{status.loading ? 'Saving...' : 'Update Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
