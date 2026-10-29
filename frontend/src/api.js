import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Analytics
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
export const createDoctor = (data) => api.post('/doctors', data);

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

// Pharmacy Inventory
export const getMedicines = (params) => api.get('/pharmacy/medicines', { params });
export const addMedicine = (data) => api.post('/pharmacy/medicines', data);
export const getInventory = (lowStockOnly) => api.get('/pharmacy/inventory', { params: { low_stock_only: lowStockOnly } });
export const restockMedicine = (medicineId, qty) => api.put(`/pharmacy/inventory/${medicineId}/restock`, { quantity: qty });

// Pharmacy Billing & Dispensing
export const getPharmacyBills = (params) => api.get('/pharmacy/bills', { params });
export const getPharmacyBillById = (id) => api.get(`/pharmacy/bills/${id}`);
export const createPharmacyBill = (data) => api.post('/pharmacy/bills', data);
export const getPatientPrescriptions = (patientId) => api.get(`/pharmacy/prescriptions/patient/${patientId}`);

// Hospital Billing & Invoices
export const getBills = (params) => api.get('/billing', { params });
export const recordPayment = (data) => api.post('/billing/payments', data);

export default api;
