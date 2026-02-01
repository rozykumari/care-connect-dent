import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export interface PatientFormData {
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  address: string;
  medical_history: string;
  allergies: string;
}

const initialFormData: PatientFormData = {
  name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  address: "",
  medical_history: "",
  allergies: "",
};

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientDues, setPatientDues] = useState<Map<string, PatientDue>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const [patientsRes, paymentsRes] = await Promise.all([
        supabase
          .from("patients")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("payments")
          .select("patient_id, balance_amount, due_date")
          .gt("balance_amount", 0)
          .eq("status", "partial"),
      ]);

      if (patientsRes.error) throw patientsRes.error;
      setPatients(patientsRes.data || []);

      // Build dues map (aggregate by patient)
      const duesMap = new Map<string, PatientDue>();
      paymentsRes.data?.forEach((payment) => {
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
      setPatientDues(duesMap);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const refetch = useCallback(() => {
    return fetchPatients();
  }, [fetchPatients]);

  return { patients, patientDues, loading, refetch };
}

export function useFilteredPatients(patients: Patient[], searchQuery: string) {
  return useMemo(
    () =>
      patients.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (patient.email && patient.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
          patient.phone.includes(searchQuery)
      ),
    [patients, searchQuery]
  );
}

export function usePatientForm(initialData: PatientFormData = initialFormData) {
  const [formData, setFormData] = useState<PatientFormData>(initialData);

  const updateField = useCallback(
    <K extends keyof PatientFormData>(field: K, value: PatientFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const reset = useCallback(() => {
    setFormData(initialFormData);
  }, []);

  const setFromPatient = useCallback((patient: Patient) => {
    setFormData({
      name: patient.name,
      email: patient.email || "",
      phone: patient.phone,
      date_of_birth: patient.date_of_birth || "",
      address: patient.address || "",
      medical_history: patient.medical_history || "",
      allergies: patient.allergies || "",
    });
  }, []);

  return { formData, setFormData, updateField, reset, setFromPatient };
}

export async function checkPhoneExists(
  phone: string,
  excludeId?: string
): Promise<boolean> {
  const { data } = await supabase
    .from("patients")
    .select("id")
    .eq("phone", phone)
    .neq("id", excludeId || "")
    .maybeSingle();

  return !!data;
}

export async function savePatient(
  formData: PatientFormData,
  editingPatientId?: string
): Promise<boolean> {
  const trimmedName = formData.name.trim();
  const trimmedPhone = formData.phone.trim();

  if (!trimmedName) {
    toast.error("Please enter patient name");
    return false;
  }

  if (!trimmedPhone || !/^\d{10}$/.test(trimmedPhone)) {
    toast.error("Please enter a valid 10-digit mobile number");
    return false;
  }

  try {
    const phoneExists = await checkPhoneExists(trimmedPhone, editingPatientId);
    if (phoneExists) {
      toast.error("This mobile number is already registered with another patient");
      return false;
    }

    const patientData = {
      name: trimmedName,
      email: formData.email.trim() || null,
      phone: trimmedPhone,
      date_of_birth: formData.date_of_birth || null,
      address: formData.address.trim() || null,
      medical_history: formData.medical_history.trim() || null,
      allergies: formData.allergies.trim() || null,
    };

    if (editingPatientId) {
      const { error } = await supabase
        .from("patients")
        .update(patientData)
        .eq("id", editingPatientId);

      if (error) throw error;
      toast.success("Patient updated successfully");
    } else {
      const { error } = await supabase.from("patients").insert(patientData);

      if (error) throw error;
      toast.success("Patient added successfully");
    }

    return true;
  } catch (error) {
    console.error("Error saving patient:", error);
    toast.error("Failed to save patient");
    return false;
  }
}

export async function deletePatient(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (error) throw error;

    toast.success("Patient deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting patient:", error);
    toast.error("Failed to delete patient");
    return false;
  }
}
