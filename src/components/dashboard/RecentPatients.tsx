import { useState, useEffect, memo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Phone, Mail } from "lucide-react";
import { format } from "date-fns";
import { ListCardSkeleton } from "@/components/ui/skeleton-card";
import { formatAge } from "@/lib/helpers";

interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  created_at: string;
}

const PatientItem = memo(function PatientItem({ patient }: { patient: Patient }) {
  const age = patient.date_of_birth ? formatAge(patient.date_of_birth) : null;
  
  return (
    <div className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-foreground">
          {patient.name}
          {age && <span className="text-muted-foreground ml-1 text-sm">({age})</span>}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(patient.created_at), "MMM d, yyyy")}
        </p>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Phone className="h-3 w-3" />
          {patient.phone}
        </span>
        {patient.email && (
          <span className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {patient.email}
          </span>
        )}
      </div>
    </div>
  );
});

export const RecentPatients = memo(function RecentPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentPatients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, phone, email, date_of_birth, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error("Error fetching recent patients:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentPatients();
  }, [fetchRecentPatients]);

  if (loading) {
    return <ListCardSkeleton />;
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Recent Patients
        </CardTitle>
      </CardHeader>
      <CardContent>
        {patients.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No patients registered yet
          </p>
        ) : (
          <div className="space-y-3">
            {patients.map((patient) => (
              <PatientItem key={patient.id} patient={patient} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
