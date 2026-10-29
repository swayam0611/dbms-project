import React, { useState } from 'react';
import { 
  LayoutDashboard, Calendar, BedDouble, Stethoscope, 
  Users, UserCheck, Pill, Receipt, Activity, ShoppingCart, 
  FileText, Building2, ChevronDown, ChevronRight, CheckCircle2 
} from 'lucide-react';

import DashboardView from './pages/DashboardView';
import AppointmentsView from './pages/AppointmentsView';
import BedsWardView from './pages/BedsWardView';
import ClinicalView from './pages/ClinicalView';
import PatientsView from './pages/PatientsView';
import DoctorsView from './pages/DoctorsView';
import PharmacyView from './pages/PharmacyView';
import PharmacyPOSView from './pages/PharmacyPOSView';
import PharmacySalesView from './pages/PharmacySalesView';
import BillingView from './pages/BillingView';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hospitalOpen, setHospitalOpen] = useState(true);
  const [pharmaOpen, setPharmaOpen] = useState(true);

  const hospitalNav = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', name: 'Appointments & OPD', icon: Calendar },
    { id: 'clinical', name: 'Doctor Consultations', icon: Stethoscope },
    { id: 'beds', name: 'Inpatient & Beds', icon: BedDouble },
    { id: 'patients', name: 'Patient Directory', icon: Users },
    { id: 'doctors', name: 'Doctors & Specialists', icon: UserCheck },
    { id: 'billing', name: 'Hospital Invoicing', icon: Receipt },
  ];

  const pharmaNav = [
    { id: 'pharmacy_pos', name: 'Dispense & Billing', icon: ShoppingCart },
    { id: 'pharmacy', name: 'Stock & Formulary', icon: Pill },
    { id: 'pharmacy_sales', name: 'Pharmacy Sales', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 flex flex-col justify-between select-none">
        <div>
          {/* Logo / Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center font-bold text-white shadow-md">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white">HEALTHCARE OS</h1>
              <p className="text-[11px] text-slate-400 font-medium">Hospital & Pharmacy Suite</p>
            </div>
          </div>

          <div className="p-3 space-y-4">
            {/* PARTITION 1: HOSPITAL OPERATIONS */}
            <div>
              <button
                type="button"
                onClick={() => setHospitalOpen(!hospitalOpen)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition"
              >
                <span>Hospital Operations</span>
                {hospitalOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {hospitalOpen && (
                <nav className="mt-1 space-y-0.5">
                  {hospitalNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                          isActive 
                            ? 'bg-sky-600 text-white font-semibold shadow-sm' 
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </button>
                    );
                  })}
                </nav>
              )}
            </div>

            {/* PARTITION 2: PHARMACY & DISPENSARY */}
            <div>
              <button
                type="button"
                onClick={() => setPharmaOpen(!pharmaOpen)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition"
              >
                <span>Pharmacy & Dispensary</span>
                {pharmaOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {pharmaOpen && (
                <nav className="mt-1 space-y-0.5">
                  {pharmaNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                          isActive 
                            ? 'bg-emerald-600 text-white font-semibold shadow-sm' 
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </button>
                    );
                  })}
                </nav>
              )}
            </div>
          </div>
        </div>

        {/* System Status Footer */}
        <div className="p-4 m-3 bg-slate-800/60 rounded-xl border border-slate-700/50 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-medium mb-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Hospital Services Online</span>
          </div>
          <p className="text-[11px] text-slate-400">All wards, OPD clinics, and dispensary terminals active</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <DashboardView onNavigate={(tab) => setActiveTab(tab)} />}
          {activeTab === 'appointments' && <AppointmentsView />}
          {activeTab === 'clinical' && <ClinicalView />}
          {activeTab === 'beds' && <BedsWardView />}
          {activeTab === 'patients' && <PatientsView />}
          {activeTab === 'doctors' && <DoctorsView />}
          {activeTab === 'billing' && <BillingView />}
          {activeTab === 'pharmacy_pos' && <PharmacyPOSView />}
          {activeTab === 'pharmacy' && <PharmacyView />}
          {activeTab === 'pharmacy_sales' && <PharmacySalesView />}
        </div>
      </main>
    </div>
  );
}
