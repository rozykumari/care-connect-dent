import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, LogOut, Stethoscope, Pill, Activity, AlertTriangle } from 'lucide-react';
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
      const { data: patientsData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .order('full_name');
      
      const patientMap = new Map<string, string>();
      patientsData?.forEach(p => patientMap.set(p.user_id, p.full_name || 'Unknown'));
      setPatients(patientsData || []);

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
    if (p.time_morning) badges.push(<Badge key="m" variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs">M</Badge>);
    if (p.time_noon) badges.push(<Badge key="n" variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">N</Badge>);
    if (p.time_evening) badges.push(<Badge key="e" variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-xs">E</Badge>);
    if (p.time_sos) badges.push(<Badge key="sos" variant="outline" className="bg-red-100 text-red-800 border-red-300 text-xs">SOS</Badge>);
    return <div className="flex flex-wrap gap-1">{badges}</div>;
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
      {/* Header - Responsive */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Stethoscope className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold">Doctor Portal</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Manage patient records</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={signOut} className="gap-1 sm:gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs defaultValue="prescriptions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="prescriptions" className="text-xs sm:text-sm py-2 sm:py-2.5 flex items-center gap-1 sm:gap-2">
              <Pill className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Prescriptions</span>
              <span className="xs:hidden">Rx</span>
            </TabsTrigger>
            <TabsTrigger value="procedures" className="text-xs sm:text-sm py-2 sm:py-2.5 flex items-center gap-1 sm:gap-2">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Procedures</span>
              <span className="xs:hidden">Proc</span>
            </TabsTrigger>
            <TabsTrigger value="allergies" className="text-xs sm:text-sm py-2 sm:py-2.5 flex items-center gap-1 sm:gap-2">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Allergies</span>
              <span className="xs:hidden">Allg</span>
            </TabsTrigger>
          </TabsList>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                <CardTitle className="text-base sm:text-lg">All Prescriptions</CardTitle>
                <Dialog open={prescriptionDialogOpen} onOpenChange={setPrescriptionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />Add Prescription
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Prescription</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
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
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <div className="flex items-center gap-2">
                            <Checkbox id="morning" checked={prescriptionForm.time_morning} onCheckedChange={(c) => setPrescriptionForm({ ...prescriptionForm, time_morning: !!c })} />
                            <label htmlFor="morning" className="text-sm">M (Morning)</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox id="noon" checked={prescriptionForm.time_noon} onCheckedChange={(c) => setPrescriptionForm({ ...prescriptionForm, time_noon: !!c })} />
                            <label htmlFor="noon" className="text-sm">N (Noon)</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox id="evening" checked={prescriptionForm.time_evening} onCheckedChange={(c) => setPrescriptionForm({ ...prescriptionForm, time_evening: !!c })} />
                            <label htmlFor="evening" className="text-sm">E (Evening)</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox id="sos" checked={prescriptionForm.time_sos} onCheckedChange={(c) => setPrescriptionForm({ ...prescriptionForm, time_sos: !!c })} />
                            <label htmlFor="sos" className="text-sm">SOS</label>
                          </div>
                        </div>
                      </div>
                      <Button onClick={addPrescription} className="w-full">Add Prescription</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {/* Mobile Card View */}
                <div className="block sm:hidden">
                  <ScrollArea className="h-[60vh]">
                    <div className="space-y-3 p-4">
                      {prescriptions.map((p) => (
                        <Card key={p.id} className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1 flex-1">
                              <p className="font-medium text-sm">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.patient_name}</p>
                              <p className="text-xs text-muted-foreground">Dose: {p.dose}</p>
                              <div className="pt-1">{renderTimingBadges(p)}</div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => deletePrescription(p.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                      {prescriptions.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No prescriptions</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium text-sm">Patient</th>
                        <th className="text-left p-3 font-medium text-sm">Medicine</th>
                        <th className="text-left p-3 font-medium text-sm">Dose</th>
                        <th className="text-left p-3 font-medium text-sm">Timing</th>
                        <th className="w-[50px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptions.map((p) => (
                        <tr key={p.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 text-sm">{p.patient_name}</td>
                          <td className="p-3 text-sm">{p.name}</td>
                          <td className="p-3 text-sm">{p.dose}</td>
                          <td className="p-3">{renderTimingBadges(p)}</td>
                          <td className="p-3">
                            <Button variant="ghost" size="icon" onClick={() => deletePrescription(p.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {prescriptions.length === 0 && (
                        <tr><td colSpan={5} className="text-center text-muted-foreground p-8">No prescriptions</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Procedures Tab */}
          <TabsContent value="procedures">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                <CardTitle className="text-base sm:text-lg">All Procedures</CardTitle>
                <Dialog open={procedureDialogOpen} onOpenChange={setProcedureDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />Add Procedure
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Procedure</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
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
              <CardContent className="p-0 sm:p-6">
                {/* Mobile Card View */}
                <div className="block sm:hidden">
                  <ScrollArea className="h-[60vh]">
                    <div className="space-y-3 p-4">
                      {procedures.map((p) => (
                        <Card key={p.id} className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1 flex-1">
                              <p className="font-medium text-sm">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.patient_name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={p.status === 'completed' ? 'default' : p.status === 'in-progress' ? 'secondary' : 'outline'} className="text-xs capitalize">
                                  {p.status}
                                </Badge>
                                {p.date && <span className="text-xs text-muted-foreground">{p.date}</span>}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => deleteProcedure(p.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                      {procedures.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No procedures</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium text-sm">Patient</th>
                        <th className="text-left p-3 font-medium text-sm">Procedure</th>
                        <th className="text-left p-3 font-medium text-sm">Status</th>
                        <th className="text-left p-3 font-medium text-sm">Date</th>
                        <th className="w-[50px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {procedures.map((p) => (
                        <tr key={p.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 text-sm">{p.patient_name}</td>
                          <td className="p-3 text-sm">{p.name}</td>
                          <td className="p-3">
                            <Badge variant={p.status === 'completed' ? 'default' : p.status === 'in-progress' ? 'secondary' : 'outline'} className="capitalize">
                              {p.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">{p.date || '-'}</td>
                          <td className="p-3">
                            <Button variant="ghost" size="icon" onClick={() => deleteProcedure(p.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {procedures.length === 0 && (
                        <tr><td colSpan={5} className="text-center text-muted-foreground p-8">No procedures</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Allergies Tab */}
          <TabsContent value="allergies">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg">Patient Allergies (View Only)</CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {/* Mobile Card View */}
                <div className="block sm:hidden">
                  <ScrollArea className="h-[60vh]">
                    <div className="space-y-3 p-4">
                      {allergies.map((a) => (
                        <Card key={a.id} className="p-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">{a.allergen}</p>
                              <Badge variant={a.severity === 'severe' ? 'destructive' : a.severity === 'moderate' ? 'secondary' : 'outline'} className="text-xs capitalize">
                                {a.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{a.patient_name}</p>
                            {a.action_to_take && <p className="text-xs text-muted-foreground mt-1">Action: {a.action_to_take}</p>}
                          </div>
                        </Card>
                      ))}
                      {allergies.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No allergies recorded</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium text-sm">Patient</th>
                        <th className="text-left p-3 font-medium text-sm">Allergen</th>
                        <th className="text-left p-3 font-medium text-sm">Severity</th>
                        <th className="text-left p-3 font-medium text-sm">Action to Take</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allergies.map((a) => (
                        <tr key={a.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 text-sm">{a.patient_name}</td>
                          <td className="p-3 text-sm">{a.allergen}</td>
                          <td className="p-3">
                            <Badge variant={a.severity === 'severe' ? 'destructive' : a.severity === 'moderate' ? 'secondary' : 'outline'} className="capitalize">
                              {a.severity}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">{a.action_to_take || '-'}</td>
                        </tr>
                      ))}
                      {allergies.length === 0 && (
                        <tr><td colSpan={4} className="text-center text-muted-foreground p-8">No allergies recorded</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DoctorManagement;