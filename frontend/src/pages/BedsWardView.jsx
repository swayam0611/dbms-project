import React, { useState, useEffect } from 'react';
import { 
  BedDouble, Filter, Plus, LogOut, CheckCircle, 
  AlertCircle, ShieldCheck, RefreshCw, Layers 
} from 'lucide-react';
import { 
  getBeds, getWards, getAdmissions, 
  getPatients, admitPatient, dischargePatient 
} from '../api';

export default function BedsWardView() {
  const [beds, setBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [targetBed, setTargetBed] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [admitError, setAdmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [dischargeAdmission, setDischargeAdmission] = useState(null);
  const [dischargeSummary, setDischargeSummary] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedWard) params.ward_id = selectedWard;
      if (selectedStatus) params.status = selectedStatus;

      const [resBeds, resWards, resAdm, resPats] = await Promise.all([
        getBeds(params),
        getWards(),
        getAdmissions({ status: 'Admitted' }),
        getPatients({ limit: 100 })
      ]);
      setBeds(resBeds.data);
      setWards(resWards.data);
      setAdmissions(resAdm.data);
      setPatients(resPats.data);
    } catch (err) {
      console.error("Failed to load bed inventory", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedWard, selectedStatus]);

  const handleOpenAdmit = (bed) => {
    setTargetBed(bed);
    setSelectedPatientId('');
    setAdmitError('');
    setShowAdmitModal(true);
  };

  const handleAdmitSubmit = async (e) => {
    e.preventDefault();
    setAdmitError('');
    setSubmitting(true);
    try {
      await admitPatient({
        patient_id: parseInt(selectedPatientId),
        bed_id: targetBed.bed_id
      });
      setShowAdmitModal(false);
      loadData();
    } catch (err) {
      setAdmitError(err.response?.data?.detail || "Admission failed due to a concurrency conflict.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDischarge = (bedId) => {
    const adm = admissions.find((a) => a.bed_id === bedId);
    if (!adm) {
      alert("No active admission record found for this bed.");
      return;
    }
    setDischargeAdmission(adm);
    setDischargeSummary("Patient condition improved and stabilized. Recommended discharge with follow-up after 10 days.");
    setShowDischargeModal(true);
  };

  const handleDischargeSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await dischargePatient(dischargeAdmission.admission_id, {
        discharge_summary: dischargeSummary
      });
      setShowDischargeModal(false);
      loadData();
    } catch (err) {
      alert("Discharge failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const availableCount = beds.filter((b) => b.status === 'Available').length;
  const occupiedCount = beds.filter((b) => b.status === 'Occupied').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ward & Bed Management</h1>
          <p className="text-sm text-slate-500 mt-1">Live inpatient occupancy with row-level locked allocation</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {availableCount} Available
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            {occupiedCount} Occupied
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-semibold uppercase text-slate-500">Ward Filter:</span>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="text-sm rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Hospital Wards</option>
              {wards.map((w) => (
                <option key={w.ward_id} value={w.ward_id}>{w.name} ({w.type})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-slate-500">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-sm rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available Only</option>
              <option value="Occupied">Occupied Only</option>
            </select>
          </div>
        </div>

        <button 
          onClick={loadData}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Grid
        </button>
      </div>

      {/* Bed Grid Display */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading live bed occupancy grid...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {beds.map((bed) => {
            const isAvail = bed.status === 'Available';
            const isOccupied = bed.status === 'Occupied';
            const currentAdm = admissions.find((a) => a.bed_id === bed.bed_id);

            return (
              <div 
                key={bed.bed_id} 
                className={`p-4 rounded-xl border bg-white shadow-sm flex flex-col justify-between transition ${
                  isAvail ? 'border-emerald-200 hover:border-emerald-400' :
                  isOccupied ? 'border-rose-200 hover:border-rose-300' :
                  'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {bed.bed_number}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isAvail ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {bed.status}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-900 truncate">{bed.ward_name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Room {bed.room_number} • Floor {bed.floor}</p>
                  <p className="text-[11px] text-slate-400 italic mt-0.5">{bed.bed_type}</p>

                  {isOccupied && currentAdm && (
                    <div className="mt-3 p-2 bg-rose-50/70 border border-rose-100 rounded-lg text-xs">
                      <p className="font-semibold text-rose-950 truncate">Patient: {currentAdm.patient_name}</p>
                      <p className="text-[10px] text-rose-600 mt-0.5">Admitted: {new Date(currentAdm.admit_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  {isAvail ? (
                    <button
                      onClick={() => handleOpenAdmit(bed)}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                    >
                      Assign Patient
                    </button>
                  ) : isOccupied ? (
                    <button
                      onClick={() => handleOpenDischarge(bed.bed_id)}
                      className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-rose-700 rounded-lg text-xs font-semibold transition"
                    >
                      Discharge & Free
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 block text-center">Maintenance</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admit Patient Modal */}
      {showAdmitModal && targetBed && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in">
            <h2 className="text-lg font-bold text-slate-900">Admit Patient to Bed</h2>
            <div className="my-2 p-3 bg-sky-50 rounded-lg text-xs text-sky-800 border border-sky-100">
              <span className="font-semibold">{targetBed.bed_number}</span> ({targetBed.ward_name}, Room {targetBed.room_number})
            </div>

            {admitError && (
              <div className="my-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{admitError}</span>
              </div>
            )}

            <form onSubmit={handleAdmitSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>{p.name} ({p.blood_group}) - {p.phone}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Bed Allocation Notice:</span>
                <p className="mt-0.5 text-slate-500">Upon confirmation, the patient will be assigned and the bed status will be updated to Occupied across all terminals.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdmitModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow disabled:opacity-60"
                >
                  {submitting ? "Admitting..." : "Confirm Admission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discharge Patient Modal */}
      {showDischargeModal && dischargeAdmission && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in">
            <h2 className="text-lg font-bold text-slate-900">Discharge Patient & Release Bed</h2>
            <p className="text-xs text-slate-500 mt-1">Patient: <span className="font-semibold text-slate-800">{dischargeAdmission.patient_name}</span></p>

            <form onSubmit={handleDischargeSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Discharge Summary & Instructions *</label>
                <textarea
                  required
                  rows={4}
                  value={dischargeSummary}
                  onChange={(e) => setDischargeSummary(e.target.value)}
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDischargeModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow disabled:opacity-60"
                >
                  {submitting ? "Processing..." : "Complete Discharge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
