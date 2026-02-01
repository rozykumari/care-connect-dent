import { useState, useCallback, useMemo, memo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isSameDay, addDays, isBefore, startOfToday } from "date-fns";
import { CalendarIcon, Plus, Clock, User, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  useAppointments,
  usePatients,
  type Appointment,
} from "@/hooks/useQueries";
import {
  useViewDates,
  useAvailableTimeSlots,
  getPatientDisplay,
  getPatientSubDisplay,
} from "@/hooks/useAppointments";
import { PatientSelector } from "@/components/appointments/PatientSelector";
import { NewPatientDialog } from "@/components/appointments/NewPatientDialog";
import { AppointmentsPageSkeleton } from "@/components/ui/skeleton-card";
import { useQueryClient } from "@tanstack/react-query";

interface SimplePatient {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

const appointmentTypes = [
  { value: "checkup", label: "Check-up" },
  { value: "cleaning", label: "Cleaning" },
  { value: "filling", label: "Filling" },
  { value: "extraction", label: "Extraction" },
  { value: "root-canal", label: "Root Canal" },
  { value: "consultation", label: "Consultation" },
  { value: "follow-up", label: "Follow-up" },
];

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/20 text-primary",
  completed: "bg-green-500/20 text-green-700",
  cancelled: "bg-destructive/20 text-destructive",
  "no-show": "bg-yellow-500/20 text-yellow-700",
};

// Memoized appointment item for calendar views
const AppointmentItem = memo(function AppointmentItem({
  apt,
  compact = false,
}: {
  apt: Appointment;
  compact?: boolean;
}) {
  const patientName = getPatientDisplay(apt);
  const subDisplay = getPatientSubDisplay(apt);

  if (compact) {
    return (
      <div className="mt-1 text-xs p-1 rounded bg-primary/20 text-primary truncate">
        {apt.time} - {patientName}
      </div>
    );
  }

  return (
    <div className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="h-3 w-3 text-primary" />
        <span className="text-sm font-medium">{apt.time}</span>
      </div>
      <div className="flex items-center gap-2">
        <User className="h-3 w-3 text-muted-foreground" />
        <div>
          <span className="text-sm truncate">{patientName}</span>
          {apt.family_members && (
            <p className="text-xs text-muted-foreground">{subDisplay}</p>
          )}
        </div>
      </div>
      <Badge className={cn("mt-2 text-xs", statusColors[apt.status])}>
        {apt.status}
      </Badge>
    </div>
  );
});

// Memoized day card component
const DayCard = memo(function DayCard({
  date,
  appointments,
  isToday,
}: {
  date: Date;
  appointments: Appointment[];
  isToday: boolean;
}) {
  return (
    <Card className={cn("glass-card", isToday && "ring-2 ring-primary")}>
      <CardHeader className="pb-2">
        <CardTitle
          className={cn(
            "text-sm font-medium",
            isToday ? "text-primary" : "text-foreground"
          )}
        >
          {format(date, "EEE, MMM d")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No appointments</p>
        ) : (
          appointments.map((apt) => <AppointmentItem key={apt.id} apt={apt} />)
        )}
      </CardContent>
    </Card>
  );
});

// Memoized month grid cell
const MonthCell = memo(function MonthCell({
  date,
  appointments,
  isToday,
}: {
  date: Date;
  appointments: Appointment[];
  isToday: boolean;
}) {
  return (
    <div
      className={cn(
        "min-h-24 p-2 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors",
        isToday && "bg-primary/10 border-primary"
      )}
    >
      <p
        className={cn(
          "text-sm font-medium",
          isToday ? "text-primary" : "text-foreground"
        )}
      >
        {format(date, "d")}
      </p>
      {appointments.slice(0, 2).map((apt) => (
        <AppointmentItem key={apt.id} apt={apt} compact />
      ))}
      {appointments.length > 2 && (
        <p className="text-xs text-muted-foreground mt-1">
          +{appointments.length - 2} more
        </p>
      )}
    </div>
  );
});

