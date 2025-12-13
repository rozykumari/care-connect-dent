import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useStore } from "@/store/useStore";
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
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays } from "date-fns";
import { CalendarIcon, Plus, Clock, User, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Appointment } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const appointmentTypes = [
  { value: "checkup", label: "Check-up" },
  { value: "cleaning", label: "Cleaning" },
  { value: "filling", label: "Filling" },
  { value: "extraction", label: "Extraction" },
  { value: "root-canal", label: "Root Canal" },
  { value: "consultation", label: "Consultation" },
  { value: "follow-up", label: "Follow-up" },
];

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "14:00", "14:30", "15:00", "15:30", "16:00",
  "16:30", "17:00", "17:30", "18:00",
];

const statusColors = {
  scheduled: "bg-primary/20 text-primary",
  completed: "bg-success/20 text-success",
  cancelled: "bg-destructive/20 text-destructive",
  "no-show": "bg-warning/20 text-warning",
};

const Appointments = () => {
  const { appointments, patients, addAppointment, updateAppointment } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");

  const [formData, setFormData] = useState({
    patientId: "",
    date: new Date(),
    time: "09:00",
    type: "checkup" as Appointment["type"],
    duration: 30,
    notes: "",
  });

  const handleSubmit = () => {
    const patient = patients.find((p) => p.id === formData.patientId);
    if (!patient) return;

    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      patientId: formData.patientId,
      patientName: patient.name,
      date: format(formData.date, "yyyy-MM-dd"),
      time: formData.time,
      duration: formData.duration,
      type: formData.type,
      status: "scheduled",
      notes: formData.notes,
    };

    addAppointment(newAppointment);
    setIsDialogOpen(false);
    setFormData({
      patientId: "",
      date: new Date(),
      time: "09:00",
      type: "checkup",
      duration: 30,
      notes: "",
    });
  };

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
    return appointments.filter(
      (apt) => apt.date === format(date, "yyyy-MM-dd")
    );
  };

  const filteredAppointments = appointments.filter(
    (apt) =>
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
            <p className="text-muted-foreground mt-1">
              Manage your clinic appointments
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search appointments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  New Appointment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Schedule New Appointment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Patient</Label>
                    <Select
                      value={formData.patientId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, patientId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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
                          {formData.date
                            ? format(formData.date, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) =>
                            date && setFormData({ ...formData, date })
                          }
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Select
                        value={formData.time}
                        onValueChange={(value) =>
                          setFormData({ ...formData, time: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Duration (min)</Label>
                      <Select
                        value={formData.duration.toString()}
                        onValueChange={(value) =>
                          setFormData({ ...formData, duration: parseInt(value) })
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

                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          type: value as Appointment["type"],
                        })
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

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Add any notes..."
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                    />
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full gradient-primary"
                    disabled={!formData.patientId}
                  >
                    Schedule Appointment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* View Controls */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                <TabsList>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
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
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="grid grid-cols-7 gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-muted-foreground py-2"
                  >
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
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isToday ? "text-primary" : "text-foreground"
                        )}
                      >
                        {format(date, "d")}
                      </p>
                      {dayAppointments.slice(0, 2).map((apt) => (
                        <div
                          key={apt.id}
                          className="mt-1 text-xs p-1 rounded bg-primary/20 text-primary truncate"
                        >
                          {apt.time} - {apt.patientName}
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
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            {viewDates.map((date) => {
              const dayAppointments = getAppointmentsForDate(date);
              const isToday = isSameDay(date, new Date());

              return (
                <Card
                  key={date.toISOString()}
                  className={cn(
                    "glass-card",
                    isToday && "ring-2 ring-primary"
                  )}
                >
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
                    {dayAppointments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No appointments
                      </p>
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
                            <span className="text-sm truncate">
                              {apt.patientName}
                            </span>
                          </div>
                          <Badge
                            className={cn(
                              "mt-2 text-xs",
                              statusColors[apt.status]
                            )}
                          >
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
        )}
      </div>
    </MainLayout>
  );
};

export default Appointments;
