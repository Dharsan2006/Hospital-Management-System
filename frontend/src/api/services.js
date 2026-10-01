import api from './axios';

// Auth Services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
};

// User Services
export const userService = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  delete: (id) => api.delete(`/users/${id}`),
};

// Department Services
export const departmentService = {
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// Doctor Services
export const doctorService = {
  getAll: () => api.get('/doctors'),
  getById: (id) => api.get(`/doctors/${id}`),
  getByDepartment: (deptId) => api.get(`/doctors/department/${deptId}`),
  update: (id, data) => api.put(`/doctors/${id}`, data),
};

// Patient Services
export const patientService = {
  getAll: () => api.get('/patients'),
  getById: (id) => api.get(`/patients/${id}`),
  update: (id, data) => api.put(`/patients/${id}`, data),
};

// Appointment Services
export const appointmentService = {
  getAll: () => api.get('/appointments'),
  getByPatient: (patientId) => api.get(`/appointments/patient/${patientId}`),
  getByDoctor: (doctorId) => api.get(`/appointments/doctor/${doctorId}`),
  book: (data) => api.post('/appointments', data),
  updateStatus: (id, status) => api.put(`/appointments/${id}/status?status=${status}`),
  cancel: (id) => api.delete(`/appointments/${id}`),
};

// Medical Record Services
export const medicalRecordService = {
  getAll: () => api.get('/medical-records'),
  getByPatient: (patientId) => api.get(`/medical-records/patient/${patientId}`),
  create: (data) => api.post('/medical-records', data),
};

// Prescription Services
export const prescriptionService = {
  getAll: () => api.get('/prescriptions'),
  getByPatient: (patientId) => api.get(`/prescriptions/patient/${patientId}`),
  create: (data) => api.post('/prescriptions', data),
  dispense: (id) => api.put(`/prescriptions/${id}/dispense`),
};

// Medicine Services
export const medicineService = {
  getAll: () => api.get('/medicines'),
  getById: (id) => api.get(`/medicines/${id}`),
  getLowStock: (threshold = 10) => api.get(`/medicines/low-stock?threshold=${threshold}`),
  create: (data) => api.post('/medicines', data),
  update: (id, data) => api.put(`/medicines/${id}`, data),
  updateStock: (id, quantity) => api.patch(`/medicines/${id}/stock?quantity=${quantity}`),
  delete: (id) => api.delete(`/medicines/${id}`),
};

// Lab Services
export const labService = {
  getAllTests: () => api.get('/lab-tests'),
  createTest: (data) => api.post('/lab-tests', data),
  updateTest: (id, data) => api.put(`/lab-tests/${id}`, data),
  getAllResults: () => api.get('/lab-tests/results'),
  getResultsByPatient: (patientId) => api.get(`/lab-tests/results/patient/${patientId}`),
  requestTest: (data) => api.post('/lab-tests/results', data),
  updateResult: (id, data) => api.put(`/lab-tests/results/${id}`, data),
};

// Room Services
export const roomService = {
  getAll: () => api.get('/rooms'),
  getAvailable: () => api.get('/rooms/available'),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
};

// Admission Services
export const admissionService = {
  getAll: () => api.get('/admissions'),
  getByPatient: (patientId) => api.get(`/admissions/patient/${patientId}`),
  admit: (data) => api.post('/admissions', data),
  discharge: (id, data) => api.put(`/admissions/${id}/discharge`, data),
};

// Billing Services
export const billingService = {
  getAll: () => api.get('/bills'),
  getById: (id) => api.get(`/bills/${id}`),
  getByPatient: (patientId) => api.get(`/bills/patient/${patientId}`),
  generate: (data) => api.post('/bills', data),
  update: (id, data) => api.put(`/bills/${id}`, data),
};

// Payment Services
export const paymentService = {
  getAll: () => api.get('/payments'),
  getByBill: (billId) => api.get(`/payments/bill/${billId}`),
  process: (data) => api.post('/payments', data),
};
