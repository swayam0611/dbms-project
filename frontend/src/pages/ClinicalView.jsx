import React, { useState, useEffect } from 'react';
import { Stethoscope, Plus, Trash2, CheckCircle2, FileText, Search, Pill, ShieldCheck } from 'lucide-react';
import { getAppointments, getDiseases, getMedicines, recordConsultation, getConsultationDetails } from '../api';

export default function ClinicalView() {
  const [appointments, setAppointments] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [selectedApptId, setSelectedApptId] = useState('');
  const [loading, setLoading] = useState(true);

  // Form
  const [symptoms, setSymptoms] = useState('');
  const [notes, setNotes] = useState('');
  const [diagnoses, setDiagnoses] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Past consultation review
  const [existingConsultation, setExistingConsultation] = useState(null);

  const loadData = async () => {
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
      if (resAppts.data.length > 0) {
        setSelectedApptId(resAppts.data[0].appointment_id);
      }
    } catch (err) {
      console.error("Failed to load clinical data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedApptId) {
      setSuccessMsg('');
      checkConsultation(selectedApptId);
    }
  }, [selectedApptId]);

  const checkConsultation = async (apptId) => {
    try {
      const res = await getConsultationDetails(apptId);
      setExistingConsultation(res.data);
    } catch {
      setExistingConsultation(null);
      setSymptoms('');
      setNotes('');
      setDiagnoses([]);
      setPrescriptions([]);
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
    if (!symptoms) {
      alert("Please enter patient symptoms.");
      return;
    }
    setSubmitting(true);
    try {
      await recordConsultation({
        appointment_id: parseInt(selectedApptId),
        symptoms,
        clinical_notes: notes,
        diagnoses,
        prescriptions: prescriptions.map((p) => ({
          ...p,
          medicine_id: parseInt(p.medicine_id)
        }))
      });
      setSuccessMsg("Consultation, Diagnoses, and Prescriptions saved atomically!");
      checkConsultation(selectedApptId);
    } catch (err) {
      alert("Error recording consultation: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const currentAppt = appointments.find((a) => a.appointment_id === parseInt(selectedApptId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Doctor Consultation & Clinical Portal</h1>
        <p className="text-sm text-slate-500 mt-1">3NF Normalized Clinical Encounter with ICD-10 Master & Electronic Prescription</p>
      </div>

      {/* Appointment Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Stethoscope className="w-5 h-5 text-sky-600 shrink-0" />
          <div className="w-full">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Consultation Encounter:</label>
            <select
              value={selectedApptId}
              onChange={(e) => setSelectedApptId(e.target.value)}
              className="w-full text-sm rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500"
            >
              {appointments.map((a) => (
                <option key={a.appointment_id} value={a.appointment_id}>
                  #{a.appointment_id} — {a.patient_name} with {a.doctor_name} ({a.appointment_date} {a.appointment_time}) [{a.status}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentAppt && (
          <div className="text-right text-xs text-slate-500 shrink-0">
            <span className="font-semibold text-slate-800">Reason:</span> {currentAppt.reason_for_visit}
          </div>
        )}
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* If already recorded, show read-only encounter */}
      {existingConsultation ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-slate-900 text-base">Recorded Consultation Summary</h2>
            </div>
            <span className="text-xs text-slate-500">
              Encounter Date: {new Date(existingConsultation.consultation_date).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Symptoms Presented:</span>
              <p className="text-sm text-slate-800 mt-1 font-medium">{existingConsultation.symptoms}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor Clinical Notes:</span>
              <p className="text-sm text-slate-800 mt-1">{existingConsultation.clinical_notes || "None noted."}</p>
            </div>
          </div>

          {/* Diagnoses List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Diagnoses (ICD-10 Master Linked)</h3>
            <div className="space-y-2">
              {existingConsultation.diagnoses.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg text-xs">
                  <div>
                    <span className="font-mono font-bold text-sky-700 mr-2">[{d.icd_code}]</span>
                    <span className="font-semibold text-slate-900">{d.disease_name}</span>
                    {d.remarks && <span className="text-slate-500 ml-2">— {d.remarks}</span>}
                  </div>
                  <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-rose-50 text-rose-700">
                    {d.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Prescriptions List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Prescribed Medication (Surrogate Item PK)</h3>
            <div className="space-y-2">
              {existingConsultation.prescriptions.map((p, i) => (
                <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-sky-600" />
                    <span className="font-bold text-slate-900">{p.medicine_name} ({p.strength})</span>
                    <span className="text-slate-500">• {p.dosage} • {p.frequency} • {p.duration}</span>
                  </div>
                  <span className="text-slate-400 italic">{p.instructions}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Consultation Form */
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            New Clinical Encounter
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reported Symptoms *</label>
              <textarea
                required
                rows={3}
                placeholder="Chief complaints, onset, duration..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Remarks & Findings</label>
              <textarea
                rows={3}
                placeholder="Physical examination notes, lab observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Diagnoses Section */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">ICD-10 Diagnoses</h3>
                <p className="text-[11px] text-slate-400">Eliminates disease name redundancy (3NF)</p>
              </div>
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
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Prescription Pad</h3>
                <p className="text-[11px] text-slate-400">Generates items with surrogate PK and triggers atomic inventory deduction</p>
              </div>
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
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg items-center">
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

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Atomic Transaction guarantees consistent billing & pharmacy stock deduction.
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-lg shadow disabled:opacity-60 transition"
            >
              {submitting ? "Processing Transaction..." : "Save Encounter"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
