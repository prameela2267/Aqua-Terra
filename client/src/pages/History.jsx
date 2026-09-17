import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  History as HistoryIcon,
  Calendar,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Sprout,
  CloudSun,
  Power,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function History() {
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [category, setCategory] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchHistory = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        category: category !== 'ALL' ? category : undefined,
        from: fromDate || undefined,
        to: toDate || undefined
      };

      const res = await api.get('/history', { params });
      if (res.data.success) {
        setEntries(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('[History Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  }, [category, fromDate, toDate]);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchHistory(newPage);
    }
  };

  const handleExportCSV = () => {
    if (!entries || entries.length === 0) return;
    const headers = ['Timestamp', 'Type', 'Summary', 'Details'];
    const rows = entries.map(e => [
      new Date(e.timestamp).toISOString(),
      e.type,
      JSON.stringify(e.details).replace(/"/g, '""')
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `telemetry_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = [
    { id: 'ALL', label: 'All Records' },
    { id: 'SOIL', label: 'Soil Readings' },
    { id: 'WEATHER', label: 'Weather Logs' },
    { id: 'RECOMMENDATION', label: 'Decisions' },
    { id: 'PUMP', label: 'Pump Sessions' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <HistoryIcon className="w-7 h-7 text-emerald-600" /> Unified Historical Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Chronological audit trail of environmental observations, decision outputs, and pump actuations
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold glass-panel border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Download className="w-4 h-4 text-emerald-600" /> Export CSV
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                category === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Date Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setFromDate(''); setToDate(''); }}
              className="px-3 py-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium"
            >
              Reset Dates
            </button>
            <button
              onClick={() => fetchHistory(1)}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* Log Records Table */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-4">Primary Value</th>
                <th className="py-3.5 px-4">Detailed Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                    Loading historical telemetry...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                    No log records match your filter criteria.
                  </td>
                </tr>
              ) : (
                entries.map((entry, idx) => {
                  const date = new Date(entry.timestamp);

                  // Type badge config
                  let badge = { label: entry.type, color: 'bg-slate-100 text-slate-800', icon: HistoryIcon };
                  let primaryVal = '--';
                  let contextVal = '';

                  if (entry.type === 'SOIL') {
                    badge = { label: 'SOIL TELEMETRY', color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300', icon: Sprout };
                    primaryVal = `${entry.details.moisturePercent}% Moisture`;
                    contextVal = `Sensor: ${entry.details.sensorId || 'SENSOR-SOIL-01'} • Source: ${entry.details.source}`;
                  } else if (entry.type === 'WEATHER') {
                    badge = { label: 'WEATHER SNAPSHOT', color: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300', icon: CloudSun };
                    primaryVal = `${entry.details.temperature}°C • ${entry.details.humidity}% RH`;
                    contextVal = `Rain Prob: ${entry.details.rainProbability}% • ${entry.details.description} • City: ${entry.details.city || 'Bengaluru'}`;
                  } else if (entry.type === 'RECOMMENDATION') {
                    const isIrr = entry.details.decision === 'IRRIGATE_NOW';
                    badge = {
                      label: isIrr ? 'IRRIGATE_NOW' : 'NO_IRRIGATION',
                      color: isIrr
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-400 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
                      icon: isIrr ? CheckCircle : AlertCircle
                    };
                    primaryVal = entry.details.decision;
                    contextVal = entry.details.reason;
                  } else if (entry.type === 'PUMP') {
                    badge = { label: 'PUMP CYCLE', color: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-300', icon: Power };
                    primaryVal = `${entry.details.durationMinutes || 0} mins runtime`;
                    contextVal = `Water dispensed: ${entry.details.estimatedWaterUsedLiters || 0} L • Trigger: ${entry.details.triggerType}`;
                  }

                  const Icon = badge.icon;

                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 sm:px-6 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {date.toLocaleDateString()} {date.toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                          <Icon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {primaryVal}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs sm:max-w-md truncate">
                        {contextVal}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total records)
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
