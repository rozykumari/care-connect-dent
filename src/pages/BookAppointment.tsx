import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, isBefore, startOfToday } from "date-fns";
import { CalendarIcon, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface DoctorAvailability {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  type: string;
}

interface PatientRecord {
  id: string;
  user_id: string;
}

const appointmentTypes = [
  { value: "checkup", label: "Check-up" },
  { value: "cleaning", label: "Cleaning" },
  { value: "consultation", label: "Consultation" },
  { value: "follow-up", label: "Follow-up" },
];

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const BookAppointment = () => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<DoctorAvailability[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  const [patientRecord, setPatientRecord] = useState<PatientRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedType, setSelectedType] = useState("consultation");
  const [notes, setNotes] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch availability
      const { data: availData, error: availError } = await supabase
        .from("doctor_availability")
        .select("*")
        .eq("is_active", true);

      if (availError) throw availError;
      setAvailability(availData || []);

      // Fetch patient record
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("id, user_id")
        .eq("user_id", user?.id)
        .single();

      if (!patientError && patientData) {
        setPatientRecord(patientData);

        // Fetch existing appointments for this patient
        const { data: apptData } = await supabase
          .from("appointments")
          .select("id, date, time, status, type")
          .eq("patient_id", patientData.id)
          .order("date", { ascending: true });

        setExistingAppointments(apptData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableSlots = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dayAvailability = availability.filter((a) => a.day_of_week === dayOfWeek);

    if (dayAvailability.length === 0) return [];

    const slots: string[] = [];
    const dateStr = format(date, "yyyy-MM-dd");

    // Get booked slots for this date
    const bookedSlots = existingAppointments
      .filter((a) => a.date === dateStr && a.status !== "cancelled")
      .map((a) => a.time);

    dayAvailability.forEach((avail) => {
      const [startHour, startMin] = avail.start_time.split(":").map(Number);
      const [endHour, endMin] = avail.end_time.split(":").map(Number);
      const duration = avail.slot_duration;

      let currentMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      while (currentMinutes + duration <= endMinutes) {
        const hours = Math.floor(currentMinutes / 60);
        const mins = currentMinutes % 60;
        const timeStr = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;

        if (!bookedSlots.includes(timeStr)) {
          slots.push(timeStr);
        }

        currentMinutes += duration;
      }
    });

    return slots.sort();
  };

  const isDateAvailable = (date: Date) => {
    if (isBefore(date, startOfToday())) return false;
    const dayOfWeek = date.getDay();
    return availability.some((a) => a.day_of_week === dayOfWeek);
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !patientRecord) return;

    // Get doctor_id from availability (assuming single doctor)
    const doctorId = availability[0]?.doctor_id;
    if (!doctorId) {
      toast.error("No doctor available");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("appointments").insert({
        patient_id: patientRecord.id,
        doctor_id: doctorId,
        date: format(selectedDate, "yyyy-MM-dd"),
        time: selectedTime,
        type: selectedType,
        status: "scheduled",
        notes: notes || null,
        duration: 30,
      });

      if (error) throw error;

      setBookingSuccess(true);
      toast.success("Appointment booked successfully!");
      fetchData();
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error("Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const resetBooking = () => {
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedType("consultation");
    setNotes("");
    setBookingSuccess(false);
  };

  const availableSlots = selectedDate ? getAvailableSlots(selectedDate) : [];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    );
  }

  if (!patientRecord) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-muted-foreground mb-4">
            You need to be registered as a patient to book appointments.
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact the clinic to set up your patient profile.
          </p>
        </div>
      </MainLayout>
    );
  }

  if (bookingSuccess) {
    return (
      <MainLayout>
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Appointment Booked!</h2>
          <p className="text-muted-foreground mb-6">
            Your appointment has been scheduled for{" "}
            <span className="font-medium text-foreground">
              {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
            </span>{" "}
            at <span className="font-medium text-foreground">{selectedTime}</span>
          </p>
          <Button onClick={resetBooking}>Book Another Appointment</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Book Appointment</h1>
          <p className="text-muted-foreground mt-1">
            Select an available time slot to schedule your visit
          </p>
        </div>

        {availability.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No availability slots have been set up yet. Please check back later.
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Calendar */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Select Date
                </CardTitle>
                <CardDescription>
                  Available days are highlighted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTime("");
                  }}
                  disabled={(date) => !isDateAvailable(date)}
                  className="rounded-md border pointer-events-auto"
                />
              </CardContent>
            </Card>

            {/* Time Slots & Details */}
            <div className="space-y-4">
              {selectedDate && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Available Times
                    </CardTitle>
                    <CardDescription>
                      {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {availableSlots.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No available slots for this date
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {availableSlots.map((time) => (
                          <Button
                            key={time}
                            variant={selectedTime === time ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTime(time)}
                            className={cn(
                              selectedTime === time && "gradient-primary"
                            )}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {selectedTime && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Appointment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Appointment Type</Label>
                      <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {appointmentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes (Optional)</Label>
                      <Textarea
                        placeholder="Any specific concerns or information..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    <Button
                      onClick={handleBookAppointment}
                      className="w-full gradient-primary"
                      disabled={submitting}
                    >
                      {submitting ? "Booking..." : "Confirm Booking"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Existing Appointments */}
        {existingAppointments.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Your Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {existingAppointments
                  .filter((a) => a.status !== "cancelled" && !isBefore(new Date(a.date), startOfToday()))
                  .map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div>
                        <p className="font-medium">
                          {format(new Date(apt.date), "EEEE, MMMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {apt.time} • {apt.type}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          apt.status === "scheduled" && "bg-primary/20 text-primary",
                          apt.status === "completed" && "bg-green-500/20 text-green-700"
                        )}
                      >
                        {apt.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default BookAppointment;
