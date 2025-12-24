import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  Printer, 
  Save, 
  User,
  MapPin,
  AlertTriangle,
  FileText,
  Stethoscope,
  Activity,
  Pill,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Patient {
  id: string;
  user_id: string | null;
  name: string;
  phone: string;
  address: string | null;
  allergies: string | null;
  medical_history: string | null;
}

interface Prescription {
  id: string;
  user_id: string;
  name: string;
  dose: string;
  time_morning: boolean;
  time_noon: boolean;
  time_evening: boolean;
  time_sos: boolean;
}

interface Procedure {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: string;
  date: string | null;
}

const DoctorManagement = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for visit
  const [symptoms, setSymptoms] = useState('');
  const [examination, setExamination] = useState('');
  const [newProcedure, setNewProcedure] = useState('');

  // Edit dialogs
  const [editingAllergies, setEditingAllergies] = useState(false);
  const [editingHistory, setEditingHistory] = useState(false);
  const [tempAllergies, setTempAllergies] = useState('');
  const [tempHistory, setTempHistory] = useState('');

  // Medicine form
  const [medicineDialogOpen, setMedicineDialogOpen] = useState(false);
  const [medicineForm, setMedicineForm] = useState({
    name: '',
    dose: '',
    time_morning: false,
    time_noon: false,
    time_evening: false,
    time_sos: false,
  });

  // Procedure form
  const [procedureDialogOpen, setProcedureDialogOpen] = useState(false);
  const [procedureForm, setProcedureForm] = useState({
    name: '',
    description: '',
    status: 'planned',
    date: '',
  });

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient?.user_id) {
      fetchPatientData(selectedPatient.user_id);
    } else {
      setPrescriptions([]);
      setProcedures([]);
    }
  }, [selectedPatient]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, user_id, name, phone, address, allergies, medical_history')
        .order('name');
      
      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientData = async (userId: string) => {
    try {
      const [prescRes, procRes] = await Promise.all([
        supabase.from('patient_prescriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('patient_procedures').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ]);

      if (prescRes.data) setPrescriptions(prescRes.data);
      if (procRes.data) setProcedures(procRes.data);
    } catch (error) {
      toast.error('Failed to fetch patient data');
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchOpen(false);
    setSearchQuery('');
    setSymptoms('');
    setExamination('');
    setNewProcedure('');
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery)
  );

  const updatePatientAllergies = async () => {
    if (!selectedPatient) return;
    
    const { error } = await supabase
      .from('patients')
      .update({ allergies: tempAllergies })
      .eq('id', selectedPatient.id);

    if (error) {
      toast.error('Failed to update allergies');
    } else {
      setSelectedPatient({ ...selectedPatient, allergies: tempAllergies });
      setEditingAllergies(false);
      toast.success('Allergies updated');
    }
  };

  const updatePatientHistory = async () => {
    if (!selectedPatient) return;
    
    const { error } = await supabase
      .from('patients')
      .update({ medical_history: tempHistory })
      .eq('id', selectedPatient.id);

    if (error) {
      toast.error('Failed to update history');
    } else {
      setSelectedPatient({ ...selectedPatient, medical_history: tempHistory });
      setEditingHistory(false);
      toast.success('History updated');
    }
  };

  const addMedicine = async () => {
    if (!selectedPatient?.user_id || !medicineForm.name || !medicineForm.dose) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!medicineForm.time_morning && !medicineForm.time_noon && !medicineForm.time_evening && !medicineForm.time_sos) {
      toast.error('Please select at least one timing');
      return;
    }

    const { error } = await supabase.from('patient_prescriptions').insert({
      user_id: selectedPatient.user_id,
      name: medicineForm.name,
      dose: medicineForm.dose,
      time_morning: medicineForm.time_morning,
      time_noon: medicineForm.time_noon,
      time_evening: medicineForm.time_evening,
      time_sos: medicineForm.time_sos,
    });

    if (error) {
      toast.error('Failed to add medicine');
    } else {
      toast.success('Medicine added');
      setMedicineForm({
        name: '',
        dose: '',
        time_morning: false,
        time_noon: false,
        time_evening: false,
        time_sos: false,
      });
      setMedicineDialogOpen(false);
      fetchPatientData(selectedPatient.user_id);
    }
  };

  const addProcedure = async () => {
    if (!selectedPatient?.user_id || !procedureForm.name) {
      toast.error('Please enter procedure name');
      return;
    }

    const { error } = await supabase.from('patient_procedures').insert({
      user_id: selectedPatient.user_id,
      name: procedureForm.name,
      description: procedureForm.description || null,
      status: procedureForm.status,
      date: procedureForm.date || null,
    });

    if (error) {
      toast.error('Failed to add procedure');
    } else {
      toast.success('Procedure added');
      setProcedureForm({ name: '', description: '', status: 'planned', date: '' });
      setProcedureDialogOpen(false);
      fetchPatientData(selectedPatient.user_id);
    }
  };

  const deletePrescription = async (id: string) => {
    const { error } = await supabase.from('patient_prescriptions').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else if (selectedPatient?.user_id) {
      fetchPatientData(selectedPatient.user_id);
    }
  };

  const deleteProcedure = async (id: string) => {
    const { error } = await supabase.from('patient_procedures').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else if (selectedPatient?.user_id) {
      fetchPatientData(selectedPatient.user_id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = () => {
    toast.success('Visit record saved successfully');
  };

  const renderTimingBadges = (p: Prescription) => {
    const badges = [];
    if (p.time_morning) badges.push(<Badge key="m" variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs">M</Badge>);
    if (p.time_noon) badges.push(<Badge key="n" variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">N</Badge>);
    if (p.time_evening) badges.push(<Badge key="e" variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-xs">E</Badge>);
    if (p.time_sos) badges.push(<Badge key="sos" variant="outline" className="bg-red-100 text-red-800 border-red-300 text-xs">SOS</Badge>);
    return <div className="flex flex-wrap gap-1">{badges}</div>;
  };

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
      <div className="space-y-4 md:space-y-6 print:space-y-2" ref={printRef}>
        {/* Header with Patient Search */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Patient Management</h1>
            <p className="text-sm text-muted-foreground">Search and manage patient records</p>
          </div>

          {/* Patient Search */}
          <div className="flex flex-col sm:flex-row gap-3 print:hidden">
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  role="combobox" 
                  aria-expanded={searchOpen}
                  className="w-full sm:w-80 justify-between"
                >
                  {selectedPatient ? (
                    <span className="truncate">{selectedPatient.name} ({selectedPatient.id.slice(0, 8)}...)</span>
                  ) : (
                    <span className="text-muted-foreground">Search patient by name, ID or phone...</span>
                  )}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full sm:w-80 p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search patients..." 
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>No patient found.</CommandEmpty>
                    <CommandGroup>
                      {filteredPatients.map((patient) => (
                        <CommandItem
                          key={patient.id}
                          value={patient.id}
                          onSelect={() => handlePatientSelect(patient)}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{patient.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ID: {patient.id.slice(0, 8)}... | {patient.phone}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {selectedPatient && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSelectedPatient(null)}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Selected Patient Info - Print Header */}
        {selectedPatient && (
          <div className="print:block">
            <Card className="print:border-0 print:shadow-none">
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  {/* Patient Basic Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">{selectedPatient.name}</h2>
                        <p className="text-sm text-muted-foreground">ID: {selectedPatient.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    {selectedPatient.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground">{selectedPatient.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Allergies - Editable */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        Allergies
                      </Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setTempAllergies(selectedPatient.allergies || '');
                          setEditingAllergies(true);
                        }}
                        className="h-7 px-2 print:hidden"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="p-2 bg-destructive/5 rounded-md min-h-[60px] text-sm">
                      {selectedPatient.allergies || <span className="text-muted-foreground italic">No allergies recorded</span>}
                    </div>
                  </div>

                  {/* History - Editable */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Medical History
                      </Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setTempHistory(selectedPatient.medical_history || '');
                          setEditingHistory(true);
                        }}
                        className="h-7 px-2 print:hidden"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-md min-h-[60px] text-sm">
                      {selectedPatient.medical_history || <span className="text-muted-foreground italic">No history recorded</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content - Only show when patient is selected */}
        {selectedPatient ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Symptoms */}
              <Card className="print:border-0 print:shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Symptoms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    placeholder="Enter patient symptoms..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="min-h-[80px] print:border-0"
                  />
                </CardContent>
              </Card>

              {/* Examination */}
              <Card className="print:border-0 print:shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Examination
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    placeholder="Enter examination findings..."
                    value={examination}
                    onChange={(e) => setExamination(e.target.value)}
                    className="min-h-[80px] print:border-0"
                  />
                </CardContent>
              </Card>

              {/* Procedures */}
              <Card className="print:border-0 print:shadow-none">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Procedures
                  </CardTitle>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setProcedureDialogOpen(true)}
                    className="h-8 print:hidden"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </CardHeader>
                <CardContent>
                  {procedures.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No procedures</p>
                  ) : (
                    <div className="space-y-2">
                      {procedures.map((proc) => (
                        <div key={proc.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{proc.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant={proc.status === 'completed' ? 'default' : proc.status === 'in-progress' ? 'secondary' : 'outline'} 
                                className="text-xs capitalize"
                              >
                                {proc.status}
                              </Badge>
                              {proc.date && <span className="text-xs text-muted-foreground">{proc.date}</span>}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteProcedure(proc.id)}
                            className="h-8 w-8 print:hidden"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Medicines */}
            <div>
              <Card className="print:border-0 print:shadow-none">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    Medicines
                  </CardTitle>
                  <Button 
                    size="sm" 
                    onClick={() => setMedicineDialogOpen(true)}
                    className="h-8 print:hidden"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] md:h-[400px]">
                    {prescriptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No medicines prescribed</p>
                    ) : (
                      <div className="space-y-2 pr-2">
                        {prescriptions.map((med) => (
                          <div key={med.id} className="flex items-start justify-between p-3 border rounded-lg">
                            <div className="space-y-1 flex-1">
                              <p className="font-medium text-sm">{med.name}</p>
                              <p className="text-xs text-muted-foreground">Dose: {med.dose}</p>
                              <div className="pt-1">{renderTimingBadges(med)}</div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deletePrescription(med.id)}
                              className="h-8 w-8 print:hidden"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="print:hidden">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a Patient</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Use the search field above to find and select a patient to view and manage their records.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {selectedPatient && (
          <div className="flex flex-wrap gap-3 justify-end print:hidden">
            <Button variant="outline" onClick={handleSubmit}>
              <Save className="h-4 w-4 mr-2" />
              Submit
            </Button>
            <Button variant="outline" onClick={() => {}}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        )}
      </div>

      {/* Edit Allergies Dialog */}
      <Dialog open={editingAllergies} onOpenChange={setEditingAllergies}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Allergies</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea 
              value={tempAllergies}
              onChange={(e) => setTempAllergies(e.target.value)}
              placeholder="Enter allergies..."
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingAllergies(false)}>Cancel</Button>
              <Button onClick={updatePatientAllergies}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit History Dialog */}
      <Dialog open={editingHistory} onOpenChange={setEditingHistory}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Medical History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea 
              value={tempHistory}
              onChange={(e) => setTempHistory(e.target.value)}
              placeholder="Enter medical history..."
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingHistory(false)}>Cancel</Button>
              <Button onClick={updatePatientHistory}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Medicine Dialog */}
      <Dialog open={medicineDialogOpen} onOpenChange={setMedicineDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Medicine</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <Label>Medicine Name *</Label>
              <Input 
                value={medicineForm.name} 
                onChange={(e) => setMedicineForm({ ...medicineForm, name: e.target.value })} 
                placeholder="e.g., Ibuprofen" 
              />
            </div>
            <div>
              <Label>Dose *</Label>
              <Input 
                value={medicineForm.dose} 
                onChange={(e) => setMedicineForm({ ...medicineForm, dose: e.target.value })} 
                placeholder="e.g., 500mg" 
              />
            </div>
            <div>
              <Label>Timing *</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="med-morning" 
                    checked={medicineForm.time_morning} 
                    onCheckedChange={(c) => setMedicineForm({ ...medicineForm, time_morning: !!c })} 
                  />
                  <label htmlFor="med-morning" className="text-sm">Morning</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="med-noon" 
                    checked={medicineForm.time_noon} 
                    onCheckedChange={(c) => setMedicineForm({ ...medicineForm, time_noon: !!c })} 
                  />
                  <label htmlFor="med-noon" className="text-sm">Noon</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="med-evening" 
                    checked={medicineForm.time_evening} 
                    onCheckedChange={(c) => setMedicineForm({ ...medicineForm, time_evening: !!c })} 
                  />
                  <label htmlFor="med-evening" className="text-sm">Evening</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="med-sos" 
                    checked={medicineForm.time_sos} 
                    onCheckedChange={(c) => setMedicineForm({ ...medicineForm, time_sos: !!c })} 
                  />
                  <label htmlFor="med-sos" className="text-sm">SOS</label>
                </div>
              </div>
            </div>
            <Button onClick={addMedicine} className="w-full">Add Medicine</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Procedure Dialog */}
      <Dialog open={procedureDialogOpen} onOpenChange={setProcedureDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Procedure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <Label>Procedure Name *</Label>
              <Input 
                value={procedureForm.name} 
                onChange={(e) => setProcedureForm({ ...procedureForm, name: e.target.value })} 
                placeholder="e.g., Root Canal" 
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={procedureForm.description} 
                onChange={(e) => setProcedureForm({ ...procedureForm, description: e.target.value })} 
                placeholder="Optional details" 
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select 
                value={procedureForm.status} 
                onValueChange={(v) => setProcedureForm({ ...procedureForm, status: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input 
                type="date" 
                value={procedureForm.date} 
                onChange={(e) => setProcedureForm({ ...procedureForm, date: e.target.value })} 
              />
            </div>
            <Button onClick={addProcedure} className="w-full">Add Procedure</Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default DoctorManagement;
