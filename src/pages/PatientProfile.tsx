import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Pill, Activity, AlertTriangle, Save, Phone, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FamilyMembers } from '@/components/FamilyMembers';
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
  const { user } = useAuth();
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

  const handlePhoneChange = (value: string) => {
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, '');
    setEditForm({ ...editForm, phone: digitsOnly });
  };

  const saveProfile = async () => {
    // Client-side validation (matches server-side)
    if (!editForm.name.trim() || !editForm.phone.trim()) {
      toast.error('Name and phone are required');
      return;
    }

    if (editForm.name.trim().length > 100) {
      toast.error('Name must be less than 100 characters');
      return;
    }

    if (!/^\d{10}$/.test(editForm.phone)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    if (editForm.address && editForm.address.length > 500) {
      toast.error('Address must be less than 500 characters');
      return;
    }

    if (editForm.date_of_birth && new Date(editForm.date_of_birth) > new Date()) {
      toast.error('Date of birth cannot be in the future');
      return;
    }

    if (!patient) {
      toast.error('No patient record found');
      return;
    }

    setSaving(true);
    try {
      // Use the validated RPC function for server-side validation
      const { error } = await supabase.rpc('update_patient_profile', {
        p_patient_id: patient.id,
        p_name: editForm.name.trim(),
        p_phone: editForm.phone,
        p_address: editForm.address || null,
        p_date_of_birth: editForm.date_of_birth || null,
      });

      if (error) {
        // Handle specific validation errors from server
        if (error.message.includes('phone number is already registered')) {
          toast.error('This mobile number is already registered with another patient');
        } else if (error.message.includes('Name is required')) {
          toast.error('Name is required');
        } else if (error.message.includes('Phone must be')) {
          toast.error('Please enter a valid 10-digit mobile number');
        } else {
          throw error;
        }
        return;
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
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1">{user?.email}</p>
        </div>
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
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={editForm.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
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

        {/* Family Members Section */}
        {patient && (
          <FamilyMembers patientId={patient.id} />
        )}

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
      </div>
    </MainLayout>
  );
};

export default PatientProfile;
