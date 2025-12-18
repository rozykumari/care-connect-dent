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
import { Plus, Trash2, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

interface Prescription {
  id: string;
  name: string;
  dose: string;
  time: string;
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
  const [prescriptionForm, setPrescriptionForm] = useState({ name: '', dose: '', time: '' });
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
    if (!prescriptionForm.name || !prescriptionForm.dose || !prescriptionForm.time) {
      toast.error('Please fill all fields');
      return;
    }
    const { error } = await supabase.from('patient_prescriptions').insert({
      user_id: user?.id,
      ...prescriptionForm,
    });
    if (error) {
      toast.error('Failed to add prescription');
    } else {
      toast.success('Prescription added');
      setPrescriptionForm({ name: '', dose: '', time: '' });
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
            <User className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Patient Profile</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
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
            <TabsTrigger value="allergies">Allergies</TabsTrigger>
          </TabsList>

          <TabsContent value="prescriptions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Prescriptions</CardTitle>
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
                        <Label>Medicine Name</Label>
                        <Input value={prescriptionForm.name} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, name: e.target.value })} placeholder="e.g., Ibuprofen" />
                      </div>
                      <div>
                        <Label>Dose</Label>
                        <Input value={prescriptionForm.dose} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dose: e.target.value })} placeholder="e.g., 500mg" />
                      </div>
                      <div>
                        <Label>Time</Label>
                        <Input value={prescriptionForm.time} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, time: e.target.value })} placeholder="e.g., After meals, twice daily" />
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
                      <TableHead>Name</TableHead>
                      <TableHead>Dose</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prescriptions.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{p.dose}</TableCell>
                        <TableCell>{p.time}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deletePrescription(p.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {prescriptions.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No prescriptions added</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="procedures">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Procedures</CardTitle>
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
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {procedures.map((p) => (
                      <TableRow key={p.id}>
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
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No procedures added</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="allergies">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Allergies</CardTitle>
                <Dialog open={allergyDialogOpen} onOpenChange={setAllergyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="mr-2 h-4 w-4" />Add Allergy</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Allergy</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
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
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Allergen</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Action to Take</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allergies.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.allergen}</TableCell>
                        <TableCell className="capitalize">{a.severity}</TableCell>
                        <TableCell>{a.action_to_take || '-'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deleteAllergy(a.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {allergies.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No allergies added</TableCell></TableRow>
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

export default PatientProfile;
