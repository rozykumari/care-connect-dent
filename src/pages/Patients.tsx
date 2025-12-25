import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Plus, Search, User, Phone, Mail, Edit, Trash2, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { PatientMedicalRecords } from "@/components/PatientMedicalRecords";

interface Patient {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  date_of_birth: string | null;
  address: string | null;
  medical_history: string | null;
  allergies: string | null;
  created_at: string;
  user_id: string | null;
}

const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedPatientForRecords, setSelectedPatientForRecords] = useState<Patient | null>(null);
  const [recordsDialogOpen, setRecordsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    address: "",
    medical_history: "",
    allergies: "",
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      date_of_birth: "",
      address: "",
      medical_history: "",
      allergies: "",
    });
    setEditingPatient(null);
  };

  const handleSubmit = async () => {
    // Validate name
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.error("Please enter patient name");
      return;
    }

    // Validate phone - must be 10 digits
    const trimmedPhone = formData.phone.trim();
    if (!trimmedPhone) {
      toast.error("Please enter phone number");
      return;
    }
    
    if (!/^\d{10}$/.test(trimmedPhone)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      // Check if phone already exists (for new patients or if phone changed)
      const phoneToCheck = trimmedPhone;
      const { data: existingPatient } = await supabase
        .from("patients")
        .select("id")
        .eq("phone", phoneToCheck)
        .neq("id", editingPatient?.id || "")
        .maybeSingle();

      if (existingPatient) {
        toast.error("This mobile number is already registered with another patient");
        return;
      }

      if (editingPatient) {
        const { error } = await supabase
          .from("patients")
          .update({
            name: trimmedName,
            email: formData.email.trim() || null,
            phone: trimmedPhone,
            date_of_birth: formData.date_of_birth || null,
            address: formData.address.trim() || null,
            medical_history: formData.medical_history.trim() || null,
            allergies: formData.allergies.trim() || null,
          })
          .eq("id", editingPatient.id);

        if (error) throw error;
        toast.success("Patient updated successfully");
      } else {
        const { error } = await supabase.from("patients").insert({
          name: trimmedName,
          email: formData.email.trim() || null,
          phone: trimmedPhone,
          date_of_birth: formData.date_of_birth || null,
          address: formData.address.trim() || null,
          medical_history: formData.medical_history.trim() || null,
          allergies: formData.allergies.trim() || null,
        });

        if (error) throw error;
        toast.success("Patient added successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPatients();
    } catch (error) {
      console.error("Error saving patient:", error);
      toast.error("Failed to save patient");
    }
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name,
      email: patient.email || "",
      phone: patient.phone,
      date_of_birth: patient.date_of_birth || "",
      address: patient.address || "",
      medical_history: patient.medical_history || "",
      allergies: patient.allergies || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from("patients").delete().eq("id", deleteId);
      if (error) throw error;

      toast.success("Patient deleted successfully");
      setDeleteId(null);
      fetchPatients();
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast.error("Failed to delete patient");
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (patient.email && patient.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      patient.phone.includes(searchQuery)
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Patients</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage patient records and contacts
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gradient-primary w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPatient ? "Edit Patient" : "Add New Patient"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone * (10 digits)</Label>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Textarea
                      placeholder="Full address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Medical History</Label>
                    <Textarea
                      placeholder="Previous conditions, surgeries, etc."
                      value={formData.medical_history}
                      onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Allergies</Label>
                    <Input
                      placeholder="Known allergies"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    />
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full gradient-primary"
                    disabled={!formData.name.trim() || !formData.phone.trim()}
                  >
                    {editingPatient ? "Update Patient" : "Add Patient"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Desktop Table View */}
        <Card className="glass-card hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">No patients found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <button 
                              onClick={() => {
                                setSelectedPatientForRecords(patient);
                                setRecordsDialogOpen(true);
                              }}
                              className="font-medium hover:text-primary hover:underline text-left"
                            >
                              {patient.name}
                            </button>
                            {patient.allergies && (
                              <p className="text-xs text-destructive">
                                Allergies: {patient.allergies}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {patient.phone}
                          </div>
                          {patient.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {patient.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {patient.date_of_birth
                          ? format(new Date(patient.date_of_birth), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(patient.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setSelectedPatientForRecords(patient);
                              setRecordsDialogOpen(true);
                            }}
                            title="View medical records"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(patient)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(patient.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {filteredPatients.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No patients found</p>
            </Card>
          ) : (
            filteredPatients.map((patient) => (
              <Card key={patient.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <button 
                        onClick={() => {
                          setSelectedPatientForRecords(patient);
                          setRecordsDialogOpen(true);
                        }}
                        className="font-medium truncate hover:text-primary hover:underline text-left"
                      >
                        {patient.name}
                      </button>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Phone className="h-3 w-3" />
                        <span>{patient.phone}</span>
                      </div>
                      {patient.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{patient.email}</span>
                        </div>
                      )}
                      {patient.allergies && (
                        <p className="text-xs text-destructive mt-1">
                          Allergies: {patient.allergies}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(patient)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(patient.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this patient? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PatientMedicalRecords 
        patient={selectedPatientForRecords}
        open={recordsDialogOpen}
        onOpenChange={setRecordsDialogOpen}
      />
    </MainLayout>
  );
};

export default Patients;