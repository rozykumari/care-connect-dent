import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, isBefore, startOfToday } from "date-fns";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Patient {
  id: string;
  name: string;
  phone: string;
  user_id: string | null;
}

interface Procedure {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: string;
  date: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  patient?: Patient;
}

const proceduresList = [
  "Dental Cleaning",
  "Filling",
  "Root Canal",
  "Tooth Extraction",
  "Dental Crown",
  "Dental Bridge",
  "Teeth Whitening",
  "Dental Implant",
  "Orthodontics",
  "Gum Treatment",
];

const statusColors: Record<string, string> = {
  planned: "bg-yellow-500/20 text-yellow-700",
  "in-progress": "bg-primary/20 text-primary",
  completed: "bg-green-500/20 text-green-700",
};

const Procedures = () => {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    patientId: "",
    userId: "",
    name: "",
    description: "",
    status: "planned",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [proceduresRes, patientsRes] = await Promise.all([
        supabase
          .from("patient_procedures")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("patients")
          .select("id, name, phone, user_id")
          .order("name"),
      ]);

      if (proceduresRes.error) throw proceduresRes.error;
      if (patientsRes.error) throw patientsRes.error;

      // Map procedures with patient info
      const proceduresWithPatients = (proceduresRes.data || []).map((proc) => {
        const patient = patientsRes.data?.find((p) => p.user_id === proc.user_id);
        return { ...proc, patient };
      });

      setProcedures(proceduresWithPatients);
      setPatients(patientsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load procedures");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: "",
      userId: "",
      name: "",
      description: "",
      status: "planned",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: "",
    });
    setEditingProcedure(null);
    setPatientSearchQuery("");
  };

  const handleSubmit = async () => {
    if (!formData.userId) {
      toast.error("Please select a patient");
      return;
    }
    
    if (!formData.name || formData.name.trim() === "") {
      toast.error("Please select a procedure");
      return;
    }

    // Validate dates
    if (formData.endDate && formData.startDate > formData.endDate) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      if (editingProcedure) {
        const { error } = await supabase
          .from("patient_procedures")
          .update({
            name: formData.name,
            description: formData.description || null,
            status: formData.status,
            start_date: formData.startDate || null,
            end_date: formData.endDate || null,
            date: formData.startDate || null, // Keep date for backward compatibility
          })
          .eq("id", editingProcedure.id);

        if (error) throw error;
        toast.success("Procedure updated successfully");
      } else {
        const { error } = await supabase
          .from("patient_procedures")
          .insert({
            user_id: formData.userId,
            name: formData.name,
            description: formData.description || null,
            status: formData.status,
            start_date: formData.startDate || null,
            end_date: formData.endDate || null,
            date: formData.startDate || null,
          });

        if (error) throw error;
        toast.success("Procedure added successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving procedure:", error);
      toast.error("Failed to save procedure");
    }
  };

  const handleEdit = (procedure: Procedure) => {
    setEditingProcedure(procedure);
    setFormData({
      patientId: procedure.patient?.id || "",
      userId: procedure.user_id,
      name: procedure.name,
      description: procedure.description || "",
      status: procedure.status,
      startDate: procedure.start_date || procedure.date || "",
      endDate: procedure.end_date || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("patient_procedures")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("Procedure deleted successfully");
      setDeleteId(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting procedure:", error);
      toast.error("Failed to delete procedure");
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
      p.phone.includes(patientSearchQuery)
  );

  const selectedPatient = patients.find((p) => p.id === formData.patientId);

  const filteredProcedures = procedures.filter(
    (proc) =>
      proc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proc.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proc.patient?.phone?.includes(searchQuery)
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
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Procedures</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Track dental procedures and treatments
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
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
                <Button className="gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Procedure
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProcedure ? "Edit Procedure" : "Add New Procedure"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {/* Patient Selection */}
                  <div className="space-y-2">
                    <Label>Patient (search by name or phone)</Label>
                    <Popover open={showPatientSearch} onOpenChange={setShowPatientSearch}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Search className="mr-2 h-4 w-4 shrink-0" />
                          {selectedPatient ? `${selectedPatient.name} - ${selectedPatient.phone}` : "Search patient..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Search by name or phone..." 
                            value={patientSearchQuery}
                            onValueChange={setPatientSearchQuery}
                          />
                          <CommandList>
                            <CommandEmpty>No patient found.</CommandEmpty>
                            <CommandGroup>
                              {filteredPatients.filter(p => p.user_id).map((patient) => (
                                <CommandItem
                                  key={patient.id}
                                  value={patient.name}
                                  onSelect={() => {
                                    setFormData({ 
                                      ...formData, 
                                      patientId: patient.id,
                                      userId: patient.user_id || ""
                                    });
                                    setShowPatientSearch(false);
                                    setPatientSearchQuery("");
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{patient.name}</span>
                                    <span className="text-xs text-muted-foreground">{patient.phone}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Procedure Selection */}
                  <div className="space-y-2">
                    <Label>Procedure</Label>
                    <Select
                      value={formData.name}
                      onValueChange={(value) =>
                        setFormData({ ...formData, name: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select procedure" />
                      </SelectTrigger>
                      <SelectContent>
                        {proceduresList.map((proc) => (
                          <SelectItem key={proc} value={proc}>
                            {proc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Procedure details..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Start Date and End Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({ ...formData, startDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={formData.endDate}
                        min={formData.startDate}
                        onChange={(e) =>
                          setFormData({ ...formData, endDate: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full gradient-primary"
                    disabled={!formData.userId || !formData.name}
                  >
                    {editingProcedure ? "Update Procedure" : "Add Procedure"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Desktop Table */}
        <Card className="glass-card hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Procedure</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProcedures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No procedures found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProcedures.map((procedure) => (
                    <TableRow key={procedure.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{procedure.name}</p>
                          {procedure.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {procedure.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{procedure.patient?.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{procedure.patient?.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {procedure.start_date 
                          ? format(new Date(procedure.start_date), "MMM d, yyyy")
                          : procedure.date 
                            ? format(new Date(procedure.date), "MMM d, yyyy")
                            : "-"}
                      </TableCell>
                      <TableCell>
                        {procedure.end_date 
                          ? format(new Date(procedure.end_date), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(statusColors[procedure.status] || "bg-gray-500/20 text-gray-700")}>
                          {procedure.status.replace("-", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(procedure)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(procedure.id)}
                          >
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
          {filteredProcedures.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No procedures found</p>
            </Card>
          ) : (
            filteredProcedures.map((procedure) => (
              <Card key={procedure.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{procedure.name}</p>
                      <Badge className={cn("text-xs", statusColors[procedure.status] || "bg-gray-500/20 text-gray-700")}>
                        {procedure.status.replace("-", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{procedure.patient?.name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{procedure.patient?.phone}</p>
                    <div className="text-xs text-muted-foreground mt-2">
                      {procedure.start_date && (
                        <span>Start: {format(new Date(procedure.start_date), "MMM d, yyyy")}</span>
                      )}
                      {procedure.end_date && (
                        <span className="ml-2">End: {format(new Date(procedure.end_date), "MMM d, yyyy")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(procedure)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(procedure.id)}>
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
            <AlertDialogTitle>Delete Procedure</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this procedure? This action cannot be undone.
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
    </MainLayout>
  );
};

export default Procedures;
