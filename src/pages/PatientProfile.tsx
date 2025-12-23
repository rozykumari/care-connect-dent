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
import { Plus, Trash2, LogOut, User, Pill, Activity, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Prescription {
  id: string;
  name: string;
  dose: string;
  time_morning: boolean;
  time_noon: boolean;
  time_evening: boolean;
  time_sos: boolean;
}

interface Procedure {
  id: string;
  name: string;
  description: string | null;
  status: string;
  date: string | null;
}

interface Allergy {
  id: string;
  allergen: string;
  severity: string;
  action_to_take: string | null;
}

const PatientProfile = () => {
  const { user, signOut } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [prescriptionForm, setPrescriptionForm] = useState({
    name: '',
    dose: '',
    time_morning: false,
    time_noon: false,
    time_evening: false,
    time_sos: false,
  });
  const [procedureForm, setProcedureForm] = useState({ name: '', description: '', status: 'planned', date: '' });
  const [allergyForm, setAllergyForm] = useState({ allergen: '', severity: 'mild', action_to_take: '' });
  
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [procedureDialogOpen, setProcedureDialogOpen] = useState(false);
  const [allergyDialogOpen, setAllergyDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prescRes, procRes, allergyRes] = await Promise.all([
        supabase.from('patient_prescriptions').select('*').order('created_at', { ascending: false }),
        supabase.from('patient_procedures').select('*').order('created_at', { ascending: false }),
        supabase.from('patient_allergies').select('*').order('created_at', { ascending: false }),
      ]);

      if (prescRes.data) setPrescriptions(prescRes.data);
      if (procRes.data) setProcedures(procRes.data);
      if (allergyRes.data) setAllergies(allergyRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const addPrescription = async () => {
    if (!prescriptionForm.name || !prescriptionForm.dose) {
      toast.error('Please fill all fields');
      return;
    }
    if (!prescriptionForm.time_morning && !prescriptionForm.time_noon && !prescriptionForm.time_evening && !prescriptionForm.time_sos) {
      toast.error('Please select at least one timing');
      return;
    }
    const { error } = await supabase.from('patient_prescriptions').insert({
      user_id: user?.id,
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
    if (!procedureForm.name) {
      toast.error('Please enter procedure name');
      return;
    }
    const { error } = await supabase.from('patient_procedures').insert({
      user_id: user?.id,
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
      fetchData();
    }
  };

  const addAllergy = async () => {
    if (!allergyForm.allergen) {
      toast.error('Please enter allergen');
      return;
    }
    const { error } = await supabase.from('patient_allergies').insert({
      user_id: user?.id,
      allergen: allergyForm.allergen,
      severity: allergyForm.severity,
      action_to_take: allergyForm.action_to_take || null,
    });
    if (error) {
      toast.error('Failed to add allergy');
    } else {
      toast.success('Allergy added');
      setAllergyForm({ allergen: '', severity: 'mild', action_to_take: '' });
      setAllergyDialogOpen(false);
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

  const deleteAllergy = async (id: string) => {
    const { error } = await supabase.from('patient_allergies').delete().eq('id', id);
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
            <User className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold">My Profile</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-none">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={signOut} className="gap-1 sm:gap-2 shrink-0">
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
                <CardTitle className="text-base sm:text-lg">My Prescriptions</CardTitle>
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
                        <p className="text-center text-muted-foreground py-8">No prescriptions added</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium text-sm">Name</th>
                        <th className="text-left p-3 font-medium text-sm">Dose</th>
                        <th className="text-left p-3 font-medium text-sm">Timing</th>
                        <th className="w-[50px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptions.map((p) => (
                        <tr key={p.id} className="border-b hover:bg-muted/50">
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
                        <tr><td colSpan={4} className="text-center text-muted-foreground p-8">No prescriptions added</td></tr>
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
                <CardTitle className="text-base sm:text-lg">My Procedures</CardTitle>
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
                        <p className="text-center text-muted-foreground py-8">No procedures added</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium text-sm">Name</th>
                        <th className="text-left p-3 font-medium text-sm">Status</th>
                        <th className="text-left p-3 font-medium text-sm">Date</th>
                        <th className="w-[50px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {procedures.map((p) => (
                        <tr key={p.id} className="border-b hover:bg-muted/50">
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
                        <tr><td colSpan={4} className="text-center text-muted-foreground p-8">No procedures added</td></tr>
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
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                <CardTitle className="text-base sm:text-lg">My Allergies</CardTitle>
                <Dialog open={allergyDialogOpen} onOpenChange={setAllergyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />Add Allergy
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Allergy</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                      <div>
                        <Label>Allergen</Label>
                        <Input value={allergyForm.allergen} onChange={(e) => setAllergyForm({ ...allergyForm, allergen: e.target.value })} placeholder="e.g., Penicillin" />
                      </div>
                      <div>
                        <Label>Severity</Label>
                        <Select value={allergyForm.severity} onValueChange={(v) => setAllergyForm({ ...allergyForm, severity: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mild">Mild</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="severe">Severe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Action to Take</Label>
                        <Textarea value={allergyForm.action_to_take} onChange={(e) => setAllergyForm({ ...allergyForm, action_to_take: e.target.value })} placeholder="e.g., Avoid medication, use alternative" />
                      </div>
                      <Button onClick={addAllergy} className="w-full">Add Allergy</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {/* Mobile Card View */}
                <div className="block sm:hidden">
                  <ScrollArea className="h-[60vh]">
                    <div className="space-y-3 p-4">
                      {allergies.map((a) => (
                        <Card key={a.id} className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{a.allergen}</p>
                                <Badge variant={a.severity === 'severe' ? 'destructive' : a.severity === 'moderate' ? 'secondary' : 'outline'} className="text-xs capitalize">
                                  {a.severity}
                                </Badge>
                              </div>
                              {a.action_to_take && <p className="text-xs text-muted-foreground">Action: {a.action_to_take}</p>}
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => deleteAllergy(a.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                      {allergies.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No allergies added</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium text-sm">Allergen</th>
                        <th className="text-left p-3 font-medium text-sm">Severity</th>
                        <th className="text-left p-3 font-medium text-sm">Action to Take</th>
                        <th className="w-[50px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {allergies.map((a) => (
                        <tr key={a.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 text-sm">{a.allergen}</td>
                          <td className="p-3">
                            <Badge variant={a.severity === 'severe' ? 'destructive' : a.severity === 'moderate' ? 'secondary' : 'outline'} className="capitalize">
                              {a.severity}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">{a.action_to_take || '-'}</td>
                          <td className="p-3">
                            <Button variant="ghost" size="icon" onClick={() => deleteAllergy(a.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {allergies.length === 0 && (
                        <tr><td colSpan={4} className="text-center text-muted-foreground p-8">No allergies added</td></tr>
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

export default PatientProfile;