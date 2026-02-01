import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

// ============= Types =============
export interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  date_of_birth: string | null;
  address: string | null;
  medical_history: string | null;
  allergies: string | null;
  created_at: string;
  user_id: string | null;
}

export interface PatientDue {
  patient_id: string;
  balance_amount: number;
  due_date: string | null;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  notes?: string;
  family_member_id?: string;
  patients?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    date_of_birth?: string | null;
  };
  family_members?: {
    id: string;
    name: string;
    relationship: string;
    date_of_birth?: string | null;
  };
}

export interface DashboardStats {
  todayAppointments: number;
  totalRevenue: number;
  totalProcedures: number;
}

export interface Payment {
  id: string;
  patient_id: string;
  amount: number;
  paid_amount: number | null;
  balance_amount: number | null;
  due_date: string | null;
  method: string;
  status: string;
  date: string;
  description: string | null;
  patient_name?: string;
}

// ============= Query Keys =============
export const queryKeys = {
  patients: ["patients"] as const,
  patientsDues: ["patients", "dues"] as const,
  patient: (id: string) => ["patients", id] as const,
  appointments: ["appointments"] as const,
  appointmentsByDate: (date: string) => ["appointments", "date", date] as const,
  dashboardStats: (date: string) => ["dashboard", "stats", date] as const,
  recentPatients: ["patients", "recent"] as const,
  payments: ["payments"] as const,
  inventory: ["inventory"] as const,
};

