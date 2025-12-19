import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, LogOut, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';

interface Patient {
  user_id: string;
  full_name: string | null;
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
  patient_name?: string;
}

interface Procedure {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: string;
  date: string | null;
  patient_name?: string;
}

interface Allergy {
  id: string;
  user_id: string;
  allergen: string;
  severity: string;
  action_to_take: string | null;
  patient_name?: string;
}

const DoctorManagement = () => {
  const { signOut } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [prescriptionForm, setPrescriptionForm] = useState({
    patient_id: '',
    name: '',
    dose: '',
    time_morning: false,
    time_noon: false,
    time_evening: false,
    time_sos: false,
  });
  const [procedureForm, setProcedureForm] = useState({
    patient_id: '',
    name: '',
    description: '',
    status: 'planned',
    date: '',
  });

  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [procedureDialogOpen, setProcedureDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch patients (profiles)
      const { data: patientsData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .order('full_name');
      
      const patientMap = new Map<string, string>();
      patientsData?.forEach(p => patientMap.set(p.user_id, p.full_name || 'Unknown'));
      setPatients(patientsData || []);

      // Fetch all prescriptions, procedures, allergies
      const [prescRes, procRes, allergyRes] = await Promise.all([
        supabase.from('patient_prescriptions').select('*').order('created_at', { ascending: false }),
        supabase.from('patient_procedures').select('*').order('created_at', { ascending: false }),
        supabase.from('patient_allergies').select('*').order('created_at', { ascending: false }),
      ]);

      if (prescRes.data) {
        setPrescriptions(prescRes.data.map(p => ({
          ...p,
          patient_name: patientMap.get(p.user_id) || 'Unknown',
        })));
      }
      if (procRes.data) {
        setProcedures(procRes.data.map(p => ({
          ...p,
          patient_name: patientMap.get(p.user_id) || 'Unknown',
        })));
      }
      if (allergyRes.data) {
        setAllergies(allergyRes.data.map(a => ({
          ...a,
          patient_name: patientMap.get(a.user_id) || 'Unknown',
        })));
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const addPrescription = async () => {
    if (!prescriptionForm.patient_id || !prescriptionForm.name || !prescriptionForm.dose) {
      toast.error('Please select a patient and fill required fields');
      return;
    }
    if (!prescriptionForm.time_morning && !prescriptionForm.time_noon && !prescriptionForm.time_evening && !prescriptionForm.time_sos) {
      toast.error('Please select at least one timing');
      return;
    }

    const { error } = await supabase.from('patient_prescriptions').insert({
      user_id: prescriptionForm.patient_id,
      name: prescriptionForm.name,
      dose: prescriptionForm.dose,
      time_morning: prescriptionForm.time_morning,
      time_noon: prescriptionForm.time_noon,
      time_evening: prescriptionForm.time_evening,
      time_sos: prescriptionForm.time_sos,
    });

    if (error) {
      toast.error('Failed to add prescription');
    } else {
      toast.success('Prescription added');
      setPrescriptionForm({
        patient_id: '',
        name: '',
        dose: '',
        time_morning: false,
        time_noon: false,
        time_evening: false,
        time_sos: false,
      });
      setPrescriptionDialogOpen(false);
      fetchData();
    }
  };

  const addProcedure = async () => {
    if (!procedureForm.patient_id || !procedureForm.name) {
      toast.error('Please select a patient and enter procedure name');
      return;
    }

    const { error } = await supabase.from('patient_procedures').insert({
      user_id: procedureForm.patient_id,
      name: procedureForm.name,
      description: procedureForm.description || null,
      status: procedureForm.status,
      date: procedureForm.date || null,
    });

    if (error) {
      toast.error('Failed to add procedure');
    } else {
      toast.success('Procedure added');
      setProcedureForm({
        patient_id: '',
        name: '',
        description: '',
        status: 'planned',
        date: '',
      });
      setProcedureDialogOpen(false);
      fetchData();
    }
  };

  const deletePrescription = async (id: string) => {
    const { error } = await supabase.from('patient_prescriptions').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else fetchData();
  };

  const deleteProcedure = async (id: string) => {
    const { error } = await supabase.from('patient_procedures').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else fetchData();
  };

  const renderTimingBadges = (p: Prescription) => {
    const badges = [];
    if (p.time_morning) badges.push(<Badge key="m" variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">M</Badge>);
    if (p.time_noon) badges.push(<Badge key="n" variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">N</Badge>);
    if (p.time_evening) badges.push(<Badge key="e" variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">E</Badge>);
    if (p.time_sos) badges.push(<Badge key="sos" variant="outline" className="bg-red-100 text-red-800 border-red-300">SOS</Badge>);
    return <div className="flex gap-1">{badges}</div>;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Doctor Management</h1>
              <p className="text-sm text-muted-foreground">Manage patient prescriptions & procedures</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="prescriptions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="procedures">Procedures</TabsTrigger>
            <TabsTrigger value="allergies">Allergies (View Only)</TabsTrigger>
          </TabsList>

          <TabsContent value="prescriptions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>All Prescriptions</CardTitle>
                <Dialog open={prescriptionDialogOpen} onOpenChange={setPrescriptionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="mr-2 h-4 w-4" />Add Prescription</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Prescription</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Patient</Label>
                        <Select value={prescriptionForm.patient_id} onValueChange={(v) => setPrescriptionForm({ ...prescriptionForm, patient_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                          <SelectContent>
                            {patients.map((p) => (
                              <SelectItem key={p.user_id} value={p.user_id}>
                                {p.full_name || 'Unknown'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Medicine Name</Label>
                        <Input value={prescriptionForm.name} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, name: e.target.value })} placeholder="e.g., Ibuprofen" />
                      </div>
                      <div>
                        <Label>Dose</Label>
                        <Input value={prescriptionForm.dose} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dose: e.target.value })} placeholder="e.g., 500mg" />
                      </div>
                      <div>
                        <Label>Timing</Label>
                        <div className="flex gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              id="morning" 
                              checked={prescriptionForm.time_morning} 
                              onCheckedChange={(c) => setPrescriptionForm({ ...prescriptionForm, time_morning: !!c })} 
                            />
                            <label htmlFor="morning" className="text-sm">M (Morning)</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              id="noon" 
                              checked={prescriptionForm.time_noon} 
                              onCheckedChange={(c) => setPrescriptionForm({ ...prescriptionForm, time_noon: !!c })} 
                            />
                            <label htmlFor="noon" className="text-sm">N (Noon)</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              id="evening" 
                              checked={prescriptionForm.time_evening} 
                              onCheckedChange={(c) => setPrescriptionForm({ ...prescriptionForm, time_evening: !!c })} 
                            />
                            <label htmlFor="evening" className="text-sm">E (Evening)</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              id="sos" 
                              checked={prescriptionForm.time_sos} 
                              onCheckedChange={(c) => setPrescriptionForm({ ...prescriptionForm, time_sos: !!c })} 
                            />
                            <label htmlFor="sos" className="text-sm">SOS</label>
                          </div>
                        </div>
                      </div>
                      <Button onClick={addPrescription} className="w-full">Add Prescription</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Medicine</TableHead>
                      <TableHead>Dose</TableHead>
                      <TableHead>Timing</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prescriptions.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.patient_name}</TableCell>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{p.dose}</TableCell>
                        <TableCell>{renderTimingBadges(p)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deletePrescription(p.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {prescriptions.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No prescriptions</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="procedures">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>All Procedures</CardTitle>
                <Dialog open={procedureDialogOpen} onOpenChange={setProcedureDialogOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="mr-2 h-4 w-4" />Add Procedure</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Procedure</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Patient</Label>
                        <Select value={procedureForm.patient_id} onValueChange={(v) => setProcedureForm({ ...procedureForm, patient_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                          <SelectContent>
                            {patients.map((p) => (
                              <SelectItem key={p.user_id} value={p.user_id}>
                                {p.full_name || 'Unknown'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Procedure Name</Label>
                        <Input value={procedureForm.name} onChange={(e) => setProcedureForm({ ...procedureForm, name: e.target.value })} placeholder="e.g., Root Canal" />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea value={procedureForm.description} onChange={(e) => setProcedureForm({ ...procedureForm, description: e.target.value })} placeholder="Optional details" />
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Select value={procedureForm.status} onValueChange={(v) => setProcedureForm({ ...procedureForm, status: v })}>
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
                        <Input type="date" value={procedureForm.date} onChange={(e) => setProcedureForm({ ...procedureForm, date: e.target.value })} />
                      </div>
                      <Button onClick={addProcedure} className="w-full">Add Procedure</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Procedure</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {procedures.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.patient_name}</TableCell>
                        <TableCell>{p.name}</TableCell>
                        <TableCell className="capitalize">{p.status}</TableCell>
                        <TableCell>{p.date || '-'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deleteProcedure(p.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {procedures.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No procedures</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="allergies">
            <Card>
              <CardHeader>
                <CardTitle>Patient Allergies (View Only)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Allergen</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Action to Take</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allergies.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.patient_name}</TableCell>
                        <TableCell>{a.allergen}</TableCell>
                        <TableCell className="capitalize">
                          <Badge variant={a.severity === 'severe' ? 'destructive' : a.severity === 'moderate' ? 'secondary' : 'outline'}>
                            {a.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{a.action_to_take || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {allergies.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No allergies recorded</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DoctorManagement;
