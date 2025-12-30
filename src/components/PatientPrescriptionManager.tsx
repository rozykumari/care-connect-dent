import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Calendar as CalendarIcon, 
  Pill, 
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  User
} from "lucide-react";
import { toast } from "sonner";
import { formatAge } from "@/lib/helpers";

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

interface Prescription {
  id: string;
  name: string;
  dose: string;
  time_morning: boolean;
  time_noon: boolean;
  time_evening: boolean;
  time_sos: boolean;
  created_at: string;
  prescription_date: string;
}

interface PatientPrescriptionManagerProps {
  patient: Patient;
  onClose: () => void;
}

export const PatientPrescriptionManager = ({ patient, onClose }: PatientPrescriptionManagerProps) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newPrescription, setNewPrescription] = useState({
    name: "",
    dose: "",
    time_morning: false,
    time_noon: false,
    time_evening: false,
    time_sos: false,
  });

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("patient_prescriptions")
        .select("*")
        .eq("patient_id", patient.id)
        .order("prescription_date", { ascending: false });

      if (error) throw error;
      setPrescriptions(data || []);
      
      // Auto-select the most recent date if prescriptions exist
      if (data && data.length > 0) {
        setSelectedDate(new Date(data[0].prescription_date));
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      toast.error("Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  }, [patient.id]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleAddPrescription = async () => {
    if (!newPrescription.name.trim() || !newPrescription.dose.trim()) {
      toast.error("Please fill in medicine name and dose");
      return;
    }

    try {
      const { error } = await supabase.from("patient_prescriptions").insert({
        patient_id: patient.id,
        user_id: patient.user_id,
        name: newPrescription.name.trim(),
        dose: newPrescription.dose.trim(),
        time_morning: newPrescription.time_morning,
        time_noon: newPrescription.time_noon,
        time_evening: newPrescription.time_evening,
        time_sos: newPrescription.time_sos,
        prescription_date: format(selectedDate, "yyyy-MM-dd"),
      });

      if (error) throw error;

      toast.success("Prescription added");
      setNewPrescription({
        name: "",
        dose: "",
        time_morning: false,
        time_noon: false,
        time_evening: false,
        time_sos: false,
      });
      setShowAddForm(false);
      fetchPrescriptions();
    } catch (error) {
      console.error("Error adding prescription:", error);
      toast.error("Failed to add prescription");
    }
  };

  const handleDeletePrescription = async (id: string) => {
    try {
      const { error } = await supabase.from("patient_prescriptions").delete().eq("id", id);
      if (error) throw error;
      toast.success("Prescription deleted");
      fetchPrescriptions();
    } catch (error) {
      console.error("Error deleting prescription:", error);
      toast.error("Failed to delete prescription");
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    setSelectedDate(newDate);
  };

  // Filter prescriptions by selected date
  const prescriptionsForDate = prescriptions.filter(
    (p) => p.prescription_date === format(selectedDate, "yyyy-MM-dd")
  );

  // Get unique prescription dates
  const prescriptionDates = [...new Set(prescriptions.map((p) => p.prescription_date))].sort().reverse();

  const renderTimingBadges = (p: Prescription) => {
    const badges = [];
    if (p.time_morning) badges.push(<Badge key="m" variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs">Morning</Badge>);
    if (p.time_noon) badges.push(<Badge key="n" variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">Noon</Badge>);
    if (p.time_evening) badges.push(<Badge key="e" variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-xs">Evening</Badge>);
    if (p.time_sos) badges.push(<Badge key="sos" variant="outline" className="bg-red-100 text-red-800 border-red-300 text-xs">SOS</Badge>);
    return <div className="flex flex-wrap gap-1">{badges}</div>;
  };

  return (
    <Card className="mt-4 border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{patient.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {patient.date_of_birth ? `Age: ${formatAge(patient.date_of_birth)}` : "Age: Not specified"}
                {patient.phone && ` • ${patient.phone}`}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Picker Controls */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[160px]">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(selectedDate, "MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Prescription
          </Button>
        </div>

        {/* Quick date navigation */}
        {prescriptionDates.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-muted-foreground mr-2">Previous dates:</span>
            {prescriptionDates.slice(0, 6).map((dateStr) => (
              <Button
                key={dateStr}
                variant={format(selectedDate, "yyyy-MM-dd") === dateStr ? "default" : "outline"}
                size="sm"
                className="text-xs h-7"
                onClick={() => setSelectedDate(new Date(dateStr))}
              >
                {format(new Date(dateStr), "MMM d")}
              </Button>
            ))}
          </div>
        )}

        {/* Add Prescription Form */}
        {showAddForm && (
          <Card className="p-4 border-primary/50 bg-primary/5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">Add Prescription for {format(selectedDate, "MMM d, yyyy")}</h4>
              <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Medicine Name *</Label>
                <Input
                  placeholder="e.g., Amoxicillin"
                  value={newPrescription.name}
                  onChange={(e) => setNewPrescription({ ...newPrescription, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Dose *</Label>
                <Input
                  placeholder="e.g., 500mg"
                  value={newPrescription.dose}
                  onChange={(e) => setNewPrescription({ ...newPrescription, dose: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-3">
              <Label className="text-xs mb-2 block">Timing</Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={newPrescription.time_morning}
                    onCheckedChange={(checked) => setNewPrescription({ ...newPrescription, time_morning: !!checked })}
                  />
                  Morning
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={newPrescription.time_noon}
                    onCheckedChange={(checked) => setNewPrescription({ ...newPrescription, time_noon: !!checked })}
                  />
                  Noon
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={newPrescription.time_evening}
                    onCheckedChange={(checked) => setNewPrescription({ ...newPrescription, time_evening: !!checked })}
                  />
                  Evening
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={newPrescription.time_sos}
                    onCheckedChange={(checked) => setNewPrescription({ ...newPrescription, time_sos: !!checked })}
                  />
                  SOS
                </label>
              </div>
            </div>
            <Button className="mt-4 w-full" onClick={handleAddPrescription}>
              Add Prescription
            </Button>
          </Card>
        )}

        {/* Prescriptions List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : prescriptionsForDate.length === 0 ? (
          <Card className="p-6 text-center bg-muted/30">
            <Pill className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No prescriptions for {format(selectedDate, "MMM d, yyyy")}</p>
          </Card>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2">
              {prescriptionsForDate.map((pres) => (
                <Card key={pres.id} className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">{pres.name}</span>
                        <span className="text-muted-foreground text-sm">- {pres.dose}</span>
                      </div>
                      <div className="mt-2 ml-6">{renderTimingBadges(pres)}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-8 w-8"
                      onClick={() => handleDeletePrescription(pres.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Total prescriptions count */}
        {prescriptions.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Total: {prescriptions.length} prescriptions across {prescriptionDates.length} dates
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientPrescriptionManager;