// Memoized mobile list item
const MobileAppointmentItem = memo(function MobileAppointmentItem({
  apt,
}: {
  apt: Appointment;
}) {
  const patientName = getPatientDisplay(apt);
  const subDisplay = getPatientSubDisplay(apt);

  return (
    <div className="flex items-center justify-between p-2 bg-secondary/50 rounded">
      <div className="flex items-center gap-3">
        <div className="text-center">
          <p className="text-sm font-medium">{apt.time}</p>
        </div>
        <div>
          <p className="text-sm font-medium">{patientName}</p>
          <p className="text-xs text-muted-foreground">{apt.type}</p>
          {apt.family_members && (
            <p className="text-xs text-muted-foreground">{subDisplay}</p>
          )}
        </div>
      </div>
      <Badge className={cn("text-xs", statusColors[apt.status])}>
        {apt.status}
      </Badge>
    </div>
  );
});

const Appointments = () => {
  const { user } = useAuth();
  const { isDoctor } = useUserRole();
  const queryClient = useQueryClient();

  // React Query for data with automatic caching
  const { data: appointments = [], isLoading: appointmentsLoading } = useAppointments(
    user?.id,
    isDoctor
  );
  const { data: patientsData = [], isLoading: patientsLoading } = usePatients();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewPatientDialogOpen, setIsNewPatientDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");

  const [formData, setFormData] = useState({
    patientId: "",
    date: new Date(),
    time: "09:00",
    type: "checkup",
    duration: 15,
    notes: "",
  });

  // Transform patients for selector
  const patients: SimplePatient[] = useMemo(
    () =>
      patientsData.map((p) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        email: p.email || undefined,
      })),
    [patientsData]
  );

  // Use custom hooks
  const viewDates = useViewDates(selectedDate, viewMode);
  const availableTimeSlots = useAvailableTimeSlots(formData.date);

  // Filter appointments by search
  const filteredAppointments = useMemo(
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

  // Memoized appointments by date map
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach((apt) => {
      const existing = map.get(apt.date) || [];
      map.set(apt.date, [...existing, apt]);
    });
    return map;
  }, [appointments]);

  const getAppointmentsForDate = useCallback(
    (date: Date) => appointmentsByDate.get(format(date, "yyyy-MM-dd")) || [],
    [appointmentsByDate]
  );

  const handleSubmit = useCallback(async () => {
    if (!formData.patientId || !user) return;

    try {
      const { error } = await supabase.rpc("create_appointment", {
        p_patient_id: formData.patientId,
        p_doctor_id: user.id,
        p_date: format(formData.date, "yyyy-MM-dd"),
        p_time: formData.time,
        p_type: formData.type,
        p_duration: formData.duration,
        p_notes: formData.notes || null,
        p_family_member_id: null,
      });

      if (error) {
        if (error.message.includes("not available in doctor schedule")) {
          toast.error("This time slot is outside your configured availability hours");
        } else if (error.message.includes("already booked")) {
          toast.error("This time slot is already booked");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Appointment scheduled successfully");
      setIsDialogOpen(false);
      setFormData({
        patientId: "",
        date: new Date(),
        time: "09:00",
        type: "checkup",
        duration: 30,
        notes: "",
      });
      // Invalidate and refetch appointments
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast.error("Failed to schedule appointment");
    }
  }, [formData, user, queryClient]);

  const handlePatientCreated = useCallback(
    (patient: SimplePatient) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setFormData((prev) => ({ ...prev, patientId: patient.id }));
    },
    [queryClient]
  );

  const handlePatientSelect = useCallback((patientId: string) => {
    setFormData((prev) => ({ ...prev, patientId }));
  }, []);

  const handleDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, date, time: "" }));
    }
  }, []);

  const handleNavigation = useCallback(
    (direction: "prev" | "next" | "today") => {
      if (direction === "today") {
        setSelectedDate(new Date());
        return;
      }

      const delta =
        direction === "prev"
          ? viewMode === "day"
            ? -1
            : viewMode === "week"
            ? -7
            : -30
          : viewMode === "day"
          ? 1
          : viewMode === "week"
          ? 7
          : 30;

      setSelectedDate((prev) => addDays(prev, delta));
    },
    [viewMode]
  );

  if (appointmentsLoading || patientsLoading) {
    return (
      <MainLayout>
        <AppointmentsPageSkeleton />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Appointments</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage your clinic appointments
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search appointments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  New Appointment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Schedule New Appointment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <PatientSelector
                    patients={patients}
                    selectedPatientId={formData.patientId}
                    onPatientSelect={handlePatientSelect}
                    onAddNewClick={() => setIsNewPatientDialogOpen(true)}
                  />

                  {/* Date */}
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={handleDateChange}
                          disabled={(date) => isBefore(date, startOfToday())}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time and Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Select
                        value={formData.time}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, time: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTimeSlots.length === 0 ? (
                            <div className="py-2 px-3 text-sm text-muted-foreground">
                              No available slots
                            </div>
                          ) : (
                            availableTimeSlots.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Select
                        value={formData.duration.toString()}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, duration: parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="45">45 min</SelectItem>
                          <SelectItem value="60">60 min</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, type: value }))
                      }
                    >
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

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      placeholder="Add any notes..."
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.notes.length}/1000
                    </p>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full gradient-primary"
                    disabled={!formData.patientId || !formData.time}
                  >
                    Schedule Appointment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* New Patient Dialog */}
        <NewPatientDialog
          open={isNewPatientDialogOpen}
          onOpenChange={setIsNewPatientDialogOpen}
          onPatientCreated={handlePatientCreated}
        />

        {/* View Controls */}
        <Card className="glass-card">
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <Tabs
                value={viewMode}
                onValueChange={(v) => setViewMode(v as "day" | "week" | "month")}
                className="w-full sm:w-auto"
              >
                <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleNavigation("prev")}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleNavigation("today")}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleNavigation("next")}>
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar View */}
        {viewMode === "month" ? (
          <Card className="glass-card overflow-hidden">
            <CardContent className="p-2 md:p-6">
              {/* Desktop Month View */}
              <div className="hidden md:grid grid-cols-7 gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
                {viewDates.map((date) => (
                  <MonthCell
                    key={date.toISOString()}
                    date={date}
                    appointments={getAppointmentsForDate(date)}
                    isToday={isSameDay(date, new Date())}
                  />
                ))}
              </div>

              {/* Mobile Month View */}
              <div className="md:hidden space-y-2">
                {viewDates
                  .filter((date) => getAppointmentsForDate(date).length > 0)
                  .map((date) => {
                    const dayAppointments = getAppointmentsForDate(date);
                    const isToday = isSameDay(date, new Date());

                    return (
                      <Card
                        key={date.toISOString()}
                        className={cn("p-3", isToday && "ring-2 ring-primary")}
                      >
                        <p className={cn("font-medium mb-2", isToday && "text-primary")}>
                          {format(date, "EEE, MMM d")}
                        </p>
                        <div className="space-y-2">
                          {dayAppointments.map((apt) => (
                            <MobileAppointmentItem key={apt.id} apt={apt} />
                          ))}
                        </div>
                      </Card>
                    );
                  })}
                {viewDates.filter((date) => getAppointmentsForDate(date).length > 0).length ===
                  0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No appointments this month
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Week/Day View */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
              {viewDates.map((date) => (
                <DayCard
                  key={date.toISOString()}
                  date={date}
                  appointments={getAppointmentsForDate(date)}
                  isToday={isSameDay(date, new Date())}
                />
              ))}
            </div>

            {/* Mobile Week/Day View */}
            <div className="md:hidden space-y-3">
              {viewDates.map((date) => {
                const dayAppointments = getAppointmentsForDate(date);
                const isToday = isSameDay(date, new Date());

                return (
                  <Card
                    key={date.toISOString()}
                    className={cn("p-3", isToday && "ring-2 ring-primary")}
                  >
                    <p className={cn("font-medium mb-2", isToday && "text-primary")}>
                      {format(date, "EEEE, MMM d")}
                    </p>
                    {dayAppointments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No appointments</p>
                    ) : (
                      <div className="space-y-2">
                        {dayAppointments.map((apt) => (
                          <MobileAppointmentItem key={apt.id} apt={apt} />
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Appointments;
