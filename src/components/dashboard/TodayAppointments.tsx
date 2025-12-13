import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";
import { format } from "date-fns";
import { Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors = {
  scheduled: "bg-primary/20 text-primary",
  completed: "bg-success/20 text-success",
  cancelled: "bg-destructive/20 text-destructive",
  "no-show": "bg-warning/20 text-warning",
};

export function TodayAppointments() {
  const appointments = useStore((state) => state.appointments);
  const today = format(new Date(), "yyyy-MM-dd");

  const todayAppointments = appointments
    .filter((apt) => apt.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Today's Appointments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todayAppointments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No appointments scheduled for today
          </p>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{apt.patientName}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {apt.type.replace("-", " ")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{apt.time}</p>
                  <Badge className={cn("mt-1", statusColors[apt.status])}>
                    {apt.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
