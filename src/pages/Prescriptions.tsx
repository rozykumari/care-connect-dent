import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useStore } from "@/store/useStore";
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
import { format } from "date-fns";
import { Plus, Search, Printer, Eye, Trash2, X } from "lucide-react";
import { Prescription, Medication } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { escapeHtml } from "@/lib/helpers";
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

const Prescriptions = () => {
  const { prescriptions, patients, addPrescription, deletePrescription } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewPrescription, setViewPrescription] = useState<Prescription | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    patientId: "",
    diagnosis: "",
    instructions: "",
    dentistName: "Dr. Smith",
    medications: [] as Medication[],
  });

  const [newMed, setNewMed] = useState({
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
    quantity: 0,
  });

  const resetForm = () => {
    setFormData({
      patientId: "",
      diagnosis: "",
      instructions: "",
      dentistName: "Dr. Smith",
      medications: [],
    });
    setNewMed({ name: "", dosage: "", frequency: "", duration: "", quantity: 0 });
  };

  const addMedication = () => {
    if (newMed.name && newMed.dosage) {
      setFormData({
        ...formData,
        medications: [...formData.medications, newMed],
      });
      setNewMed({ name: "", dosage: "", frequency: "", duration: "", quantity: 0 });
    }
  };

  const removeMedication = (index: number) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = () => {
    const patient = patients.find((p) => p.id === formData.patientId);
    if (!patient) return;

    const newPrescription: Prescription = {
      id: crypto.randomUUID(),
      patientId: formData.patientId,
      patientName: patient.name,
      medications: formData.medications,
      diagnosis: formData.diagnosis,
      instructions: formData.instructions,
      date: new Date().toISOString(),
      dentistName: formData.dentistName,
    };

    addPrescription(newPrescription);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = () => {
    if (deleteId) {
      deletePrescription(deleteId);
      setDeleteId(null);
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Prescription</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; margin-bottom: 20px; }
                .header h1 { color: #0ea5e9; margin: 0; }
                .patient-info { margin-bottom: 20px; }
                .medications { margin: 20px 0; }
                .medication { padding: 10px; border: 1px solid #e5e7eb; margin-bottom: 10px; border-radius: 8px; }
                .instructions { background: #f3f4f6; padding: 15px; border-radius: 8px; }
                .footer { margin-top: 40px; text-align: right; }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const filteredPrescriptions = prescriptions.filter(
    (rx) =>
      rx.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Prescriptions</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage patient prescriptions
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search prescriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  New Prescription
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Prescription</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Patient</Label>
                      <Select
                        value={formData.patientId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, patientId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Dentist Name</Label>
                      <Input
                        value={formData.dentistName}
                        onChange={(e) =>
                          setFormData({ ...formData, dentistName: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Diagnosis</Label>
                    <Textarea
                      placeholder="Enter diagnosis..."
                      value={formData.diagnosis}
                      onChange={(e) =>
                        setFormData({ ...formData, diagnosis: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Medications</Label>
                    
                    {formData.medications.map((med, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{med.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {med.dosage} - {med.frequency} for {med.duration}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMedication(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <div className="grid grid-cols-2 gap-2 p-4 border border-dashed rounded-lg">
                      <Input
                        placeholder="Medicine name"
                        value={newMed.name}
                        onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                      />
                      <Input
                        placeholder="Dosage (e.g., 500mg)"
                        value={newMed.dosage}
                        onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                      />
                      <Input
                        placeholder="Frequency (e.g., Twice daily)"
                        value={newMed.frequency}
                        onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                      />
                      <Input
                        placeholder="Duration (e.g., 5 days)"
                        value={newMed.duration}
                        onChange={(e) => setNewMed({ ...newMed, duration: e.target.value })}
                      />
                      <Input
                        type="number"
                        placeholder="Quantity"
                        value={newMed.quantity || ""}
                        onChange={(e) => setNewMed({ ...newMed, quantity: parseInt(e.target.value) || 0 })}
                      />
                      <Button onClick={addMedication} variant="secondary">
                        Add Medication
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Instructions</Label>
                    <Textarea
                      placeholder="Special instructions for the patient..."
                      value={formData.instructions}
                      onChange={(e) =>
                        setFormData({ ...formData, instructions: e.target.value })
                      }
                    />
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full gradient-primary"
                    disabled={!formData.patientId || formData.medications.length === 0}
                  >
                    Create Prescription
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="glass-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Medications</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Dentist</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No prescriptions found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPrescriptions.map((rx) => (
                    <TableRow key={rx.id}>
                      <TableCell className="font-medium">{rx.patientName}</TableCell>
                      <TableCell className="max-w-xs truncate">{rx.diagnosis}</TableCell>
                      <TableCell>{rx.medications.length} items</TableCell>
                      <TableCell>
                        {format(new Date(rx.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{rx.dentistName}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewPrescription(rx)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(rx.id)}
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
      </div>

      {/* View/Print Dialog */}
      <Dialog open={!!viewPrescription} onOpenChange={() => setViewPrescription(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
          </DialogHeader>
          
          {viewPrescription && (
            <>
              <div ref={printRef} className="space-y-4">
                <div className="header text-center border-b-2 border-primary pb-4">
                  <h1 className="text-2xl font-bold text-primary">DentaCare Clinic</h1>
                  <p className="text-muted-foreground">123 Medical Street, City</p>
                  <p className="text-muted-foreground">Phone: +91 98765 43210</p>
                </div>

                <div className="patient-info grid grid-cols-2 gap-4 py-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Patient</p>
                    <p className="font-medium">{viewPrescription.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {format(new Date(viewPrescription.date), "MMMM d, yyyy")}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Diagnosis</p>
                    <p className="font-medium">{viewPrescription.diagnosis}</p>
                  </div>
                </div>

                <div className="medications">
                  <p className="font-semibold mb-2">Medications:</p>
                  {viewPrescription.medications.map((med, index) => (
                    <div key={index} className="medication p-3 border rounded-lg mb-2">
                      <p className="font-medium">{index + 1}. {med.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {med.dosage} | {med.frequency} | {med.duration} | Qty: {med.quantity}
                      </p>
                    </div>
                  ))}
                </div>

                {viewPrescription.instructions && (
                  <div className="instructions bg-secondary/50 p-4 rounded-lg">
                    <p className="font-semibold mb-1">Instructions:</p>
                    <p className="text-sm">{viewPrescription.instructions}</p>
                  </div>
                )}

                <div className="footer text-right pt-8">
                  <p className="font-medium">{viewPrescription.dentistName}</p>
                  <p className="text-sm text-muted-foreground">Dentist</p>
                </div>
              </div>

              <Button onClick={handlePrint} className="w-full gradient-primary mt-4">
                <Printer className="h-4 w-4 mr-2" />
                Print Prescription
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prescription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this prescription? This action cannot be undone.
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

export default Prescriptions;
