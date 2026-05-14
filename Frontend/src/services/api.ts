import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 180000,
});

export const apiService = {
  createTriage: (data: any) => api.post('/triage/', data),
  followup: (data: any) => api.post('/triage/followup', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  prescreen: (data: { age: number; duration: string; has_fever: boolean; is_spreading: boolean; symptoms: string }) =>
    api.post('/triage/prescreen', data),
  getPatients: () => api.get('/triage/patients'),
  getPatientCount: () => api.get('/triage/patient-count'),
  getStats: () => api.get('/triage/stats'),
  getAppointments: () => api.get('/triage/appointments'),
  getPatientNotes: (patientId: number | string) => api.get(`/triage/notes/${patientId}`),
  addPatientNote: (patientId: number | string, note: string) =>
    api.post(`/triage/notes/${patientId}`, { note }),
  drugCheck: (patientId: string, medications: string[]) =>
    api.post('/triage/drug-check', { patient_id: patientId, current_medications: medications }),
  getSummary: (patientId: number | string) =>
    api.get(`/triage/summary/${patientId}`, { responseType: 'blob', timeout: 180000 }),
  exportCases: () =>
    api.get('/triage/export', { responseType: 'blob' }),
  health: () => api.get('/health/'),
};

export default apiService;