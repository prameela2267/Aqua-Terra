import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Droplets,
  LayoutDashboard,
  History,
  BarChart3,
  ShieldCheck,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Bell,
  AlertTriangle,
  CloudRain,
  Activity
} from 'lucide-react';
import api from '../../services/api';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);

  // Fetch quick telemetry alerts for notification dropdown
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkAlerts = async () => {
      try {
        const [soilRes, weatherRes, pumpRes] = await Promise.all([
          api.get('/telemetry/soil/latest').catch(() => null),
          api.get('/telemetry/weather').catch(() => null),
          api.get('/pump/status').catch(() => null)
        ]);

        const newAlerts = [];
        if (soilRes?.data?.latest?.moisturePercent < 35) {
          newAlerts.push({
            id: 'soil-low',
            type: 'warning',
            title: 'Critical Soil Moisture',
            message: `Current moisture is ${soilRes.data.latest.moisturePercent}% (below 35% threshold).`,
            icon: AlertTriangle
          });
        }
        if (weatherRes?.data?.weather?.rainProbability >= 40) {
          newAlerts.push({
            id: 'rain-high',
            type: 'info',
            title: 'Rain Expected Ahead',
            message: `Rain probability is ${weatherRes.data.weather.rainProbability}%. Natural precipitation likely.`,
            icon: CloudRain
          });
        }
        if (pumpRes?.data?.isRunning) {
          newAlerts.push({
            id: 'pump-on',
            type: 'success',
            title: 'Irrigation Pump Active',
            message: `Pump is running. Elapsed: ${pumpRes.data.activeSession?.elapsedMinutes || 1} min.`,
            icon: Activity
          });
        }
        setAlerts(newAlerts);
      } catch (err) {
        // silent catch
      }
    };

    checkAlerts();
    const alertInterval = setInterval(checkAlerts, 15000);
    return () => clearInterval(alertInterval);
  }, [isAuthenticated, location.pathname]);

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'History', path: '/history', icon: History },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    ...(isAdmin ? [{ name: 'Admin Panel', path: '/admin', icon: ShieldCheck }] : [])
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Branding */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl agri-gradient flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <Droplets className="w-5 h-5 animate-pulse-slow" />
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                Aqua<span className="text-emerald-600 dark:text-emerald-400">Terra</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Smart IoT
                </span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-sm border border-emerald-200/60 dark:border-emerald-800/60'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Action Icons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* In-App Notifications Dropdown */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {alerts.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-xl glass-panel border border-slate-200 dark:border-slate-800 p-4 z-50">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" /> System Alerts & Telemetry
                      </h4>
                      <span className="text-xs font-medium text-slate-400">
                        {alerts.length} active
                      </span>
                    </div>

                    <div className="mt-3 space-y-2.5 max-h-64 overflow-y-auto">
                      {alerts.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">
                          🌱 All systems nominal. Soil moisture and weather in balance.
                        </div>
                      ) : (
                        alerts.map((alert) => {
                          const Icon = alert.icon;
                          const colorClasses =
                            alert.type === 'warning'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : alert.type === 'info'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';

                          return (
                            <div
                              key={alert.id}
                              className={`p-3 rounded-xl border text-xs flex items-start space-x-3 ${colorClasses}`}
                            >
                              <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                              <div>
                                <p className="font-bold">{alert.title}</p>
                                <p className="mt-0.5 opacity-90 leading-relaxed">{alert.message}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile / Logout */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                    {user?.name ? user.name[0] : 'U'}
                  </div>
                  <span className="hidden sm:inline-block max-w-[100px] truncate">{user?.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            {isAuthenticated && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isAuthenticated && mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    active
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
