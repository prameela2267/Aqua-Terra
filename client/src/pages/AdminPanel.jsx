import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  ShieldCheck,
  Users,
  FileText,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  AlertCircle,
  RefreshCw,
  Search
} from 'lucide-react';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUserHistory, setSelectedUserHistory] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Date filters for PDF generation
  const [reportFrom, setReportFrom] = useState('');
  const [reportTo, setReportTo] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to load user roster.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId, currentName) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/status`);
      if (res.data.success) {
        setStatusMessage({ type: 'success', text: res.data.message });
        fetchUsers();
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || 'Status toggle failed.'
      });
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently delete farmer "${userName}" and all associated telemetry?`)) {
      return;
    }

    try {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.data.success) {
        setStatusMessage({ type: 'success', text: res.data.message });
        fetchUsers();
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || 'Deletion failed.'
      });
    }
  };

  const handleViewHistory = async (userId) => {
    try {
      const res = await api.get(`/admin/users/${userId}/history`);
      if (res.data.success) {
        setSelectedUserHistory(res.data);
        setHistoryModalOpen(true);
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Could not fetch user history.' });
    }
  };

  const handleDownloadPdf = async (userId, userName) => {
    setGeneratingPdf(userId);
    try {
      const params = {};
      if (reportFrom) params.from = reportFrom;
      if (reportTo) params.to = reportTo;

      const res = await api.get(`/reports/${userId}`, {
        params,
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Smart_Irrigation_Report_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setStatusMessage({
        type: 'success',
        text: `PDF audit report for ${userName} generated and downloaded!`
      });
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'PDF report generation failed.' });
    } finally {
      setGeneratingPdf(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.city && u.city.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-emerald-600" /> Administrative Operations Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
              Admin Access
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global farmer roster oversight, telemetry audits, account controls, and certified PDF report exports
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold glass-panel border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Roster
        </button>
      </div>

      {/* Notification Banner */}
      {statusMessage.text && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xs ${
            statusMessage.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage({ type: '', text: '' })}>✕</button>
        </div>
      )}

      {/* Roster & Search Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>Total Registered: <strong>{users.length}</strong></span>
            <span>Active Farmers: <strong>{users.filter(u => u.role === 'farmer' && u.isActive).length}</strong></span>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Station City</th>
                <th className="py-3 px-4">Readings / Pumps</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {u.city || 'Bengaluru'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {u.stats?.readingsCount || 0}
                      </span> readings •{' '}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {u.stats?.pumpSessionsCount || 0}
                      </span> pumps
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(u._id, u.name)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300'
                        }`}
                      >
                        {u.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* View History Button */}
                      <button
                        onClick={() => handleViewHistory(u._id)}
                        className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="View Telemetry History"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Download PDF Button */}
                      <button
                        onClick={() => handleDownloadPdf(u._id, u.name)}
                        disabled={generatingPdf === u._id}
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-50"
                        title="Download PDF Audit Report"
                      >
                        <Download className={`w-4 h-4 ${generatingPdf === u._id ? 'animate-bounce' : ''}`} />
                      </button>

                      {/* Delete User Button */}
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u._id, u.name)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Inspection Modal */}
      {historyModalOpen && selectedUserHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-3xl max-h-[85vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Telemetry Audit: {selectedUserHistory.user?.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedUserHistory.user?.email} • Station: {selectedUserHistory.user?.city}
                </p>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Recent Soil Moisture Readings ({selectedUserHistory.history?.soilReadings?.length || 0})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {selectedUserHistory.history?.soilReadings?.slice(0, 8).map((r, i) => (
                    <div key={i} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">{r.moisturePercent}%</p>
                      <p className="text-[10px] text-slate-400">{new Date(r.timestamp).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                  Completed Pump Actuations ({selectedUserHistory.history?.pumpLogs?.length || 0})
                </h4>
                <div className="space-y-1.5">
                  {selectedUserHistory.history?.pumpLogs?.slice(0, 5).map((p, i) => (
                    <div key={i} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 flex items-center justify-between">
                      <span>Started: {new Date(p.startedAt).toLocaleString()}</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">{p.durationMinutes} min ({p.estimatedWaterUsedLiters} L)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
