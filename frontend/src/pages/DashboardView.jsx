import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, BedDouble, Calendar, 
  AlertTriangle, DollarSign, Activity, CheckCircle2, RefreshCw
} from 'lucide-react';
import { getDashboardStats, getDeptDistribution } from '../api';

export default function DashboardView({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [deptDist, setDeptDist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resStats, resDist] = await Promise.all([
        getDashboardStats(),
        getDeptDistribution()
      ]);
      setStats(resStats.data);
      setDeptDist(resDist.data);
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-600" />
        <span className="ml-3 text-slate-600 font-medium">Loading hospital metrics...</span>
      </div>
    );
  }

  const statCards = [
    { label: 'Registered Patients', val: stats.total_patients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', nav: 'patients' },
    { label: 'Active Doctors', val: stats.total_doctors, icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', nav: 'doctors' },
    { label: 'Bed Occupancy', val: `${stats.bed_occupancy_rate}%`, sub: `${stats.occupied_beds} / ${stats.total_beds} beds`, icon: BedDouble, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', nav: 'beds' },
    { label: 'Scheduled Today', val: stats.scheduled_appointments, sub: `${stats.completed_appointments} completed`, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', nav: 'appointments' },
    { label: 'Low Stock Medicines', val: stats.low_stock_medicines, sub: 'Needs restocking', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', nav: 'pharmacy' },
    { label: 'Revenue Collected', val: `₹${stats.total_revenue_collected.toLocaleString()}`, sub: `₹${stats.pending_revenue.toLocaleString()} pending`, icon: DollarSign, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', nav: 'billing' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospital Administration Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Live metrics, inpatient capacity, OPD schedules, and pharmacy inventory</p>
        </div>
        <button 
          onClick={fetchData} 
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div 
              key={i} 
              onClick={() => onNavigate && onNavigate(card.nav)}
              className={`p-5 rounded-xl border bg-white ${card.border} shadow-sm hover:shadow-md cursor-pointer transition flex items-center justify-between`}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{card.val}</p>
                {card.sub && <p className="text-xs text-slate-500 mt-0.5">{card.sub}</p>}
              </div>
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Department Doctor Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-600" />
              Specialist Distribution by Department
            </h3>
            <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded">20 Active Specialities</span>
          </div>
          <div className="space-y-3">
            {deptDist.slice(0, 7).map((d, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 font-medium">{d.department}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-sky-500 h-full rounded-full" 
                      style={{ width: `${Math.min(100, (d.count / 3) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 w-8 text-right">{d.count} doc{d.count > 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DBMS System Integrity & ACID Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              DBMS 3NF & ACID Concurrency Guarantees
            </h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-800">3NF Decomposition:</span>
                <p className="text-xs text-slate-500 mt-0.5">Address components factored via Pincode master ($Pincode \to City, State$); ICD-10 disease dictionary removes disease name redundancy from diagnosis.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-800">Pessimistic Row Locking:</span>
                <p className="text-xs text-slate-500 mt-0.5"><code className="text-sky-700 font-mono">SELECT ... FOR UPDATE</code> enforces atomic bed assignments and eliminates race conditions in concurrent admissions.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-800">Connection Pooling:</span>
                <p className="text-xs text-slate-500 mt-0.5">SQLAlchemy QueuePool (size: 10, overflow: 20, recycle: 1800s) prevents MySQL connection exhaustion during high concurrent load.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
