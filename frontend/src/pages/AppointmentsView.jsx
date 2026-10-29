import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, Filter, Plus, 
  Search, XCircle, CheckCircle, AlertCircle, RefreshCw 
} from 'lucide-react';
import { 
  getAppointments, getDoctors, getDepartments, 
  getPatients, bookAppointment, cancelAppointment 
} from '../api';

export default function AppointmentsView() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters (User checklist: Filter by doctor, time/date, department)
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchPatient, setSearchPatient] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: '10:00:00',
    reason_for_visit: ''
  });
  const [modalError, setModalError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchDropdowns = async () => {
    try {
      const [resDocs, resDepts, resPats] = await Promise.all([
        getDoctors(),
        getDepartments(),
        getPatients({ limit: 100 })
      ]);
      setDoctors(resDocs.data);
      setDepartments(resDepts.data);
      setPatients(resPats.data);
    } catch (err) {
      console.error("Error loading dropdown data", err);
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDoctor) params.doctor_id = selectedDoctor;
      if (selectedDept) params.department_id = selectedDept;
      if (selectedDate) params.appointment_date = selectedDate;
      if (selectedStatus) params.status = selectedStatus;
      if (searchPatient) params.search = searchPatient;

      const res = await getAppointments(params);
      setAppointments(res.data);
    } catch (err) {
      console.error("Error loading appointments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [selectedDoctor, selectedDept, selectedDate, selectedStatus, searchPatient]);

  const handleBook = async (e) => {
    e.preventDefault();
    setModalError('');
    setBookingLoading(true);
    try {
      await bookAppointment({
        patient_id: parseInt(formData.patient_id),
        doctor_id: parseInt(formData.doctor_id),
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        reason_for_visit: formData.reason_for_visit
      });
      setShowModal(false);
      setFormData({
        patient_id: '',
        doctor_id: '',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '10:00:00',
        reason_for_visit: ''
      });
      loadAppointments();
    } catch (err) {
      const detail = err.response?.data?.detail || "Failed to book appointment. Double-booking check failed.";
      setModalError(detail);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        await cancelAppointment(id);
        loadAppointments();
      } catch (err) {
        alert("Failed to cancel appointment: " + (err.response?.data?.detail || err.message));
      }
    }
  };

  const clearFilters = () => {
    setSelectedDoctor('');
    setSelectedDept('');
    setSelectedDate('');
    setSelectedStatus('');
    setSearchPatient('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointment Management & OPD</h1>
          <p className="text-sm text-slate-500 mt-1">Multi-filter scheduling with strict concurrency conflict protection</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm rounded-lg shadow transition"
        >
          <Plus className="w-4 h-4" />
          Book Appointment
        </button>
      </div>

      {/* Filter Bar (Doctor, Time/Date, Department) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-500 tracking-wider">
          <span className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-sky-600" />
            Filter Appointments
          </span>
          {(selectedDoctor || selectedDept || selectedDate || selectedStatus || searchPatient) && (
            <button onClick={clearFilters} className="text-sky-600 hover:underline">Clear all filters</button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Department Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full text-sm rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.department_id} value={d.department_id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Doctor Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Doctor</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full text-sm rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="">All Doctors</option>
              {doctors.map((d) => (
                <option key={d.doctor_id} value={d.doctor_id}>{d.name} ({d.specialisation})</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Appointment Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full text-sm rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-sm rounded-lg border-slate-300 border p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Search Patient */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Patient Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Patient name..."
                value={searchPatient}
                onChange={(e) => setSearchPatient(e.target.value)}
                className="w-full text-sm rounded-lg border-slate-300 border p-2 pl-8 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading filtered appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-700">No appointments found</p>
            <p className="text-xs text-slate-400 mt-1">Try relaxing your filter criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Doctor & Speciality</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Reason for Visit</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((a) => {
                  const isScheduled = a.status === 'Scheduled';
                  const isCompleted = a.status === 'Completed';
                  return (
                    <tr key={a.appointment_id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-500">#{a.appointment_id}</td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-900">{a.patient_name}</div>
                        <div className="text-xs text-slate-400">{a.patient_phone}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800">{a.doctor_name}</div>
                        <div className="text-xs text-sky-600 font-medium">{a.specialisation}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{a.department_name}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {a.appointment_date}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {a.appointment_time}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">{a.reason_for_visit}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isScheduled ? 'bg-amber-100 text-amber-800' :
                          isCompleted ? 'bg-emerald-100 text-emerald-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {isScheduled && (
                          <button
                            onClick={() => handleCancel(a.appointment_id)}
                            className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-100 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Book Patient Appointment</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {modalError && (
              <div className="my-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleBook} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  required
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>{p.name} (Aadhaar: ...{p.aadhaar_no.slice(-4)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Doctor *</label>
                <select
                  required
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.doctor_id} value={d.doctor_id}>{d.name} — {d.specialisation} (Fee: ₹{d.consultation_fee})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot *</label>
                  <select
                    required
                    value={formData.appointment_time}
                    onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                    className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="09:00:00">09:00 AM</option>
                    <option value="10:00:00">10:00 AM</option>
                    <option value="11:30:00">11:30 AM</option>
                    <option value="14:00:00">02:00 PM</option>
                    <option value="15:30:00">03:30 PM</option>
                    <option value="17:00:00">05:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Visit *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Primary symptoms or reason for consultation..."
                  value={formData.reason_for_visit}
                  onChange={(e) => setFormData({ ...formData, reason_for_visit: e.target.value })}
                  className="w-full text-sm rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow transition disabled:opacity-60"
                >
                  {bookingLoading ? "Checking Conflicts..." : "Confirm Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
