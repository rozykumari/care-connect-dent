import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
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
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, isBefore, startOfToday } from "date-fns";
import { CalendarIcon, Plus, Clock, User, Search, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface Appointment {
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
  family_members?: {
    id: string;
    name: string;
    relationship: string;
  };
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

const Appointments = () => {
  const { user } = useAuth();
  const { isDoctor } = useUserRole();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewPatientDialogOpen, setIsNewPatientDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [showPatientSearch, setShowPatientSearch] = useState(false);

  const [formData, setFormData] = useState({
    patientId: "",
    date: new Date(),
    time: "09:00",
    type: "checkup",
    duration: 15,
    notes: "",
  });

  const [newPatientData, setNewPatientData] = useState({
    name: "",
    phone: "",
    email: "",
    date_of_birth: "",
    address: "",
  });

  // Fetch data
  useEffect(() => {
    if (user && isDoctor) {
      fetchAppointments();
      fetchPatients();
    }
  }, [user, isDoctor]);

  const fetchAppointments = async () => {
    try {
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
  };

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, phone, email")
        .order("name");

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.patientId || !user) return;

    try {
      const { error } = await supabase.from("appointments").insert({
        patient_id: formData.patientId,
        doctor_id: user.id,
        date: format(formData.date, "yyyy-MM-dd"),
        time: formData.time,
        duration: formData.duration,
        type: formData.type,
        status: "scheduled",
        notes: formData.notes,
      });

      if (error) throw error;

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
      fetchAppointments();
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast.error("Failed to schedule appointment");
    }
  };

  const handleNewPatientSubmit = async () => {
    if (!newPatientData.name || !newPatientData.phone) return;

    // Validate phone - must be 10 digits
    if (!/^\d{10}$/.test(newPatientData.phone)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      // Check if phone already exists
      const { data: existingPatient } = await supabase
        .from("patients")
        .select("id")
        .eq("phone", newPatientData.phone)
        .maybeSingle();

      if (existingPatient) {
        toast.error("This mobile number is already registered with another patient");
        return;
      }

      const { data, error } = await supabase
        .from("patients")
        .insert({
          name: newPatientData.name,
          phone: newPatientData.phone,
          email: newPatientData.email || null,
          date_of_birth: newPatientData.date_of_birth || null,
          address: newPatientData.address || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Patient added successfully");
      setPatients([...patients, data]);
      setFormData({ ...formData, patientId: data.id });
      setIsNewPatientDialogOpen(false);
      setNewPatientData({
        name: "",
        phone: "",
        email: "",
        date_of_birth: "",
        address: "",
      });
    } catch (error) {
      console.error("Error creating patient:", error);
      toast.error("Failed to add patient");
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
      p.phone.includes(patientSearchQuery)
  );

  const selectedPatient = patients.find((p) => p.id === formData.patientId);

  const getViewDates = () => {
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
  };

  const viewDates = getViewDates();

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) => apt.date === format(date, "yyyy-MM-dd"));
  };

  const filteredAppointments = appointments.filter(
    (apt) =>
      apt.patients?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patients?.phone?.includes(searchQuery) ||
      apt.family_members?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to display patient name with family member info
  const getPatientDisplay = (apt: Appointment) => {
    if (apt.family_members) {
      return `${apt.family_members.name} (${apt.family_members.relationship})`;
    }
    return apt.patients?.name || 'Unknown';
  };

  const getPatientSubDisplay = (apt: Appointment) => {
    if (apt.family_members && apt.patients) {
      return `via ${apt.patients.name} - ${apt.patients.phone}`;
    }
    return apt.patients?.phone || '';
  };

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "14:00", "14:30", "15:00", "15:30", "16:00",
    "16:30", "17:00", "17:30", "18:00",
  ];

  // Filter time slots based on selected date (exclude past times if today)
  const getAvailableTimeSlots = () => {
    const isToday = isSameDay(formData.date, new Date());
    if (!isToday) return timeSlots;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return timeSlots.filter((time) => {
      const [hours, mins] = time.split(":").map(Number);
      const slotMinutes = hours * 60 + mins;
      return slotMinutes > currentMinutes;
    });
  };

  const availableTimeSlots = getAvailableTimeSlots();

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
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
                <Button className="gradient-primary w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  New Appointment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Schedule New Appointment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {/* Patient Selection with Search */}
                  <div className="space-y-2">
                    <Label>Patient</Label>
                    <div className="flex gap-2">
                      <Popover open={showPatientSearch} onOpenChange={setShowPatientSearch}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-start text-left font-normal"
                          >
                            <Search className="mr-2 h-4 w-4 shrink-0" />
                            {selectedPatient ? selectedPatient.name : "Search patient..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                          <Command>
                            <CommandInput 
                              placeholder="Search by name or phone..." 
                              value={patientSearchQuery}
                              onValueChange={setPatientSearchQuery}
                            />
                            <CommandList>
                              <CommandEmpty>No patient found.</CommandEmpty>
                              <CommandGroup>
                                {filteredPatients.map((patient) => (
                                  <CommandItem
                                    key={patient.id}
                                    value={patient.name}
                                    onSelect={() => {
                                      setFormData({ ...formData, patientId: patient.id });
                                      setShowPatientSearch(false);
                                      setPatientSearchQuery("");
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{patient.name}</span>
                                      <span className="text-xs text-muted-foreground">{patient.phone}</span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setIsNewPatientDialogOpen(true)}
                        title="Add new patient"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

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
                          onSelect={(date) => {
                            if (date) {
                              setFormData({ ...formData, date, time: "" });
                            }
                          }}
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
                        onValueChange={(value) => setFormData({ ...formData, time: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTimeSlots.length === 0 ? (
                            <div className="py-2 px-3 text-sm text-muted-foreground">No available slots</div>
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
                        onValueChange={(value) => setFormData({ ...formData, duration: parseInt(value) })}
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
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
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
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground text-right">{formData.notes.length}/1000</p>
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

        {/* Add New Patient Dialog */}
        <Dialog open={isNewPatientDialogOpen} onOpenChange={setIsNewPatientDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  placeholder="John Doe"
                  value={newPatientData.name}
                  onChange={(e) => setNewPatientData({ ...newPatientData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone * (10 digits)</Label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9876543210"
                  value={newPatientData.phone}
                  onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value.replace(/\D/g, '') })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={newPatientData.email}
                  onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={newPatientData.date_of_birth}
                  onChange={(e) => setNewPatientData({ ...newPatientData, date_of_birth: e.target.value })}
                />
              </div>
              <Button
                onClick={handleNewPatientSubmit}
                className="w-full gradient-primary"
                disabled={!newPatientData.name || !newPatientData.phone}
              >
                Add Patient
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Controls */}
        <Card className="glass-card">
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full sm:w-auto">
                <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectedDate(
                      viewMode === "day"
                        ? addDays(selectedDate, -1)
                        : viewMode === "week"
                        ? addDays(selectedDate, -7)
                        : addDays(selectedDate, -30)
                    )
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectedDate(
                      viewMode === "day"
                        ? addDays(selectedDate, 1)
                        : viewMode === "week"
                        ? addDays(selectedDate, 7)
                        : addDays(selectedDate, 30)
                    )
                  }
                >
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
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                {viewDates.map((date) => {
                  const dayAppointments = getAppointmentsForDate(date);
                  const isToday = isSameDay(date, new Date());

                  return (
                    <div
                      key={date.toISOString()}
                      className={cn(
                        "min-h-24 p-2 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors",
                        isToday && "bg-primary/10 border-primary"
                      )}
                    >
                      <p className={cn("text-sm font-medium", isToday ? "text-primary" : "text-foreground")}>
                        {format(date, "d")}
                      </p>
                      {dayAppointments.slice(0, 2).map((apt) => (
                        <div
                          key={apt.id}
                          className="mt-1 text-xs p-1 rounded bg-primary/20 text-primary truncate"
                        >
                        {apt.time} - {getPatientDisplay(apt)}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          +{dayAppointments.length - 2} more
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Mobile Month View - List */}
              <div className="md:hidden space-y-2">
                {viewDates.filter(date => getAppointmentsForDate(date).length > 0).map((date) => {
                  const dayAppointments = getAppointmentsForDate(date);
                  const isToday = isSameDay(date, new Date());

                  return (
                    <Card key={date.toISOString()} className={cn("p-3", isToday && "ring-2 ring-primary")}>
                      <p className={cn("font-medium mb-2", isToday && "text-primary")}>
                        {format(date, "EEE, MMM d")}
                      </p>
                      <div className="space-y-2">
                        {dayAppointments.map((apt) => (
                          <div key={apt.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded">
                            <div>
                              <p className="text-sm font-medium">{getPatientDisplay(apt)}</p>
                              <p className="text-xs text-muted-foreground">{apt.time} - {apt.type}</p>
                              {apt.family_members && (
                                <p className="text-xs text-muted-foreground">{getPatientSubDisplay(apt)}</p>
                              )}
                            </div>
                            <Badge className={statusColors[apt.status]}>{apt.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })}
                {viewDates.filter(date => getAppointmentsForDate(date).length > 0).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No appointments this month</p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Week/Day View */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
              {viewDates.map((date) => {
                const dayAppointments = getAppointmentsForDate(date);
                const isToday = isSameDay(date, new Date());

                return (
                  <Card key={date.toISOString()} className={cn("glass-card", isToday && "ring-2 ring-primary")}>
                    <CardHeader className="pb-2">
                      <CardTitle className={cn("text-sm font-medium", isToday ? "text-primary" : "text-foreground")}>
                        {format(date, "EEE, MMM d")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {dayAppointments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No appointments</p>
                      ) : (
                        dayAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-3 w-3 text-primary" />
                              <span className="text-sm font-medium">{apt.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <div>
                                <span className="text-sm truncate">{getPatientDisplay(apt)}</span>
                                {apt.family_members && (
                                  <p className="text-xs text-muted-foreground">{getPatientSubDisplay(apt)}</p>
                                )}
                              </div>
                            </div>
                            <Badge className={cn("mt-2 text-xs", statusColors[apt.status])}>
                              {apt.status}
                            </Badge>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Mobile Week/Day View */}
            <div className="md:hidden space-y-3">
              {viewDates.map((date) => {
                const dayAppointments = getAppointmentsForDate(date);
                const isToday = isSameDay(date, new Date());

                return (
                  <Card key={date.toISOString()} className={cn("p-3", isToday && "ring-2 ring-primary")}>
                    <p className={cn("font-medium mb-2", isToday && "text-primary")}>
                      {format(date, "EEEE, MMM d")}
                    </p>
                    {dayAppointments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No appointments</p>
                    ) : (
                      <div className="space-y-2">
                        {dayAppointments.map((apt) => (
                          <div key={apt.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded">
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <p className="text-sm font-medium">{apt.time}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">{getPatientDisplay(apt)}</p>
                                <p className="text-xs text-muted-foreground">{apt.type}</p>
                                {apt.family_members && (
                                  <p className="text-xs text-muted-foreground">{getPatientSubDisplay(apt)}</p>
                                )}
                              </div>
                            </div>
                            <Badge className={cn("text-xs", statusColors[apt.status])}>
                              {apt.status}
                            </Badge>
                          </div>
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