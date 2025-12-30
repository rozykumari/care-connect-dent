import { useState, useEffect, memo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ListCardSkeleton } from "@/components/ui/skeleton-card";
import { formatAge } from "@/lib/helpers";

interface Appointment {
  id: string;
  time: string;
  type: string;
  status: string;
  patients?: {
    name: string;
    date_of_birth: string | null;
  };
  family_members?: {
    name: string;
    relationship: string;
    date_of_birth: string | null;
  };
}

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/20 text-primary",
  completed: "bg-green-500/20 text-green-700",
  cancelled: "bg-destructive/20 text-destructive",
  "no-show": "bg-yellow-500/20 text-yellow-700",
};

const AppointmentItem = memo(function AppointmentItem({ apt }: { apt: Appointment }) {
  const patientName = apt.family_members 
    ? `${apt.family_members.name} (${apt.family_members.relationship})`
    : apt.patients?.name || "Unknown";
  
  const dateOfBirth = apt.family_members?.date_of_birth || apt.patients?.date_of_birth;
  const age = dateOfBirth ? formatAge(dateOfBirth) : null;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">
            {patientName}
            {age && <span className="text-muted-foreground ml-1 text-sm">({age})</span>}
          </p>
          <p className="text-sm text-muted-foreground capitalize">
            {apt.type.replace("-", " ")}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-foreground">{apt.time}</p>
        <Badge className={cn("mt-1", statusColors[apt.status] || "bg-gray-500/20 text-gray-700")}>
          {apt.status}
        </Badge>
      </div>
    </div>
  );
});

interface TodayAppointmentsProps {
  selectedDate?: Date;
}

export const TodayAppointments = memo(function TodayAppointments({ selectedDate }: TodayAppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const dateToFetch = selectedDate || new Date();
  const isToday = format(dateToFetch, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const dateStr = format(dateToFetch, "yyyy-MM-dd");
      
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
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  }, [dateToFetch]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  if (loading) {
    return <ListCardSkeleton />;
  }

  const title = isToday ? "Today's Appointments" : `Appointments - ${format(dateToFetch, "MMM d")}`;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No appointments scheduled for {isToday ? "today" : format(dateToFetch, "MMM d, yyyy")}
          </p>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <AppointmentItem key={apt.id} apt={apt} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
