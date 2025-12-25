import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Phone, Mail } from "lucide-react";
import { format } from "date-fns";

interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  created_at: string;
}

export function RecentPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentPatients();
  }, []);

  const fetchRecentPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, phone, email, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error("Error fetching recent patients:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Recent Patients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
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
              <div
                key={patient.id}
                className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">{patient.name}</p>
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
