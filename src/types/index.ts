export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  medicalHistory?: string;
  allergies?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  duration: number;
  type: 'checkup' | 'cleaning' | 'filling' | 'extraction' | 'root-canal' | 'consultation' | 'follow-up';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  dentist?: string;
}

export interface Procedure {
  id: string;
  patientId: string;
  appointmentId?: string;
  name: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed';
  cost: number;
  date: string;
  notes?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  medications: Medication[];
  diagnosis: string;
  instructions: string;
  date: string;
  dentistName: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  status: 'new' | 'contacted' | 'converted' | 'closed';
  createdAt: string;
}

export interface Payment {
  id: string;
  patientId: string;
  patientName: string;
  amount: number;
  method: 'cash' | 'card' | 'upi' | 'insurance';
  status: 'pending' | 'completed' | 'refunded';
  date: string;
  description: string;
}

export interface Medicine {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  reorderLevel: number;
  price: number;
  expiryDate: string;
}
