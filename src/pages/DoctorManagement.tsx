import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
import { Calendar } from '@/components/ui/calendar';
import { format, differenceInYears, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
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
  X,
  Phone,
  Mail,
  Building2,
  ChevronDown,
  CalendarIcon,
  ChevronLeft,
  ChevronRight
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
  date_of_birth: string | null;
}

interface Prescription {
  id: string;
  user_id: string | null;
  patient_id?: string | null;
  name: string;
  dose: string;
  time_morning: boolean;
  time_noon: boolean;
  time_evening: boolean;
  time_sos: boolean;
  price?: number;
  prescription_date: string;
}

interface Procedure {
  id: string;
  user_id: string | null;
  patient_id?: string | null;
  name: string;
  description: string | null;
  status: string;
  date: string | null;
  price?: number;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: number;
}

// Clinic/Doctor Configuration - Edit these values
const CLINIC_CONFIG = {
  hospitalName: 'DentaCare Clinic',
  doctorName: 'Dr. John Smith',
  qualification: 'BDS, MDS (Orthodontics)',
  address: '123 Healthcare Avenue, Medical District',
  city: 'Mumbai, Maharashtra - 400001',
  phone: '+91 98765 43210',
  email: 'contact@dentacare.com',
  registrationNo: 'MH-12345',
};

