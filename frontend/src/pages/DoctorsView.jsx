import React, { useState, useEffect } from 'react';
import { UserCheck, Mail, Phone, Search, Stethoscope, Plus, AlertCircle, X } from 'lucide-react';
import { getDoctors, getDepartments, getPincodes, createDoctor } from '../api';

export default function DoctorsView() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pincodes, setPincodes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState('');
  const [searchDoc, setSearchDoc] = useState('');
  const [specialisation, setSpecialisation] = useState('');

  // Add Doctor Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    salary: 180000,
    dob: '1985-05-15',
    gender: 'Male',
    joining_date: new Date().toISOString().split('T')[0],
    qualification: 'MBBS, MD',
    shift: 'Morning',
    street_address: '',
    pincode: '400050',
    department_id: '',
    license_number: '',
    specialisation: '',
    experience_years: 5,
    consultation_fee: 800
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDept) params.department_id = selectedDept;
      if (searchDoc) params.search = searchDoc;
      if (specialisation) params.specialisation = specialisation;

      const [resDocs, resDepts, resPins] = await Promise.all([
        getDoctors(params),
        getDepartments(),
        getPincodes()
      ]);
      setDoctors(resDocs.data);
      setDepartments(resDepts.data);
      setPincodes(resPins.data);
      if (resDepts.data.length > 0 && !formData.department_id) {
        setFormData(prev => ({ ...prev, department_id: resDepts.data[0].department_id }));
      }
    } catch (err) {
      console.error("Failed to load doctors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDept, searchDoc, specialisation]);

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await createDoctor({
        ...formData,
        department_id: parseInt(formData.department_id),
        salary: parseFloat(formData.salary),
        experience_years: parseInt(formData.experience_years),
        consultation_fee: parseFloat(formData.consultation_fee)
      });
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        salary: 180000,
        dob: '1985-05-15',
        gender: 'Male',
        joining_date: new Date().toISOString().split('T')[0],
        qualification: 'MBBS, MD',
        shift: 'Morning',
        street_address: '',
        pincode: '400050',
        department_id: departments[0]?.department_id || '',
        license_number: '',
        specialisation: '',
        experience_years: 5,
        consultation_fee: 800
      });
      loadData();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to register doctor. Ensure license number and email are unique.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medical Specialists & Physicians</h1>
          <p className="text-sm text-slate-500 mt-1">Directory of hospital consultants, OPD clinic schedules, and specialities</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg">
            {doctors.length} Doctors Registered
          </span>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add Doctor
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full text-sm rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.department_id} value={d.department_id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Search Doctor Name</label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Dr. Rajesh..."
              value={searchDoc}
              onChange={(e) => setSearchDoc(e.target.value)}
              className="w-full text-sm rounded-lg border-slate-300 border p-2 pl-8 focus:ring-2 focus:ring-sky-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Specialisation Keyword</label>
          <input
            type="text"
            placeholder="e.g. Cardiology, Surgery..."
            value={specialisation}
            onChange={(e) => setSpecialisation(e.target.value)}
            className="w-full text-sm rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading doctor profiles...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map((doc) => (
            <div key={doc.doctor_id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-base">
                      <Stethoscope className="w-6 h-6 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{doc.name}</h3>
                      <p className="text-xs font-semibold text-sky-600">{doc.specialisation}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {doc.license_number}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-medium text-slate-800">{doc.department_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Experience:</span>
                    <span className="font-semibold text-emerald-700">{doc.experience_years} Years</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Consultation Fee:</span>
                    <span className="font-bold text-slate-900">₹{doc.consultation_fee}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Assigned Shift:</span>
                    <span className="bg-slate-100 text-slate-800 font-medium px-2 py-0.5 rounded text-[11px]">{doc.shift}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {doc.email}
                </span>
                <span className="flex items-center gap-1 font-mono text-slate-600">
                  <Phone className="w-3.5 h-3.5" />
                  {doc.phone}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Doctor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Register New Doctor</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="my-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddDoctor} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Dr. Ramesh Gupta"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    required
                    type="email"
                    placeholder="r.gupta@hospital.org"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone *</label>
                  <input
                    required
                    type="text"
                    placeholder="9820112233"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    required
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    required
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  >
                    {departments.map((d) => (
                      <option key={d.department_id} value={d.department_id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Medical License No. *</label>
                  <input
                    required
                    type="text"
                    placeholder="MCI-CARD-9901"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specialisation *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Interventional Cardiology"
                    value={formData.specialisation}
                    onChange={(e) => setFormData({ ...formData, specialisation: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Experience (Years) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Fee (₹) *</label>
                  <input
                    required
                    type="number"
                    min="100"
                    step="50"
                    value={formData.consultation_fee}
                    onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qualifications *</label>
                  <input
                    required
                    type="text"
                    placeholder="MBBS, MD, DM"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Schedule *</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                    <option value="Rotational">Rotational</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address *</label>
                  <input
                    required
                    type="text"
                    placeholder="Building, Street, Area"
                    value={formData.street_address}
                    onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Pincode *</label>
                  <select
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                  >
                    {pincodes.map((pin) => (
                      <option key={pin.pincode} value={pin.pincode}>{pin.pincode} — {pin.city}, {pin.state}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow transition disabled:opacity-60"
                >
                  {submitting ? "Registering..." : "Save Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
