import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, UserPlus, Phone, Mail, AlertTriangle, ShieldCheck, MapPin, X } from 'lucide-react';
import { getPatients, createPatient, getPincodes, getPatientAllergies } from '../api';

export default function PatientsView() {
  const [patients, setPatients] = useState([]);
  const [pincodes, setPincodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedBlood, setSelectedBlood] = useState('');

  // Patient registration modal
  const [showModal, setShowModal] = useState(false);
  const [regData, setRegData] = useState({
    name: '',
    gender: 'Male',
    blood_group: 'B+',
    aadhaar_no: '',
    dob: '1995-01-01',
    email: '',
    phone: '',
    street_address: '',
    pincode: '400050',
    emergency_contact: {
      name: '',
      relation: 'Spouse',
      phone: ''
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [regError, setRegError] = useState('');

  // Selected patient allergy view
  const [activeAllergies, setActiveAllergies] = useState(null);
  const [allergyPatientName, setAllergyPatientName] = useState('');

  const loadPatients = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedGender) params.gender = selectedGender;
      if (selectedBlood) params.blood_group = selectedBlood;

      const [resPats, resPins] = await Promise.all([
        getPatients(params),
        getPincodes()
      ]);
      setPatients(resPats.data);
      setPincodes(resPins.data);
    } catch (err) {
      console.error("Failed to load patient records", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [search, selectedGender, selectedBlood]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setSubmitting(true);
    try {
      await createPatient(regData);
      setShowModal(false);
      setRegData({
        name: '',
        gender: 'Male',
        blood_group: 'B+',
        aadhaar_no: '',
        dob: '1995-01-01',
        email: '',
        phone: '',
        street_address: '',
        pincode: '400050',
        emergency_contact: {
          name: '',
          relation: 'Spouse',
          phone: ''
        }
      });
      loadPatients();
    } catch (err) {
      setRegError(err.response?.data?.detail || "Registration failed. Verify Aadhaar uniqueness and postal code.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewAllergies = async (patient) => {
    try {
      const res = await getPatientAllergies(patient.patient_id);
      setActiveAllergies(res.data);
      setAllergyPatientName(patient.name);
    } catch (err) {
      alert("Failed to load allergies: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patient Directory & Registration</h1>
          <p className="text-sm text-slate-500 mt-1">Comprehensive patient registry, demographic details, and address records</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm rounded-lg shadow transition"
        >
          <UserPlus className="w-4 h-4" />
          Register New Patient
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, phone, Aadhaar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm rounded-lg border-slate-300 border p-2 pl-8 focus:ring-2 focus:ring-sky-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
        </div>

        <div>
          <select
            value={selectedBlood}
            onChange={(e) => setSelectedBlood(e.target.value)}
            className="w-full text-sm rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Blood Groups</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="w-full text-sm rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading registered patients...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Patient Name</th>
                  <th className="px-4 py-3">Demographics</th>
                  <th className="px-4 py-3">Aadhaar (Unique)</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Residential Address</th>
                  <th className="px-4 py-3 text-right">Medical Alerts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <tr key={p.patient_id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-500">#{p.patient_id}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-400">DOB: {p.dob}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-700">{p.gender}</span> • 
                      <span className="ml-1 px-1.5 py-0.5 bg-rose-50 text-rose-700 font-bold text-xs rounded">
                        {p.blood_group}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-700">
                      •••• •••• {p.aadhaar_no.slice(-4)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-slate-800">{p.phone}</div>
                      {p.email && <div className="text-xs text-slate-400">{p.email}</div>}
                    </td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="text-slate-800 truncate">{p.street_address}</div>
                      <div className="text-xs text-sky-600 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {p.city}, {p.state} ({p.pincode})
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleViewAllergies(p)}
                        className="text-xs px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded-lg border border-amber-200 transition"
                      >
                        Check Allergies
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Register New Patient</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {regError && (
              <div className="my-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {regError}
              </div>
            )}

            <form onSubmit={handleRegister} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Ramesh Chandra"
                  value={regData.name}
                  onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                  className="w-full text-sm rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={regData.gender}
                    onChange={(e) => setRegData({ ...regData, gender: e.target.value })}
                    className="w-full text-sm rounded-lg border-slate-300 border p-2"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group *</label>
                  <select
                    value={regData.blood_group}
                    onChange={(e) => setRegData({ ...regData, blood_group: e.target.value })}
                    className="w-full text-sm rounded-lg border-slate-300 border p-2"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={regData.dob}
                    onChange={(e) => setRegData({ ...regData, dob: e.target.value })}
                    className="w-full text-sm rounded-lg border-slate-300 border p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">12-Digit Aadhaar No *</label>
                  <input
                    required
                    type="text"
                    maxLength={12}
                    placeholder="482910394851"
                    value={regData.aadhaar_no}
                    onChange={(e) => setRegData({ ...regData, aadhaar_no: e.target.value })}
                    className="w-full text-sm rounded-lg border-slate-300 border p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone *</label>
                  <input
                    required
                    type="text"
                    placeholder="9820123456"
                    value={regData.phone}
                    onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                    className="w-full text-sm rounded-lg border-slate-300 border p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address *</label>
                <input
                  required
                  type="text"
                  placeholder="Flat/House No, Building, Street"
                  value={regData.street_address}
                  onChange={(e) => setRegData({ ...regData, street_address: e.target.value })}
                  className="w-full text-sm rounded-lg border-slate-300 border p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Pincode *</label>
                <select
                  required
                  value={regData.pincode}
                  onChange={(e) => setRegData({ ...regData, pincode: e.target.value })}
                  className="w-full text-sm rounded-lg border-slate-300 border p-2"
                >
                  {pincodes.map((pin) => (
                    <option key={pin.pincode} value={pin.pincode}>{pin.pincode} — {pin.city}, {pin.state}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-700 mb-2">Emergency Contact</p>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={regData.emergency_contact.name}
                    onChange={(e) => setRegData({
                      ...regData,
                      emergency_contact: { ...regData.emergency_contact, name: e.target.value }
                    })}
                    className="text-xs rounded border border-slate-300 p-2"
                  />
                  <select
                    value={regData.emergency_contact.relation}
                    onChange={(e) => setRegData({
                      ...regData,
                      emergency_contact: { ...regData.emergency_contact, relation: e.target.value }
                    })}
                    className="text-xs rounded border border-slate-300 p-2"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Contact Phone"
                    value={regData.emergency_contact.phone}
                    onChange={(e) => setRegData({
                      ...regData,
                      emergency_contact: { ...regData.emergency_contact, phone: e.target.value }
                    })}
                    className="text-xs rounded border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow disabled:opacity-60"
                >
                  {submitting ? "Saving..." : "Save Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allergies Modal */}
      {activeAllergies && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Allergy Profile: {allergyPatientName}
              </h2>
              <button onClick={() => setActiveAllergies(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {activeAllergies.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 text-center">No known drug or environmental allergies recorded.</p>
              ) : (
                activeAllergies.map((al) => (
                  <div key={al.allergy_id} className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs">
                    <div className="flex items-center justify-between font-bold text-amber-950">
                      <span>{al.allergen}</span>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold text-[10px]">
                        {al.severity}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">Reaction: {al.reaction}</p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setActiveAllergies(null)}
                className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
