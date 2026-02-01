import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPatientDisplay, getPatientSubDisplay, type Appointment } from "@/hooks/useAppointments";

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/20 text-primary",
  completed: "bg-green-500/20 text-green-700",
  cancelled: "bg-destructive/20 text-destructive",
  "no-show": "bg-yellow-500/20 text-yellow-700",
};

interface AppointmentCardProps {
  appointment: Appointment;
  onClick?: (apt: Appointment) => void;
  className?: string;
}

export const AppointmentCard = memo(function AppointmentCard({
  appointment,
  onClick,
  className,
}: AppointmentCardProps) {
  const patientName = getPatientDisplay(appointment);
  const subDisplay = getPatientSubDisplay(appointment);

  return (
    <div
      onClick={() => onClick?.(appointment)}
      className={cn(
        "p-3 rounded-lg bg-card border border-border hover:bg-accent/50 transition-colors",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{patientName}</p>
            {subDisplay && (
              <p className="text-xs text-muted-foreground truncate">{subDisplay}</p>
            )}
          </div>
        </div>
        <Badge
          className={cn(
            "flex-shrink-0",
            statusColors[appointment.status] || "bg-muted text-muted-foreground"
          )}
        >
          {appointment.status}
        </Badge>
      </div>
      
      <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {appointment.time}
        </span>
        <span className="capitalize">{appointment.type.replace("-", " ")}</span>
        <span>{appointment.duration} min</span>
      </div>
    </div>
  );
});
