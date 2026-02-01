import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { toast } from "sonner";

interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
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
  patients?: Patient;
  family_members?: FamilyMember;
}

type ViewMode = "day" | "week" | "month";

interface UseAppointmentsOptions {
  userId?: string;
  isDoctor?: boolean;
}

export function useAppointments({ userId, isDoctor }: UseAppointmentsOptions = {}) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("appointments")
        .select(`*, patients(id, name, phone, email), family_members(id, name, relationship)`)
        .order("date", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId && isDoctor) {
      fetchAppointments();
    }
  }, [userId, isDoctor, fetchAppointments]);

  const refetch = useCallback(() => {
    return fetchAppointments();
  }, [fetchAppointments]);

  return { appointments, loading, refetch };
}

export function useFilteredAppointments(
  appointments: Appointment[],
  searchQuery: string
) {
  return useMemo(
    () =>
      appointments.filter(
        (apt) =>
          apt.patients?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          apt.patients?.phone?.includes(searchQuery) ||
          apt.family_members?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          apt.type.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [appointments, searchQuery]
  );
}

export function useViewDates(selectedDate: Date, viewMode: ViewMode) {
  return useMemo(() => {
    if (viewMode === "day") {
      return [selectedDate];
    } else if (viewMode === "week") {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      return eachDayOfInterval({ start, end });
    }
  }, [selectedDate, viewMode]);
}

export function useAppointmentsForDate(appointments: Appointment[], date: Date) {
  return useMemo(
    () => appointments.filter((apt) => apt.date === format(date, "yyyy-MM-dd")),
    [appointments, date]
  );
}

export function useAvailableTimeSlots(selectedDate: Date) {
  const timeSlots = useMemo(
    () => [
      "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
      "12:00", "14:00", "14:30", "15:00", "15:30", "16:00",
      "16:30", "17:00", "17:30", "18:00",
    ],
    []
  );

  return useMemo(() => {
    const isToday = isSameDay(selectedDate, new Date());
    if (!isToday) return timeSlots;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return timeSlots.filter((time) => {
      const [hours, mins] = time.split(":").map(Number);
      const slotMinutes = hours * 60 + mins;
      return slotMinutes > currentMinutes;
    });
  }, [selectedDate, timeSlots]);
}

export function getPatientDisplay(apt: Appointment): string {
  if (apt.family_members) {
    return `${apt.family_members.name} (${apt.family_members.relationship})`;
  }
  return apt.patients?.name || "Unknown";
}

export function getPatientSubDisplay(apt: Appointment): string {
  if (apt.family_members && apt.patients) {
    return `via ${apt.patients.name} - ${apt.patients.phone}`;
  }
  return apt.patients?.phone || "";
}