// ============= Patients Queries =============
export function usePatients() {
  return useQuery({
    queryKey: queryKeys.patients,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Patient[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function usePatientDues() {
  return useQuery({
    queryKey: queryKeys.patientsDues,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("patient_id, balance_amount, due_date")
        .gt("balance_amount", 0)
        .eq("status", "partial");

      if (error) throw error;

      const duesMap = new Map<string, PatientDue>();
      data?.forEach((payment) => {
        const existing = duesMap.get(payment.patient_id);
        if (existing) {
          existing.balance_amount += Number(payment.balance_amount);
          if (payment.due_date && (!existing.due_date || payment.due_date < existing.due_date)) {
            existing.due_date = payment.due_date;
          }
        } else {
          duesMap.set(payment.patient_id, {
            patient_id: payment.patient_id,
            balance_amount: Number(payment.balance_amount),
            due_date: payment.due_date,
          });
        }
      });
      return duesMap;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useRecentPatients(limit = 5) {
  return useQuery({
    queryKey: queryKeys.recentPatients,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, phone, email, date_of_birth, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Patient[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ============= Patient Mutations =============
interface CreatePatientInput {
  name: string;
  phone: string;
  email?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  medical_history?: string | null;
  allergies?: string | null;
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientData: CreatePatientInput) => {
      // Use server-side validated RPC function
      const { data, error } = await supabase.rpc("insert_patient", {
        p_name: patientData.name,
        p_phone: patientData.phone,
        p_email: patientData.email || null,
        p_date_of_birth: patientData.date_of_birth || null,
        p_address: patientData.address || null,
        p_medical_history: patientData.medical_history || null,
        p_allergies: patientData.allergies || null,
      });

      if (error) throw error;
      
      // Fetch the created patient
      const { data: patient, error: fetchError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", data)
        .single();
      
      if (fetchError) throw fetchError;
      return patient as Patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      queryClient.invalidateQueries({ queryKey: queryKeys.recentPatients });
      toast.success("Patient added successfully");
    },
    onError: (error: Error) => {
      console.error("Error creating patient:", error);
      // Show specific server-side validation errors
      toast.error(error.message || "Failed to save patient");
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...patientData }: Partial<Patient> & { id: string }) => {
      // Use server-side validated RPC function for doctors
      const { error } = await supabase.rpc("doctor_update_patient", {
        p_patient_id: id,
        p_name: patientData.name || "",
        p_phone: patientData.phone || "",
        p_email: patientData.email || null,
        p_date_of_birth: patientData.date_of_birth || null,
        p_address: patientData.address || null,
        p_medical_history: patientData.medical_history || null,
        p_allergies: patientData.allergies || null,
      });

      if (error) throw error;
      
      // Fetch the updated patient
      const { data: patient, error: fetchError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();
      
      if (fetchError) throw fetchError;
      return patient as Patient;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      queryClient.setQueryData(queryKeys.patient(data.id), data);
      toast.success("Patient updated successfully");
    },
    onError: (error: Error) => {
      console.error("Error updating patient:", error);
      // Show specific server-side validation errors
      toast.error(error.message || "Failed to update patient");
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      queryClient.invalidateQueries({ queryKey: queryKeys.recentPatients });
      toast.success("Patient deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting patient:", error);
      toast.error("Failed to delete patient");
    },
  });
}

// ============= Appointments Queries =============
export function useAppointments(userId?: string, isDoctor?: boolean) {
  return useQuery({
    queryKey: queryKeys.appointments,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`*, patients(id, name, phone, email, date_of_birth), family_members(id, name, relationship, date_of_birth)`)
        .order("date", { ascending: true });

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!userId && !!isDoctor,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAppointmentsByDate(date: Date) {
  const dateStr = format(date, "yyyy-MM-dd");

  return useQuery({
    queryKey: queryKeys.appointmentsByDate(dateStr),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id, time, type, status,
          patients(name, date_of_birth),
          family_members(name, relationship, date_of_birth)
        `)
        .eq("date", dateStr)
        .order("time", { ascending: true })
        .limit(10);

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

// ============= Dashboard Queries =============
export function useDashboardStats(date: Date) {
  const dateStr = format(date, "yyyy-MM-dd");

  return useQuery({
    queryKey: queryKeys.dashboardStats(dateStr),
    queryFn: async () => {
      const [appointmentsRes, paymentsRes, proceduresRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("date", dateStr),
        supabase
          .from("payments")
          .select("paid_amount, amount")
          .eq("status", "completed")
          .eq("date", dateStr),
        supabase
          .from("patient_procedures")
          .select("id", { count: "exact", head: true })
          .eq("date", dateStr),
      ]);

      const totalRevenue =
        paymentsRes.data?.reduce((sum, p) => sum + Number(p.paid_amount || p.amount), 0) || 0;

      return {
        todayAppointments: appointmentsRes.count || 0,
        totalRevenue,
        totalProcedures: proceduresRes.count || 0,
      } as DashboardStats;
    },
    staleTime: 1000 * 60 * 1, // 1 minute for dashboard
  });
}

// ============= Payments Queries =============
export function usePayments() {
  return useQuery({
    queryKey: queryKeys.payments,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          patients!payments_patient_id_fkey (name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      return (data || []).map((p) => ({
        ...p,
        patient_name: p.patients?.name || "Unknown",
      })) as Payment[];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentData: Omit<Payment, "id" | "patient_name">) => {
      const { data, error } = await supabase
        .from("payments")
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      queryClient.invalidateQueries({ queryKey: queryKeys.patientsDues });
      toast.success("Payment recorded successfully");
    },
    onError: (error) => {
      console.error("Error creating payment:", error);
      toast.error("Failed to record payment");
    },
  });
}

// ============= Inventory Queries =============
export function useInventory() {
  return useQuery({
    queryKey: queryKeys.inventory,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("id, name, category, price, stock")
        .order("name");

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ============= Optimistic Update Helpers =============
export function useOptimisticPatientUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...patientData }: Partial<Patient> & { id: string }) => {
      const { data, error } = await supabase
        .from("patients")
        .update(patientData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Patient;
    },
    onMutate: async (newPatient) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.patients });

      const previousPatients = queryClient.getQueryData<Patient[]>(queryKeys.patients);

      queryClient.setQueryData<Patient[]>(queryKeys.patients, (old) =>
        old?.map((p) => (p.id === newPatient.id ? { ...p, ...newPatient } : p))
      );

      return { previousPatients };
    },
    onError: (err, newPatient, context) => {
      queryClient.setQueryData(queryKeys.patients, context?.previousPatients);
      toast.error("Failed to update patient");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
    },
  });
}
