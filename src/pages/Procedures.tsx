import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useStore } from "@/store/useStore";
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
import { format } from "date-fns";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Procedure } from "@/types";
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

const statusColors = {
  planned: "bg-warning/20 text-warning",
  "in-progress": "bg-primary/20 text-primary",
  completed: "bg-success/20 text-success",
};

const Procedures = () => {
  const { procedures, patients, addProcedure, updateProcedure, deleteProcedure } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    patientId: "",
    name: "",
    description: "",
    status: "planned" as Procedure["status"],
    cost: 0,
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      patientId: "",
      name: "",
      description: "",
      status: "planned",
      cost: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    });
    setEditingProcedure(null);
  };

  const handleSubmit = () => {
    if (editingProcedure) {
      updateProcedure(editingProcedure.id, formData);
    } else {
      const newProcedure: Procedure = {
        id: crypto.randomUUID(),
        ...formData,
      };
      addProcedure(newProcedure);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (procedure: Procedure) => {
    setEditingProcedure(procedure);
    setFormData({
      patientId: procedure.patientId,
      name: procedure.name,
      description: procedure.description,
      status: procedure.status,
      cost: procedure.cost,
      date: procedure.date,
      notes: procedure.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteProcedure(deleteId);
      setDeleteId(null);
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient?.name || "Unknown";
  };

  const filteredProcedures = procedures.filter(
    (proc) =>
      proc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getPatientName(proc.patientId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Procedures</h1>
            <p className="text-muted-foreground mt-1">
              Track dental procedures and treatments
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search procedures..."
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
                  Add Procedure
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingProcedure ? "Edit Procedure" : "Add New Procedure"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value as Procedure["status"] })
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

                    <div className="space-y-2">
                      <Label>Cost (₹)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={formData.cost}
                        onChange={(e) =>
                          setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Additional notes..."
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                    />
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full gradient-primary"
                    disabled={!formData.patientId || !formData.name}
                  >
                    {editingProcedure ? "Update Procedure" : "Add Procedure"}
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
                  <TableHead>Procedure</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Cost</TableHead>
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
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {procedure.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getPatientName(procedure.patientId)}</TableCell>
                      <TableCell>
                        {format(new Date(procedure.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>₹{procedure.cost.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={cn(statusColors[procedure.status])}>
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
