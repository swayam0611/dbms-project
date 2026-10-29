import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, Plus, Trash2, CheckCircle2, FileText, 
  Search, Pill, Calendar, Clock, User, AlertTriangle, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { 
  getAppointments, getDiseases, getMedicines, 
  recordConsultation, getConsultationDetails, getPatientAllergies 
} from '../api';

export default function ClinicalView() {
  const [appointments, setAppointments] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter for Patients / Appointments
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Scheduled'); // 'Scheduled' or 'Completed'
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [patientAllergies, setPatientAllergies] = useState([]);

  // Form State
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [diagnoses, setDiagnoses] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [existingConsultation, setExistingConsultation] = useState(null);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [resAppts, resDis, resMeds] = await Promise.all([
        getAppointments(),
        getDiseases(),
        getMedicines()
      ]);
      setAppointments(resAppts.data);
      setDiseases(resDis.data);
      setMedicines(resMeds.data);

      // Default select the first scheduled appointment
      const scheduled = resAppts.data.filter(a => a.status === 'Scheduled');
      if (scheduled.length > 0) {
        handleSelectAppointment(scheduled[0]);
      } else if (resAppts.data.length > 0) {
        handleSelectAppointment(resAppts.data[0]);
      }
    } catch (err) {
      console.error("Failed to load clinical data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSelectAppointment = async (appt) => {
    setSelectedAppt(appt);
    setSuccessMsg('');
    setSymptoms('');
    setNotes('');
    setDiagnoses([]);
    setPrescriptions([]);
    setExistingConsultation(null);

    // Fetch patient allergies
    try {
      const resAl = await getPatientAllergies(appt.patient_id);
      setPatientAllergies(resAl.data);
    } catch {
      setPatientAllergies([]);
    }

    // Check if consultation exists
    try {
      const resC = await getConsultationDetails(appt.appointment_id);
      setExistingConsultation(resC.data);
    } catch {
      setExistingConsultation(null);
    }
  };

  const addDiagnosisRow = () => {
    if (diseases.length > 0) {
      setDiagnoses([...diagnoses, { icd_code: diseases[0].icd_code, severity: 'Moderate', remarks: '' }]);
    }
  };

  const removeDiagnosisRow = (index) => {
    setDiagnoses(diagnoses.filter((_, i) => i !== index));
  };

  const addPrescriptionRow = () => {
    if (medicines.length > 0) {
      setPrescriptions([
        ...prescriptions,
        { medicine_id: medicines[0].medicine_id, dosage: '1 tablet', frequency: 'Twice daily after food', duration: '5 days', instructions: 'Take with warm water' }
      ]);
    }
  };

  const removePrescriptionRow = (index) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      alert("Please enter patient clinical symptoms.");
      return;
    }
    setSubmitting(true);
    try {
      await recordConsultation({
        appointment_id: selectedAppt.appointment_id,
        symptoms,
        clinical_notes: notes,
        diagnoses,
        prescriptions: prescriptions.map(p => ({
          ...p,
          medicine_id: parseInt(p.medicine_id)
        }))
      });
      setSuccessMsg("Consultation and prescriptions saved successfully.");
      // Refresh appointment details
      const resC = await getConsultationDetails(selectedAppt.appointment_id);
      setExistingConsultation(resC.data);
      // Reload appointment list
      const resAppts = await getAppointments();
      setAppointments(resAppts.data);
    } catch (err) {
      alert("Failed to save consultation: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered list of appointments for the search panel
  const filteredAppointments = appointments.filter(a => {
    const matchesSearch = 
      a.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.patient_phone.includes(searchTerm) ||
      a.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.reason_for_visit.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Doctor Consultation & Outpatient Clinic</h1>
        <p className="text-sm text-slate-500 mt-1">Search patient queue, review vitals and allergies, record diagnoses, and issue prescriptions</p>
      </div>

      {/* Main 2-Column Clinical Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Patient Search & Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[750px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search patient name, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 pl-8 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
            </div>

            {/* Status Tabs */}
            <div className="flex rounded-lg bg-slate-200 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter('Scheduled')}
                className={`flex-1 py-1.5 rounded-md transition ${statusFilter === 'Scheduled' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Waiting Queue
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Completed')}
                className={`flex-1 py-1.5 rounded-md transition ${statusFilter === 'Completed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Completed
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('All')}
                className={`flex-1 py-1.5 rounded-md transition ${statusFilter === 'All' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All
              </button>
            </div>
          </div>

          {/* Patient Cards List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-500">Loading clinic schedule...</div>
            ) : filteredAppointments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No patients found matching your search.
              </div>
            ) : (
              filteredAppointments.map((appt) => {
                const isSelected = selectedAppt?.appointment_id === appt.appointment_id;
                const isScheduled = appt.status === 'Scheduled';
                return (
                  <div
                    key={appt.appointment_id}
                    onClick={() => handleSelectAppointment(appt)}
                    className={`p-3 rounded-lg cursor-pointer transition text-xs ${
                      isSelected 
                        ? 'bg-sky-50 border border-sky-300 shadow-sm' 
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{appt.patient_name}</div>
                        <div className="text-[11px] text-slate-500">{appt.patient_phone}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isScheduled ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {appt.status}
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-600 truncate">
                      <span className="font-semibold text-slate-700">Dr. {appt.doctor_name}</span> ({appt.specialisation})
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {appt.appointment_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {appt.appointment_time}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Consultation Room / Patient Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          {selectedAppt ? (
            <>
              {/* Patient Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-sm">
                    {selectedAppt.patient_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-slate-900 text-base">{selectedAppt.patient_name}</h2>
                      <span className="text-xs text-slate-400 font-mono">Appt #{selectedAppt.appointment_id}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Attending: Dr. {selectedAppt.doctor_name} • {selectedAppt.department_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {patientAllergies.length > 0 ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>{patientAllergies.length} Allergy Alert</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
                      No Allergies
                    </span>
                  )}
                </div>
              </div>

              {/* Reason for Visit */}
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Chief Complaint:</span> {selectedAppt.reason_for_visit}
              </div>

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Already Completed Consultation View */}
              {existingConsultation ? (
                <div className="space-y-5 pt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Clinical Findings & Encounter Summary</span>
                    <span className="text-[11px] text-slate-400">Recorded on: {new Date(existingConsultation.consultation_date).toLocaleDateString()}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="font-bold text-slate-700 block mb-1">Symptoms Evaluated:</span>
                      <p className="text-slate-800">{existingConsultation.symptoms}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="font-bold text-slate-700 block mb-1">Doctor Remarks:</span>
                      <p className="text-slate-800">{existingConsultation.clinical_notes || "None noted."}</p>
                    </div>
                  </div>

                  {/* Diagnoses */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Confirmed Diagnoses</h3>
                    <div className="space-y-2">
                      {existingConsultation.diagnoses.map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs">
                          <div>
                            <span className="font-mono font-bold text-sky-700 mr-2">[{d.icd_code}]</span>
                            <span className="font-semibold text-slate-900">{d.disease_name}</span>
                            {d.remarks && <span className="text-slate-500 ml-2">— {d.remarks}</span>}
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                            {d.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prescriptions */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Issued Prescriptions</h3>
                    <div className="space-y-2">
                      {existingConsultation.prescriptions.map((p, i) => (
                        <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Pill className="w-4 h-4 text-sky-600" />
                            <span className="font-bold text-slate-900">{p.medicine_name} ({p.strength})</span>
                            <span className="text-slate-500">• {p.dosage} • {p.frequency} • {p.duration}</span>
                          </div>
                          <span className="text-slate-400 italic text-[11px]">{p.instructions}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Active Consultation Entry Form */
                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Symptoms & Presentation *</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="e.g. Acute chest discomfort on exertion, fatigue for 4 days..."
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Physician Clinical Remarks</label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Heart sounds normal, BP 130/85 mmHg, advised ECG..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  {/* Diagnoses Section */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Clinical Diagnoses</span>
                      <button
                        type="button"
                        onClick={addDiagnosisRow}
                        className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Diagnosis
                      </button>
                    </div>

                    <div className="space-y-2">
                      {diagnoses.map((diag, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <select
                            value={diag.icd_code}
                            onChange={(e) => {
                              const updated = [...diagnoses];
                              updated[idx].icd_code = e.target.value;
                              setDiagnoses(updated);
                            }}
                            className="text-xs rounded border border-slate-300 p-2 flex-1"
                          >
                            {diseases.map((d) => (
                              <option key={d.icd_code} value={d.icd_code}>[{d.icd_code}] {d.disease_name} ({d.category})</option>
                            ))}
                          </select>

                          <select
                            value={diag.severity}
                            onChange={(e) => {
                              const updated = [...diagnoses];
                              updated[idx].severity = e.target.value;
                              setDiagnoses(updated);
                            }}
                            className="text-xs rounded border border-slate-300 p-2 w-32"
                          >
                            <option value="Mild">Mild</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Severe">Severe</option>
                            <option value="Critical">Critical</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => removeDiagnosisRow(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prescriptions Section */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Prescription Pad</span>
                      <button
                        type="button"
                        onClick={addPrescriptionRow}
                        className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Medicine
                      </button>
                    </div>

                    <div className="space-y-2">
                      {prescriptions.map((rx, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg items-center">
                          <div className="sm:col-span-2">
                            <select
                              value={rx.medicine_id}
                              onChange={(e) => {
                                const updated = [...prescriptions];
                                updated[idx].medicine_id = e.target.value;
                                setPrescriptions(updated);
                              }}
                              className="w-full text-xs rounded border border-slate-300 p-2"
                            >
                              {medicines.map((m) => (
                                <option key={m.medicine_id} value={m.medicine_id}>{m.name} ({m.strength}) - ₹{m.unit_price}</option>
                              ))}
                            </select>
                          </div>
                          <input
                            type="text"
                            placeholder="Dosage (e.g. 1 tab)"
                            value={rx.dosage}
                            onChange={(e) => {
                              const updated = [...prescriptions];
                              updated[idx].dosage = e.target.value;
                              setPrescriptions(updated);
                            }}
                            className="text-xs rounded border border-slate-300 p-2"
                          />
                          <input
                            type="text"
                            placeholder="Frequency"
                            value={rx.frequency}
                            onChange={(e) => {
                              const updated = [...prescriptions];
                              updated[idx].frequency = e.target.value;
                              setPrescriptions(updated);
                            }}
                            className="text-xs rounded border border-slate-300 p-2"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Duration"
                              value={rx.duration}
                              onChange={(e) => {
                                const updated = [...prescriptions];
                                updated[idx].duration = e.target.value;
                                setPrescriptions(updated);
                              }}
                              className="w-full text-xs rounded border border-slate-300 p-2"
                            />
                            <button
                              type="button"
                              onClick={() => removePrescriptionRow(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg shadow-sm transition disabled:opacity-60"
                    >
                      {submitting ? "Saving Encounter..." : "Complete Consultation & Save"}
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select a patient from the queue on the left to begin consultation.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
