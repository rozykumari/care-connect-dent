import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/store/useStore";
import { Users, Phone, Mail } from "lucide-react";
import { format } from "date-fns";

export function RecentPatients() {
  const patients = useStore((state) => state.patients);
  
  const recentPatients = [...patients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Recent Patients
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentPatients.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No patients registered yet
          </p>
        ) : (
          <div className="space-y-3">
            {recentPatients.map((patient) => (
              <div
                key={patient.id}
                className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">{patient.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(patient.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {patient.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {patient.email}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
