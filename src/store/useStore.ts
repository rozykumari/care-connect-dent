import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Patient, Appointment, Procedure, Prescription, Enquiry, Payment, Medicine } from '@/types';

interface StoreState {
  patients: Patient[];
  appointments: Appointment[];
  procedures: Procedure[];
  prescriptions: Prescription[];
  enquiries: Enquiry[];
  payments: Payment[];
  medicines: Medicine[];
  
  // Patient actions
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, patient: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  
  // Appointment actions
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  
  // Procedure actions
  addProcedure: (procedure: Procedure) => void;
  updateProcedure: (id: string, procedure: Partial<Procedure>) => void;
  deleteProcedure: (id: string) => void;
  
  // Prescription actions
  addPrescription: (prescription: Prescription) => void;
  updatePrescription: (id: string, prescription: Partial<Prescription>) => void;
  deletePrescription: (id: string) => void;
  
  // Enquiry actions
  addEnquiry: (enquiry: Enquiry) => void;
  updateEnquiry: (id: string, enquiry: Partial<Enquiry>) => void;
  deleteEnquiry: (id: string) => void;
  
  // Payment actions
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  
  // Medicine actions
  addMedicine: (medicine: Medicine) => void;
  updateMedicine: (id: string, medicine: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      patients: [],
      appointments: [],
      procedures: [],
      prescriptions: [],
      enquiries: [],
      payments: [],
      medicines: [],
      
      // Patient actions
      addPatient: (patient) => set((state) => ({ patients: [...state.patients, patient] })),
      updatePatient: (id, updates) => set((state) => ({
        patients: state.patients.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      deletePatient: (id) => set((state) => ({ patients: state.patients.filter(p => p.id !== id) })),
      
      // Appointment actions
      addAppointment: (appointment) => set((state) => ({ appointments: [...state.appointments, appointment] })),
      updateAppointment: (id, updates) => set((state) => ({
        appointments: state.appointments.map(a => a.id === id ? { ...a, ...updates } : a)
      })),
      deleteAppointment: (id) => set((state) => ({ appointments: state.appointments.filter(a => a.id !== id) })),
      
      // Procedure actions
      addProcedure: (procedure) => set((state) => ({ procedures: [...state.procedures, procedure] })),
      updateProcedure: (id, updates) => set((state) => ({
        procedures: state.procedures.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      deleteProcedure: (id) => set((state) => ({ procedures: state.procedures.filter(p => p.id !== id) })),
      
      // Prescription actions
      addPrescription: (prescription) => set((state) => ({ prescriptions: [...state.prescriptions, prescription] })),
      updatePrescription: (id, updates) => set((state) => ({
        prescriptions: state.prescriptions.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      deletePrescription: (id) => set((state) => ({ prescriptions: state.prescriptions.filter(p => p.id !== id) })),
      
      // Enquiry actions
      addEnquiry: (enquiry) => set((state) => ({ enquiries: [...state.enquiries, enquiry] })),
      updateEnquiry: (id, updates) => set((state) => ({
        enquiries: state.enquiries.map(e => e.id === id ? { ...e, ...updates } : e)
      })),
      deleteEnquiry: (id) => set((state) => ({ enquiries: state.enquiries.filter(e => e.id !== id) })),
      
      // Payment actions
      addPayment: (payment) => set((state) => ({ payments: [...state.payments, payment] })),
      updatePayment: (id, updates) => set((state) => ({
        payments: state.payments.map(p => p.id === id ? { ...p, ...updates } : p)
      })),
      deletePayment: (id) => set((state) => ({ payments: state.payments.filter(p => p.id !== id) })),
      
      // Medicine actions
      addMedicine: (medicine) => set((state) => ({ medicines: [...state.medicines, medicine] })),
      updateMedicine: (id, updates) => set((state) => ({
        medicines: state.medicines.map(m => m.id === id ? { ...m, ...updates } : m)
      })),
      deleteMedicine: (id) => set((state) => ({ medicines: state.medicines.filter(m => m.id !== id) })),
    }),
    {
      name: 'dentist-clinic-storage',
    }
  )
);
