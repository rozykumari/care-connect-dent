import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { LogOut, User, Pill, Activity, AlertTriangle, Save, Phone, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Profile {
  full_name: string | null;
  phone: string | null;
}

interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  date_of_birth: string | null;
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
}

interface Procedure {
  id: string;
  name: string;
  description: string | null;
  status: string;
  date: string | null;
  created_at: string;
}

interface Allergy {
  id: string;
  allergen: string;
  severity: string;
  action_to_take: string | null;
}

const PatientProfile = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile>({ full_name: '', phone: '' });
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable patient details
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    date_of_birth: '',
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
        setEditForm(prev => ({
          ...prev,
          name: profileData.full_name || '',
          phone: profileData.phone || '',
        }));
      }

      // Fetch patient record linked to this user
      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (patientData) {
        setPatient(patientData);
        setEditForm({
          name: patientData.name || '',
          phone: patientData.phone || '',
          address: patientData.address || '',
          date_of_birth: patientData.date_of_birth || '',
        });
      }

      // Fetch prescriptions, procedures, allergies
      const [prescRes, procRes, allergyRes] = await Promise.all([
        supabase.from('patient_prescriptions').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('patient_procedures').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('patient_allergies').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }),
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

  const saveProfile = async () => {
    if (!editForm.name.trim() || !editForm.phone.trim()) {
      toast.error('Name and phone are required');
      return;
    }

    setSaving(true);
    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.name,
          phone: editForm.phone,
        })
        .eq('user_id', user?.id);

      if (profileError) throw profileError;

      // Update or create patient record
      if (patient) {
        const { error: patientError } = await supabase
          .from('patients')
          .update({
            name: editForm.name,
            phone: editForm.phone,
            address: editForm.address || null,
            date_of_birth: editForm.date_of_birth || null,
          })
          .eq('id', patient.id);

        if (patientError) throw patientError;
      }

      toast.success('Profile updated successfully');
      fetchData();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const renderTimingBadges = (p: Prescription) => {
    const badges = [];
    if (p.time_morning) badges.push(<Badge key="m" variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs">M</Badge>);
    if (p.time_noon) badges.push(<Badge key="n" variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">N</Badge>);
    if (p.time_evening) badges.push(<Badge key="e" variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-xs">E</Badge>);
    if (p.time_sos) badges.push(<Badge key="sos" variant="outline" className="bg-red-100 text-red-800 border-red-300 text-xs">SOS</Badge>);
    return <div className="flex flex-wrap gap-1">{badges}</div>;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-100 text-red-800 border-red-300';
      case 'moderate': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold">My Profile</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-[200px] sm:max-w-none">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        {/* Personal Details Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Personal Details
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Full Name
                </Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Mobile Number
                </Label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="Enter your mobile number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Date of Birth
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={editForm.date_of_birth}
                  onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Address
                </Label>
                <Textarea
                  id="address"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Enter your address"
                  rows={2}
                />
              </div>
            </div>
            <Button onClick={saveProfile} disabled={saving} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Details'}
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Prescriptions Section (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Pill className="h-5 w-5 text-blue-600" />
              My Prescriptions
            </CardTitle>
            <CardDescription>View your prescribed medications</CardDescription>
          </CardHeader>
          <CardContent>
            {prescriptions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No prescriptions found</p>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((p) => (
                  <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-muted-foreground">Dose: {p.dose}</p>
                      <p className="text-xs text-muted-foreground">
                        Added: {format(new Date(p.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderTimingBadges(p)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Procedures Section (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-green-600" />
              My Procedures
            </CardTitle>
            <CardDescription>View your medical procedures</CardDescription>
          </CardHeader>
          <CardContent>
            {procedures.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No procedures found</p>
            ) : (
              <div className="space-y-3">
                {procedures.map((p) => (
                  <div key={p.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <p className="font-medium">{p.name}</p>
                        {p.description && (
                          <p className="text-sm text-muted-foreground">{p.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {p.date ? `Date: ${format(new Date(p.date), 'MMM d, yyyy')}` : 'Date not set'}
                        </p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(p.status)}>
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Allergies Section (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              My Allergies
            </CardTitle>
            <CardDescription>View your allergy information</CardDescription>
          </CardHeader>
          <CardContent>
            {allergies.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No allergies recorded</p>
            ) : (
              <div className="space-y-3">
                {allergies.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <p className="font-medium">{a.allergen}</p>
                        {a.action_to_take && (
                          <p className="text-sm text-muted-foreground">Action: {a.action_to_take}</p>
                        )}
                      </div>
                      <Badge variant="outline" className={getSeverityColor(a.severity)}>
                        {a.severity}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PatientProfile;
