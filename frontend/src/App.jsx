import React, { useState } from 'react';
import { 
  LayoutDashboard, Calendar, BedDouble, Stethoscope, 
  Users, UserCheck, Pill, Receipt, Database, CheckCircle2 
} from 'lucide-react';

import DashboardView from './pages/DashboardView';
import AppointmentsView from './pages/AppointmentsView';
import BedsWardView from './pages/BedsWardView';
import ClinicalView from './pages/ClinicalView';
import PatientsView from './pages/PatientsView';
import DoctorsView from './pages/DoctorsView';
import PharmacyView from './pages/PharmacyView';
import BillingView from './pages/BillingView';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', name: 'Appointments', icon: Calendar },
    { id: 'beds', name: 'Beds & Wards', icon: BedDouble },
    { id: 'clinical', name: 'Consultations', icon: Stethoscope },
    { id: 'patients', name: 'Patients', icon: Users },
    { id: 'doctors', name: 'Doctors & Staff', icon: UserCheck },
    { id: 'pharmacy', name: 'Pharmacy Stock', icon: Pill },
    { id: 'billing', name: 'Billing & Ledger', icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 flex flex-col justify-between">
        <div>
          {/* Logo / Brand */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center font-black text-white shadow-lg">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white">APEX HOSPITAL</h1>
              <p className="text-[11px] text-sky-400 font-medium tracking-tight">DBMS 3NF Project</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive 
                      ? 'bg-sky-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Database Status footer */}
        <div className="p-4 m-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>MySQL 9.0 (InnoDB)</span>
          </div>
          <p className="text-[11px] text-slate-400">Strict 3NF Schema with ACID Concurrency & Row Locks</p>
          <a 
            href="http://localhost:8000/docs" 
            target="_blank" 
            rel="noreferrer"
            className="mt-2 block text-center py-1 bg-slate-700 hover:bg-slate-600 rounded text-[11px] font-semibold text-sky-300 transition"
          >
            Swagger API Docs ↗
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <DashboardView onNavigate={(tab) => setActiveTab(tab)} />}
          {activeTab === 'appointments' && <AppointmentsView />}
          {activeTab === 'beds' && <BedsWardView />}
          {activeTab === 'clinical' && <ClinicalView />}
          {activeTab === 'patients' && <PatientsView />}
          {activeTab === 'doctors' && <DoctorsView />}
          {activeTab === 'pharmacy' && <PharmacyView />}
          {activeTab === 'billing' && <BillingView />}
        </div>
      </main>
    </div>
  );
}