const DoctorManagement = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for visit
  const [symptoms, setSymptoms] = useState('');
  const [examination, setExamination] = useState('');
  const [newProcedure, setNewProcedure] = useState('');
  
  // Date picker for prescriptions
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [showAllDates, setShowAllDates] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Edit dialogs
  const [editingAllergies, setEditingAllergies] = useState(false);
  const [editingHistory, setEditingHistory] = useState(false);
  const [tempAllergies, setTempAllergies] = useState('');
  const [tempHistory, setTempHistory] = useState('');

  // Medicine form
  const [medicineDialogOpen, setMedicineDialogOpen] = useState(false);
  const [medicineSearchOpen, setMedicineSearchOpen] = useState(false);
  const [medicineSearch, setMedicineSearch] = useState('');
  
  // Examination search
  const [examinationSearchOpen, setExaminationSearchOpen] = useState(false);
  const [examinationSearch, setExaminationSearch] = useState('');
  const [medicineForm, setMedicineForm] = useState({
    name: '',
    dose: '',
    time_morning: false,
    time_noon: false,
    time_evening: false,
    time_sos: false,
    days: 0,
  });

  // Procedure form
  const [procedureDialogOpen, setProcedureDialogOpen] = useState(false);
  const [procedureSearchOpen, setProcedureSearchOpen] = useState(false);
  const [procedureSearch, setProcedureSearch] = useState('');
  const [procedureForm, setProcedureForm] = useState({
    name: '',
    description: '',
    status: 'planned',
    date: '',
    price: 0,
  });

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPatients();
    fetchInventory();
  }, [user]);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientData(selectedPatient.id, selectedPatient.user_id);
    } else {
      setPrescriptions([]);
      setProcedures([]);
    }
  }, [selectedPatient]);

  const fetchInventory = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, name, category, price')
        .order('name');

      if (error) throw error;
      setInventoryItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, user_id, name, phone, address, allergies, medical_history, date_of_birth')
        .order('name');
      
      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientData = async (patientId: string, userId?: string | null) => {
    try {
      const prescriptionsQuery = supabase
        .from('patient_prescriptions')
        .select('*')
        .order('prescription_date', { ascending: false });

      const proceduresQuery = supabase
        .from('patient_procedures')
        .select('*')
        .order('created_at', { ascending: false });

      const [prescRes, procRes] = await Promise.all([
        userId
          ? prescriptionsQuery.or(`user_id.eq.${userId},patient_id.eq.${patientId}`)
          : prescriptionsQuery.eq('patient_id', patientId),
        userId
          ? proceduresQuery.or(`user_id.eq.${userId},patient_id.eq.${patientId}`)
          : proceduresQuery.eq('patient_id', patientId),
      ]);

      if (prescRes.data) {
        setPrescriptions(prescRes.data);
        // Extract unique dates for the date picker
        const dates = [...new Set(prescRes.data.map(p => p.prescription_date))].filter(Boolean);
        setAvailableDates(dates);
        // If we have prescriptions, default to the most recent date
        if (dates.length > 0 && !showAllDates) {
          setSelectedDate(parseISO(dates[0]));
        }
      }
      if (procRes.data) setProcedures(procRes.data);
    } catch (error) {
      toast.error('Failed to fetch patient data');
    }
  };

  // Get age from date of birth
  const getPatientAge = (dateOfBirth: string | null): string => {
    if (!dateOfBirth) return 'N/A';
    try {
      const age = differenceInYears(new Date(), parseISO(dateOfBirth));
      return `${age} yrs`;
    } catch {
      return 'N/A';
    }
  };

  // Filter prescriptions by selected date
  const filteredPrescriptions = showAllDates 
    ? prescriptions 
    : prescriptions.filter(p => p.prescription_date === format(selectedDate, 'yyyy-MM-dd'));

  // Group prescriptions by date for "All Dates" view
  const groupedPrescriptions = prescriptions.reduce((acc, p) => {
    const date = p.prescription_date || 'Unknown';
    if (!acc[date]) acc[date] = [];
    acc[date].push(p);
    return acc;
  }, {} as Record<string, Prescription[]>);

  // Navigate to adjacent dates with prescriptions
  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDateStr = format(selectedDate, 'yyyy-MM-dd');
    const sortedDates = [...availableDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const currentIndex = sortedDates.indexOf(currentDateStr);
    
    if (direction === 'prev' && currentIndex < sortedDates.length - 1) {
      setSelectedDate(parseISO(sortedDates[currentIndex + 1]));
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedDate(parseISO(sortedDates[currentIndex - 1]));
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchOpen(false);
    setSearchQuery('');
    setSymptoms('');
    setExamination('');
    setNewProcedure('');
    setSelectedDate(new Date());
    setShowAllDates(false);
    setAvailableDates([]);
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
    if (!selectedPatient?.id || !medicineForm.name.trim() || !medicineForm.dose.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!medicineForm.time_morning && !medicineForm.time_noon && !medicineForm.time_evening && !medicineForm.time_sos) {
      toast.error('Please select at least one timing');
      return;
    }

    const { error } = await supabase.from('patient_prescriptions').insert({
      patient_id: selectedPatient.id,
      user_id: selectedPatient.user_id ?? null,
      name: medicineForm.name.trim(),
      dose: medicineForm.dose.trim(),
      time_morning: medicineForm.time_morning,
      time_noon: medicineForm.time_noon,
      time_evening: medicineForm.time_evening,
      time_sos: medicineForm.time_sos,
      prescription_date: format(selectedDate, 'yyyy-MM-dd'),
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
        days: 0,
      });
      setMedicineDialogOpen(false);
      fetchPatientData(selectedPatient.id, selectedPatient.user_id);
    }
  };

  const addProcedure = async () => {
    if (!selectedPatient?.id || !procedureForm.name.trim()) {
      toast.error('Please enter procedure name');
      return;
    }

    const { error } = await supabase.from('patient_procedures').insert({
      patient_id: selectedPatient.id,
      user_id: selectedPatient.user_id ?? null,
      name: procedureForm.name.trim(),
      description: procedureForm.description?.trim() || null,
      status: procedureForm.status,
      date: procedureForm.date || null,
    });

    if (error) {
      toast.error('Failed to add procedure');
    } else {
      toast.success('Procedure added');
      setProcedureForm({ name: '', description: '', status: 'planned', date: '', price: 0 });
      setProcedureDialogOpen(false);
      fetchPatientData(selectedPatient.id, selectedPatient.user_id);
    }
  };

  const deletePrescription = async (id: string) => {
    const { error } = await supabase.from('patient_prescriptions').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else if (selectedPatient) {
      fetchPatientData(selectedPatient.id, selectedPatient.user_id);
    }
  };

  const deleteProcedure = async (id: string) => {
    const { error } = await supabase.from('patient_procedures').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else if (selectedPatient) {
      fetchPatientData(selectedPatient.id, selectedPatient.user_id);
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
        {/* Print Header - Professional Prescription Layout */}
        <div className="hidden print:block print-prescription-header">
          {/* Top Header with Doctor Info */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 -mx-4 -mt-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                {CLINIC_CONFIG.doctorName && (
                  <h1 className="text-2xl font-bold">{CLINIC_CONFIG.doctorName}</h1>
                )}
                {CLINIC_CONFIG.qualification && (
                  <p className="opacity-80 text-sm mt-1">{CLINIC_CONFIG.qualification}</p>
                )}
                {CLINIC_CONFIG.registrationNo && (
                  <p className="opacity-60 text-xs mt-1">Reg. No: {CLINIC_CONFIG.registrationNo}</p>
                )}
              </div>
              {/* Medical Symbol */}
              <div className="opacity-60">
                <Stethoscope className="w-12 h-12" />
              </div>
            </div>
          </div>

          {/* Patient Info Row */}
          {selectedPatient && (
            <div className="border-b border-border pb-4 mb-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div className="flex">
                  <span className="font-medium w-24">Patient Name:</span>
                  <span className="border-b border-border flex-1">{selectedPatient.name}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Age:</span>
                  <span className="border-b border-border flex-1">{getPatientAge(selectedPatient.date_of_birth)}</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-24">Date:</span>
                  <span className="border-b border-border flex-1">{format(selectedDate, 'dd MMM yyyy')}</span>
                </div>
                {selectedPatient.allergies && (
                  <div className="flex">
                    <span className="font-medium w-24 text-destructive">Allergies:</span>
                    <span className="border-b border-border flex-1 text-destructive">{selectedPatient.allergies}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rx Symbol */}
          <div className="text-primary text-5xl font-serif font-bold mb-4">
            <span className="relative">R<sub className="text-3xl">x</sub></span>
          </div>
        </div>

        {/* Header Section - Professional Look */}
        <div className="print:hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 border border-primary/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Stethoscope className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Doctor's Prescription</h1>
                  <p className="text-sm text-muted-foreground">{CLINIC_CONFIG.hospitalName} • {CLINIC_CONFIG.doctorName}</p>
                </div>
              </div>
              
              {/* Patient Search */}
              <div className="flex items-center gap-2">
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      role="combobox" 
                      aria-expanded={searchOpen}
                      className="w-full md:w-80 justify-between bg-background/80 backdrop-blur-sm border-primary/30 hover:border-primary/50 h-11"
                    >
                      {selectedPatient ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <span className="truncate font-medium">{selectedPatient.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Search className="h-4 w-4" />
                          Search patient...
                        </span>
                      )}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full md:w-80 p-0" align="end">
                    <Command>
                      <CommandInput 
                        placeholder="Search by name, ID or phone..." 
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
                              className="cursor-pointer py-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium">{patient.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {patient.phone} {patient.date_of_birth && `• ${getPatientAge(patient.date_of_birth)}`}
                                  </span>
                                </div>
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
                    className="shrink-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Patient Info Card - Professional Style */}
        {selectedPatient && (
          <div className="print:block">
            {/* Patient Profile Card */}
            <Card className="print:border-0 print:shadow-none overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50">
                <CardContent className="p-4 md:p-6 print:p-0">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Patient Avatar & Basic Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xl font-bold shadow-lg print:hidden">
                        {selectedPatient.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className="text-xl font-bold text-foreground print:text-base">
                            {selectedPatient.name}
                          </h2>
                          <Badge className="bg-primary/20 text-primary border-primary/30 font-semibold text-sm px-3">
                            {getPatientAge(selectedPatient.date_of_birth)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          {selectedPatient.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" />
                              <span>{selectedPatient.phone}</span>
                            </div>
                          )}
                          {selectedPatient.date_of_birth && (
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              <span>{format(parseISO(selectedPatient.date_of_birth), 'dd MMM yyyy')}</span>
                            </div>
                          )}
                        </div>
                        {selectedPatient.address && (
                          <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <span>{selectedPatient.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Info Cards */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-80 print:hidden">
                      {/* Allergies Card */}
                      <div className={cn(
                        "flex-1 rounded-xl p-3 border transition-all",
                        selectedPatient.allergies 
                          ? "bg-destructive/5 border-destructive/20" 
                          : "bg-muted/30 border-border/50"
                      )}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className={cn(
                              "h-4 w-4",
                              selectedPatient.allergies ? "text-destructive" : "text-muted-foreground"
                            )} />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Allergies</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setTempAllergies(selectedPatient.allergies || '');
                              setEditingAllergies(true);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className={cn(
                          "text-sm line-clamp-2",
                          selectedPatient.allergies ? "text-destructive font-medium" : "text-muted-foreground italic"
                        )}>
                          {selectedPatient.allergies || "None recorded"}
                        </p>
                      </div>

                      {/* Medical History Card */}
                      <div className="flex-1 rounded-xl p-3 bg-muted/30 border border-border/50">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">History</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setTempHistory(selectedPatient.medical_history || '');
                              setEditingHistory(true);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {selectedPatient.medical_history || <span className="italic">None recorded</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        )}

        {/* Main Content - Only show when patient is selected */}
        {selectedPatient ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 print:grid-cols-2 print:gap-4">
            {/* Left Column */}
            <div className="space-y-4 print:space-y-2">
              {/* Symptoms Card */}
              <Card className={cn(
                "print:border-0 print:shadow-none border-l-4 border-l-accent",
                !symptoms && 'print:hidden'
              )}>
                <CardHeader className="pb-2 print:pb-1">
                  <CardTitle className="text-base flex items-center gap-2 print:text-sm">
                    <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Stethoscope className="h-4 w-4 text-accent print:h-3 print:w-3" />
                    </div>
                    <span>Chief Complaints</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="print:pt-0">
                  <Textarea 
                    placeholder="Enter patient symptoms and complaints..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="min-h-[100px] border-dashed resize-none print:border-0 print:min-h-0 print:p-0"
                  />
                </CardContent>
              </Card>

              {/* Examination Card */}
              <Card className={cn(
                "print:border-0 print:shadow-none border-l-4 border-l-primary",
                !examination && 'print:hidden'
              )}>
                <CardHeader className="pb-2 print:pb-1">
                  <CardTitle className="text-base flex items-center gap-2 print:text-sm">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-primary print:h-3 print:w-3" />
                    </div>
                    <span>Examination Findings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="print:pt-0 space-y-2">
                  <Popover open={examinationSearchOpen} onOpenChange={setExaminationSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start border-dashed print:hidden">
                        <Plus className="h-3 w-3 mr-2" />
                        Add from inventory...
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Search examinations..." 
                          value={examinationSearch}
                          onValueChange={setExaminationSearch}
                        />
                        <CommandList>
                          <CommandEmpty>No examinations found</CommandEmpty>
                          <CommandGroup>
                            {inventoryItems
                              .filter(item => item.category === 'examination')
                              .filter(item => item.name.toLowerCase().includes(examinationSearch.toLowerCase()))
                              .slice(0, 10)
                              .map((item) => (
                                <CommandItem
                                  key={item.id}
                                  value={item.id}
                                  onSelect={() => {
                                    setExamination(prev => 
                                      prev ? `${prev}\n• ${item.name}` : `• ${item.name}`
                                    );
                                    setExaminationSearchOpen(false);
                                    setExaminationSearch('');
                                  }}
                                >
                                  <span>{item.name}</span>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Textarea 
                    placeholder="Document clinical examination findings..."
                    value={examination}
                    onChange={(e) => setExamination(e.target.value)}
                    className="min-h-[100px] border-dashed resize-none print:border-0 print:min-h-0 print:p-0"
                  />
                </CardContent>
              </Card>

              {/* Procedures Card */}
              <Card className={cn(
                "print:border-0 print:shadow-none border-l-4 border-l-warning",
                procedures.length === 0 && 'print:hidden'
              )}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between print:pb-1">
                  <CardTitle className="text-base flex items-center gap-2 print:text-sm">
                    <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-warning print:h-3 print:w-3" />
                    </div>
                    <span>Procedures</span>
                    {procedures.length > 0 && (
                      <Badge variant="secondary" className="ml-1">{procedures.length}</Badge>
                    )}
                  </CardTitle>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setProcedureDialogOpen(true)}
                    className="h-8 border-dashed print:hidden"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </CardHeader>
                <CardContent className="print:pt-0">
                  {procedures.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center print:hidden">
                      <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No procedures scheduled</p>
                    </div>
                  ) : (
                    <div className="space-y-2 print:space-y-1">
                      {procedures.map((proc) => (
                        <div key={proc.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-muted/50 to-transparent rounded-lg border border-border/50 print:bg-transparent print:p-1 print:border-b print:rounded-none">
                          <div className="flex-1">
                            <p className="text-sm font-medium print:text-xs">{proc.name}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge 
                                variant={proc.status === 'completed' ? 'default' : proc.status === 'in-progress' ? 'secondary' : 'outline'} 
                                className={cn(
                                  "text-xs capitalize print:text-[10px]",
                                  proc.status === 'completed' && "bg-success text-success-foreground"
                                )}
                              >
                                {proc.status}
                              </Badge>
                              {proc.date && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1 print:text-[10px]">
                                  <CalendarIcon className="h-3 w-3" />
                                  {proc.date}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteProcedure(proc.id)}
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive print:hidden"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Prescription/Medicines */}
            <div className={cn("print:hidden", prescriptions.length === 0 && 'print:hidden')}>
              <Card className="print:border-0 print:shadow-none border-l-4 border-l-success h-full">
                <CardHeader className="pb-3 print:pb-1 space-y-3">
                  <div className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2 print:text-sm">
                      <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                        <Pill className="h-4 w-4 text-success print:h-3 print:w-3" />
                      </div>
                      <span>Prescription</span>
                      {filteredPrescriptions.length > 0 && (
                        <Badge variant="secondary" className="ml-1 bg-success/10 text-success">
                          {showAllDates ? prescriptions.length : filteredPrescriptions.length}
                        </Badge>
                      )}
                    </CardTitle>
                    <Button 
                      size="sm" 
                      onClick={() => setMedicineDialogOpen(true)}
                      className="h-8 bg-success hover:bg-success/90 print:hidden"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Medicine
                    </Button>
                  </div>
                  
                  {/* Date Selection for Prescriptions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 print:hidden">
                    <div className="flex gap-1">
                      <Button
                        variant={showAllDates ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowAllDates(true)}
                        className="h-7 text-xs"
                      >
                        All Dates
                      </Button>
                      <Button
                        variant={!showAllDates ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowAllDates(false)}
                        className="h-7 text-xs"
                      >
                        By Date
                      </Button>
                    </div>
                    
                    {!showAllDates && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => navigateDate('prev')}
                          disabled={availableDates.indexOf(format(selectedDate, 'yyyy-MM-dd')) >= availableDates.length - 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className={cn(
                                "h-7 text-xs justify-start",
                                !selectedDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {format(selectedDate, 'dd MMM yyyy')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => {
                                if (date) {
                                  setSelectedDate(date);
                                  setDatePickerOpen(false);
                                }
                              }}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => navigateDate('next')}
                          disabled={availableDates.indexOf(format(selectedDate, 'yyyy-MM-dd')) <= 0}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {availableDates.length > 0 && !showAllDates && (
                    <div className="flex flex-wrap gap-1 print:hidden">
                      {availableDates.slice(0, 5).map((date) => (
                        <Button
                          key={date}
                          variant={format(selectedDate, 'yyyy-MM-dd') === date ? "default" : "outline"}
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => setSelectedDate(parseISO(date))}
                        >
                          {format(parseISO(date), 'dd MMM')}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="print:pt-0">
                  <ScrollArea className="h-[350px] md:h-[450px] print:h-auto print:overflow-visible">
                    {showAllDates ? (
                      // Grouped by date view
                      prescriptions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center print:hidden">
                          <Pill className="h-10 w-10 text-muted-foreground/30 mb-3" />
                          <p className="text-sm text-muted-foreground">No medicines prescribed yet</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">Click "Add Medicine" to start prescribing</p>
                        </div>
                      ) : (
                        <div className="space-y-4 pr-2 print:space-y-1 print:pr-0">
                          {Object.entries(groupedPrescriptions)
                            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                            .map(([date, meds]) => (
                              <div key={date} className="space-y-2">
                                <div className="flex items-center gap-2 sticky top-0 bg-card/95 backdrop-blur-sm py-2 px-2 -mx-2 rounded-lg border-b border-border/50">
                                  <CalendarIcon className="h-3.5 w-3.5 text-success" />
                                  <span className="text-xs font-semibold text-foreground">
                                    {format(parseISO(date), 'EEEE, dd MMM yyyy')}
                                  </span>
                                  <Badge className="bg-success/10 text-success text-xs">{meds.length} items</Badge>
                                </div>
                                {meds.map((med, index) => (
                                  <div key={med.id} className="flex items-start justify-between p-3 bg-gradient-to-r from-muted/30 to-transparent rounded-lg border border-border/50 hover:border-success/30 transition-colors print:p-1 print:border-0 print:border-b print:rounded-none">
                                    <div className="flex items-start gap-3 flex-1">
                                      <div className="h-7 w-7 rounded-full bg-success/10 flex items-center justify-center text-success text-xs font-bold shrink-0 mt-0.5">
                                        {index + 1}
                                      </div>
                                      <div className="space-y-1.5 flex-1 print:space-y-0">
                                        <p className="font-semibold text-sm print:text-xs">{med.name}</p>
                                        <p className="text-xs text-muted-foreground">Dose: {med.dose}</p>
                                        <div className="pt-0.5 print:pt-0">{renderTimingBadges(med)}</div>
                                      </div>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => deletePrescription(med.id)}
                                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive print:hidden"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ))}
                        </div>
                      )
                    ) : (
                      // By date view
                      filteredPrescriptions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center print:hidden">
                          <Pill className="h-10 w-10 text-muted-foreground/30 mb-3" />
                          <p className="text-sm text-muted-foreground">
                            No medicines for {format(selectedDate, 'dd MMM yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1">Select a different date or add new medicines</p>
                        </div>
                      ) : (
                        <div className="space-y-2 pr-2 print:space-y-1 print:pr-0">
                          {filteredPrescriptions.map((med, index) => (
                            <div key={med.id} className="flex items-start justify-between p-3 bg-gradient-to-r from-muted/30 to-transparent rounded-lg border border-border/50 hover:border-success/30 transition-colors print:p-1 print:border-0 print:border-b print:rounded-none">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="h-7 w-7 rounded-full bg-success/10 flex items-center justify-center text-success text-xs font-bold shrink-0 mt-0.5">
                                  {index + 1}
                                </div>
                                <div className="space-y-1.5 flex-1 print:space-y-0">
                                  <p className="font-semibold text-sm print:text-xs">{med.name}</p>
                                  <p className="text-xs text-muted-foreground">Dose: {med.dose}</p>
                                  <div className="pt-0.5 print:pt-0">{renderTimingBadges(med)}</div>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => deletePrescription(med.id)}
                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive print:hidden"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="print:hidden border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <User className="h-10 w-10 text-primary/60" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Patient Selected</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                Search and select a patient from the dropdown above to view their medical records, add prescriptions, and manage their treatment.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setSearchOpen(true)}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                Search Patients
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons - Floating Style */}
        {selectedPatient && (
          <div className="flex flex-wrap gap-3 justify-end print:hidden">
            <div className="flex items-center gap-2 bg-muted/50 rounded-xl p-2">
              <Button variant="ghost" size="sm" onClick={handleSubmit} className="gap-2">
                <Save className="h-4 w-4" />
                Save Visit
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="sm" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Print Rx
              </Button>
            </div>
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
              <Popover open={medicineSearchOpen} onOpenChange={setMedicineSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {medicineForm.name || "Select or type medicine..."}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search inventory..." 
                      value={medicineSearch}
                      onValueChange={setMedicineSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <Button 
                          variant="ghost" 
                          className="w-full"
                          onClick={() => {
                            setMedicineForm({ ...medicineForm, name: medicineSearch, days: 0 });
                            setMedicineSearchOpen(false);
                          }}
                        >
                          Use "{medicineSearch}" (custom)
                        </Button>
                      </CommandEmpty>
                      <CommandGroup>
                        {inventoryItems
                          .filter(item => item.category === 'medicine')
                          .filter(item => item.name.toLowerCase().includes(medicineSearch.toLowerCase()))
                          .slice(0, 10)
                          .map((item) => (
                            <CommandItem
                              key={item.id}
                              value={item.id}
                              onSelect={() => {
                                setMedicineForm({ 
                                  ...medicineForm, 
                                  name: item.name
                                });
                                setMedicineSearchOpen(false);
                                setMedicineSearch('');
                              }}
                            >
                              <span>{item.name}</span>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Input 
                className="mt-2"
                value={medicineForm.name} 
                onChange={(e) => setMedicineForm({ ...medicineForm, name: e.target.value })} 
                placeholder="Or type medicine name manually" 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Dose *</Label>
                <Input 
                  value={medicineForm.dose} 
                  onChange={(e) => setMedicineForm({ ...medicineForm, dose: e.target.value })} 
                  placeholder="e.g., 500mg" 
                />
              </div>
              <div>
                <Label>Days</Label>
                <Input 
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={medicineForm.days || ''} 
                  onChange={(e) => setMedicineForm({ ...medicineForm, days: parseInt(e.target.value.replace(/\D/g, '')) || 0 })} 
                  placeholder="e.g., 5" 
                />
              </div>
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
              <Popover open={procedureSearchOpen} onOpenChange={setProcedureSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {procedureForm.name || "Select or type procedure..."}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search procedures/examinations..." 
                      value={procedureSearch}
                      onValueChange={setProcedureSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <Button 
                          variant="ghost" 
                          className="w-full"
                          onClick={() => {
                            setProcedureForm({ ...procedureForm, name: procedureSearch, price: 0 });
                            setProcedureSearchOpen(false);
                          }}
                        >
                          Use "{procedureSearch}" (custom)
                        </Button>
                      </CommandEmpty>
                      <CommandGroup heading="Procedures">
                        {inventoryItems
                          .filter(item => item.category === 'procedure')
                          .filter(item => item.name.toLowerCase().includes(procedureSearch.toLowerCase()))
                          .slice(0, 5)
                          .map((item) => (
                            <CommandItem
                              key={item.id}
                              value={item.id}
                              onSelect={() => {
                                setProcedureForm({ 
                                  ...procedureForm, 
                                  name: item.name, 
                                  price: Number(item.price) 
                                });
                                setProcedureSearchOpen(false);
                                setProcedureSearch('');
                              }}
                            >
                              <div className="flex justify-between w-full">
                                <span>{item.name}</span>
                                <span className="text-muted-foreground">₹{Number(item.price).toFixed(2)}</span>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                      <CommandGroup heading="Examinations">
                        {inventoryItems
                          .filter(item => item.category === 'examination')
                          .filter(item => item.name.toLowerCase().includes(procedureSearch.toLowerCase()))
                          .slice(0, 5)
                          .map((item) => (
                            <CommandItem
                              key={item.id}
                              value={item.id}
                              onSelect={() => {
                                setProcedureForm({ 
                                  ...procedureForm, 
                                  name: item.name, 
                                  price: Number(item.price) 
                                });
                                setProcedureSearchOpen(false);
                                setProcedureSearch('');
                              }}
                            >
                              <div className="flex justify-between w-full">
                                <span>{item.name}</span>
                                <span className="text-muted-foreground">₹{Number(item.price).toFixed(2)}</span>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Input 
                className="mt-2"
                value={procedureForm.name} 
                onChange={(e) => setProcedureForm({ ...procedureForm, name: e.target.value })} 
                placeholder="Or type procedure name manually" 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                <Label>Price (₹)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={procedureForm.price || ''} 
                  onChange={(e) => setProcedureForm({ ...procedureForm, price: parseFloat(e.target.value) || 0 })} 
                  placeholder="0.00" 
                />
              </div>
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
