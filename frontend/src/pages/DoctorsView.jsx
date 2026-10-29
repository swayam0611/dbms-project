import React, { useState, useEffect } from 'react';
import { UserCheck, Award, Briefcase, Mail, Phone, Filter, Search, Stethoscope } from 'lucide-react';
import { getDoctors, getDepartments } from '../api';

export default function DoctorsView() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters (User checklist: Filter by doctor, time, department)
  const [selectedDept, setSelectedDept] = useState('');
  const [searchDoc, setSearchDoc] = useState('');
  const [specialisation, setSpecialisation] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDept) params.department_id = selectedDept;
      if (searchDoc) params.search = searchDoc;
      if (specialisation) params.specialisation = specialisation;

      const [resDocs, resDepts] = await Promise.all([
        getDoctors(params),
        getDepartments()
      ]);
      setDoctors(resDocs.data);
      setDepartments(resDepts.data);
    } catch (err) {
      console.error("Failed to load doctors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDept, searchDoc, specialisation]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medical Specialists & Faculty</h1>
          <p className="text-sm text-slate-500 mt-1">Class Table Inheritance hierarchy ($Employee \to Doctor$) with Department Mapping</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg">
          {doctors.length} Doctors Found
        </span>
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
                    <span className="text-slate-400">OPD Consultation Fee:</span>
                    <span className="font-bold text-slate-900">₹{doc.consultation_fee}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Assigned Shift:</span>
                    <span className="bg-amber-50 text-amber-800 font-medium px-2 py-0.5 rounded text-[11px]">{doc.shift}</span>
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
    </div>
  );
}
