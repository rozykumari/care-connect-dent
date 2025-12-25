import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { 
  User, 
  Calendar, 
  Pill, 
  Activity, 
  AlertTriangle, 
  FileText,
  Clock,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { toast } from "sonner";

interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  date_of_birth: string | null;
  address: string | null;
  medical_history: string | null;
  allergies: string | null;
  user_id: string | null;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  type: string;
  status: string;
  notes: string | null;
}

interface Prescription {
  id: string;
  name: string;
  dose: string;
  time_morning: boolean;
  time_noon: boolean;
  time_evening: boolean;
  time_sos: boolean;
  created_at: string;
}

interface Procedure {
  id: string;
  name: string;
  description: string | null;
  status: string;
  date: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface PatientMedicalRecordsProps {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PatientMedicalRecords = ({ patient, open, onOpenChange }: PatientMedicalRecordsProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patient && open) {
      fetchMedicalRecords();
    }
  }, [patient, open]);

  const fetchMedicalRecords = async () => {
    if (!patient) return;
    setLoading(true);

    try {
      // Fetch appointments for this patient
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select("id, date, time, type, status, notes")
        .eq("patient_id", patient.id)
        .order("date", { ascending: false });

      if (appointmentsError) throw appointmentsError;
      setAppointments(appointmentsData || []);

      // If patient has a user_id, fetch their prescriptions and procedures
      if (patient.user_id) {
        const [prescRes, procRes] = await Promise.all([
          supabase
            .from("patient_prescriptions")
            .select("*")
            .eq("user_id", patient.user_id)
            .order("created_at", { ascending: false }),
          supabase
            .from("patient_procedures")
            .select("*")
            .eq("user_id", patient.user_id)
            .order("created_at", { ascending: false }),
        ]);

        if (prescRes.data) setPrescriptions(prescRes.data);
        if (procRes.data) setProcedures(procRes.data);
      } else {
        setPrescriptions([]);
        setProcedures([]);
      }
    } catch (error) {
      console.error("Error fetching medical records:", error);
      toast.error("Failed to load medical records");
    } finally {
      setLoading(false);
    }
  };

  const renderTimingBadges = (p: Prescription) => {
    const badges = [];
    if (p.time_morning) badges.push(<Badge key="m" variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs">Morning</Badge>);
    if (p.time_noon) badges.push(<Badge key="n" variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">Noon</Badge>);
    if (p.time_evening) badges.push(<Badge key="e" variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-xs">Evening</Badge>);
    if (p.time_sos) badges.push(<Badge key="sos" variant="outline" className="bg-red-100 text-red-800 border-red-300 text-xs">SOS</Badge>);
    return <div className="flex flex-wrap gap-1">{badges}</div>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      scheduled: "bg-blue-100 text-blue-800 border-blue-300",
      completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
      cancelled: "bg-red-100 text-red-800 border-red-300",
      "in-progress": "bg-amber-100 text-amber-800 border-amber-300",
      planned: "bg-gray-100 text-gray-800 border-gray-300",
    };
    return variants[status] || variants.planned;
  };

  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="block">{patient.name}</span>
              <span className="text-sm font-normal text-muted-foreground">Medical Records</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <ScrollArea className="flex-1 overflow-auto">
            <div className="space-y-4 p-1">
              {/* Patient Info Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{patient.phone}</span>
                    </div>
                    {patient.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                    )}
                    {patient.date_of_birth && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(patient.date_of_birth), "MMM d, yyyy")}</span>
                      </div>
                    )}
                    {patient.address && (
                      <div className="flex items-center gap-2 text-sm col-span-full">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>{patient.address}</span>
                      </div>
                    )}
                  </div>

                  {(patient.allergies || patient.medical_history) && <Separator className="my-4" />}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {patient.allergies && (
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-1">
                          <AlertTriangle className="h-4 w-4" />
                          Allergies
                        </div>
                        <p className="text-sm text-muted-foreground">{patient.allergies}</p>
                      </div>
                    )}
                    {patient.medical_history && (
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium mb-1">
                          <FileText className="h-4 w-4" />
                          Medical History
                        </div>
                        <p className="text-sm text-muted-foreground">{patient.medical_history}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for different records */}
              <Tabs defaultValue="appointments" className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="appointments" className="text-xs sm:text-sm">
                    <Calendar className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Appointments</span>
                    <span className="sm:hidden">Appts</span>
                    <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">{appointments.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="prescriptions" className="text-xs sm:text-sm">
                    <Pill className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Prescriptions</span>
                    <span className="sm:hidden">Meds</span>
                    <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">{prescriptions.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="procedures" className="text-xs sm:text-sm">
                    <Activity className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Procedures</span>
                    <span className="sm:hidden">Procs</span>
                    <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">{procedures.length}</Badge>
                  </TabsTrigger>
                </TabsList>

                {/* Appointments Tab */}
                <TabsContent value="appointments" className="mt-4">
                  {appointments.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No appointments found</p>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {appointments.map((apt) => (
                        <Card key={apt.id} className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{format(new Date(apt.date), "MMM d, yyyy")}</span>
                                <span className="text-muted-foreground text-sm">at {apt.time}</span>
                                <Badge variant="outline" className="capitalize text-xs">{apt.type}</Badge>
                              </div>
                              {apt.notes && (
                                <p className="text-sm text-muted-foreground mt-1">{apt.notes}</p>
                              )}
                            </div>
                            <Badge className={`${getStatusBadge(apt.status)} capitalize text-xs`}>
                              {apt.status}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Prescriptions Tab */}
                <TabsContent value="prescriptions" className="mt-4">
                  {prescriptions.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Pill className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No prescriptions found</p>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {prescriptions.map((pres) => (
                        <Card key={pres.id} className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{pres.name}</span>
                                <span className="text-muted-foreground text-sm">- {pres.dose}</span>
                              </div>
                              <div className="mt-2">{renderTimingBadges(pres)}</div>
                            </div>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(pres.created_at), "MMM d, yyyy")}
                            </span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Procedures Tab */}
                <TabsContent value="procedures" className="mt-4">
                  {procedures.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No procedures found</p>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {procedures.map((proc) => (
                        <Card key={proc.id} className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <span className="font-medium text-sm">{proc.name}</span>
                              {proc.description && (
                                <p className="text-sm text-muted-foreground mt-1">{proc.description}</p>
                              )}
                              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                {(proc.start_date || proc.date) && (
                                  <p>Start: {format(new Date(proc.start_date || proc.date!), "MMM d, yyyy")}</p>
                                )}
                                {proc.end_date && (
                                  <p>End: {format(new Date(proc.end_date), "MMM d, yyyy")}</p>
                                )}
                              </div>
                            </div>
                            <Badge className={`${getStatusBadge(proc.status)} capitalize text-xs`}>
                              {proc.status}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PatientMedicalRecords;