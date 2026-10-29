import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getDashboardStats = () => api.get('/analytics/dashboard');
export const getDeptDistribution = () => api.get('/analytics/department-distribution');

// Infrastructure
export const getDepartments = () => api.get('/hospitals/departments');
export const getWards = (type) => api.get('/hospitals/wards', { params: { type } });
export const getBeds = (params) => api.get('/hospitals/beds', { params });
export const getPincodes = () => api.get('/hospitals/pincodes');

// Doctors & Employees
export const getDoctors = (params) => api.get('/doctors', { params });
export const getDoctorById = (id) => api.get(`/doctors/${id}`);

// Patients
export const getPatients = (params) => api.get('/patients', { params });
export const createPatient = (data) => api.post('/patients', data);
export const getPatientAllergies = (id) => api.get(`/patients/${id}/allergies`);

// Appointments
export const getAppointments = (params) => api.get('/appointments', { params });
export const bookAppointment = (data) => api.post('/appointments', data);
export const cancelAppointment = (id) => api.put(`/appointments/${id}/cancel`);

// Admissions & Inpatients
export const getAdmissions = (params) => api.get('/admissions', { params });
export const admitPatient = (data) => api.post('/admissions', data);
export const dischargePatient = (id, data) => api.put(`/admissions/${id}/discharge`, data);

// Clinical
export const getDiseases = (params) => api.get('/clinical/diseases', { params });
export const recordConsultation = (data) => api.post('/clinical/consultations', data);
export const getConsultationDetails = (apptId) => api.get(`/clinical/consultations/${apptId}`);

// Pharmacy
export const getMedicines = (params) => api.get('/pharmacy/medicines', { params });
export const getInventory = (lowStockOnly) => api.get('/pharmacy/inventory', { params: { low_stock_only: lowStockOnly } });
export const restockMedicine = (medicineId, qty) => api.put(`/pharmacy/inventory/${medicineId}/restock`, { quantity: qty });

// Billing
export const getBills = (params) => api.get('/billing', { params });
export const recordPayment = (data) => api.post('/billing/payments', data);

export default api;
