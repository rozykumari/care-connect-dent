import { useState, useEffect, memo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ListCardSkeleton } from "@/components/ui/skeleton-card";

interface Appointment {
  id: string;
  time: string;
  type: string;
  status: string;
  patients?: {
    name: string;
  };
  family_members?: {
    name: string;
    relationship: string;
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

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">{patientName}</p>
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

export const TodayAppointments = memo(function TodayAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodayAppointments = useCallback(async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id, time, type, status,
          patients(name),
          family_members(name, relationship)
        `)
        .eq("date", today)
        .order("time", { ascending: true })
        .limit(10);

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching today's appointments:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayAppointments();
  }, [fetchTodayAppointments]);

  if (loading) {
    return <ListCardSkeleton />;
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Today's Appointments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No appointments scheduled for today
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