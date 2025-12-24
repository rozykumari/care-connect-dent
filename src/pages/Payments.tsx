import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Plus, Search, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Payment {
  id: string;
  patient_id: string;
  amount: number;
  method: string;
  status: string;
  date: string;
  description: string | null;
  patient_name?: string;
}

interface Patient {
  id: string;
  name: string;
  phone: string;
  user_id: string | null;
}

interface PrescribedItem {
  id: string;
  name: string;
  type: 'medicine' | 'procedure';
  price: number;
  selected: boolean;
  details?: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning",
  completed: "bg-green-100 text-green-800",
  refunded: "bg-destructive/20 text-destructive",
};

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [prescribedItems, setPrescribedItems] = useState<PrescribedItem[]>([]);
  const [customItems, setCustomItems] = useState<PrescribedItem[]>([]);
  const [newCustomItem, setNewCustomItem] = useState({ name: '', price: 0 });

  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    patientUserId: "" as string | null,
    method: "cash",
    description: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch patients first
      const { data: patientsData } = await supabase
        .from("patients")
        .select("id, name, phone, user_id")
        .order("name");

      if (patientsData) setPatients(patientsData);

      // Fetch inventory for price lookup
      const { data: inventoryData } = await supabase
        .from("inventory")
        .select("id, name, category, price");

      if (inventoryData) setInventoryItems(inventoryData);

      // Fetch payments with patient names
      const { data: paymentsData, error } = await supabase
        .from("payments")
        .select(`
          *,
          patients!payments_patient_id_fkey (name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedPayments = paymentsData?.map((p) => ({
        ...p,
        patient_name: p.patients?.name || "Unknown",
      })) || [];

      setPayments(formattedPayments);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientPrescribedItems = async (userId: string | null) => {
    if (!userId) {
      setPrescribedItems([]);
      return;
    }

    try {
      const [prescRes, procRes] = await Promise.all([
        supabase.from('patient_prescriptions').select('*').eq('user_id', userId),
        supabase.from('patient_procedures').select('*').eq('user_id', userId),
      ]);

      const items: PrescribedItem[] = [];

      // Add prescriptions (medicines)
      if (prescRes.data) {
        prescRes.data.forEach(med => {
          // Try to find price from inventory
          const inventoryMatch = inventoryItems.find(
            inv => inv.name.toLowerCase() === med.name.toLowerCase() && inv.category === 'medicine'
          );
          const timing = [
            med.time_morning && 'M',
            med.time_noon && 'N',
            med.time_evening && 'E',
            med.time_sos && 'SOS'
          ].filter(Boolean).join(', ');
          
          items.push({
            id: med.id,
            name: med.name,
            type: 'medicine',
            price: inventoryMatch ? Number(inventoryMatch.price) : 0,
            selected: true,
            details: `${med.dose} (${timing})`
          });
        });
      }

      // Add procedures
      if (procRes.data) {
        procRes.data.forEach(proc => {
          // Try to find price from inventory
          const inventoryMatch = inventoryItems.find(
            inv => (inv.name.toLowerCase() === proc.name.toLowerCase()) && 
                   (inv.category === 'procedure' || inv.category === 'examination')
          );
          
          items.push({
            id: proc.id,
            name: proc.name,
            type: 'procedure',
            price: inventoryMatch ? Number(inventoryMatch.price) : 0,
            selected: true,
            details: proc.status
          });
        });
      }

      setPrescribedItems(items);
    } catch (error) {
      console.error("Error fetching prescribed items:", error);
    }
  };

  const handlePatientSelect = async (patient: Patient) => {
    setFormData({ 
      ...formData, 
      patientId: patient.id, 
      patientName: patient.name,
      patientUserId: patient.user_id
    });
    setPatientSearchOpen(false);
    setPatientSearch("");
    setCustomItems([]);
    await fetchPatientPrescribedItems(patient.user_id);
  };

  const toggleItemSelection = (id: string) => {
    setPrescribedItems(items => 
      items.map(item => 
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const updateItemPrice = (id: string, price: number) => {
    setPrescribedItems(items => 
      items.map(item => 
        item.id === id ? { ...item, price } : item
      )
    );
  };

  const addCustomItem = () => {
    if (!newCustomItem.name.trim()) return;
    
    setCustomItems([...customItems, {
      id: `custom-${Date.now()}`,
      name: newCustomItem.name,
      type: 'procedure',
      price: newCustomItem.price,
      selected: true
    }]);
    setNewCustomItem({ name: '', price: 0 });
  };

  const removeCustomItem = (id: string) => {
    setCustomItems(items => items.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    const prescribedTotal = prescribedItems
      .filter(item => item.selected)
      .reduce((sum, item) => sum + item.price, 0);
    const customTotal = customItems.reduce((sum, item) => sum + item.price, 0);
    return prescribedTotal + customTotal;
  };

  const handleSubmit = async () => {
    if (!formData.patientId) {
      toast.error("Please select a patient");
      return;
    }

    const totalAmount = calculateTotal();
    if (totalAmount <= 0) {
      toast.error("Please add items or set prices");
      return;
    }

    // Build description from selected items
    const selectedPrescribed = prescribedItems.filter(i => i.selected);
    const allItems = [...selectedPrescribed, ...customItems];
    const description = allItems.map(i => `${i.name}: ₹${i.price}`).join(', ');

    try {
      const { error } = await supabase.from("payments").insert({
        patient_id: formData.patientId,
        amount: totalAmount,
        method: formData.method,
        status: "completed",
        description: description || null,
      });

      if (error) throw error;

      toast.success("Payment recorded");
      setIsDialogOpen(false);
      setFormData({ patientId: "", patientName: "", patientUserId: null, method: "cash", description: "" });
      setPrescribedItems([]);
      setCustomItems([]);
      fetchData();
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment");
    }
  };

  const filteredPayments = payments.filter((p) =>
    p.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.phone.includes(patientSearch)
  );

  const totalRevenue = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Payments</h1>
            <p className="text-muted-foreground mt-1">Total Revenue: ₹{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                  {/* Patient Search */}
                  <div className="space-y-2">
                    <Label>Patient</Label>
                    <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          {formData.patientName || "Select patient..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Search by name or phone..."
                            value={patientSearch}
                            onValueChange={setPatientSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No patients found</CommandEmpty>
                            <CommandGroup>
                              {filteredPatients.slice(0, 10).map((p) => (
                                <CommandItem
                                  key={p.id}
                                  value={p.id}
                                  onSelect={() => handlePatientSelect(p)}
                                >
                                  <div>
                                    <p className="font-medium">{p.name}</p>
                                    <p className="text-sm text-muted-foreground">{p.phone}</p>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Prescribed Items */}
                  {formData.patientId && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <Label className="text-base font-medium">Prescribed Items</Label>
                        {prescribedItems.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No prescriptions found for this patient</p>
                        ) : (
                          <ScrollArea className="h-48">
                            <div className="space-y-2">
                              {prescribedItems.map((item) => (
                                <div 
                                  key={item.id} 
                                  className={cn(
                                    "flex items-center gap-3 p-2 rounded-md border",
                                    item.selected ? "bg-primary/5 border-primary/30" : "bg-muted/30"
                                  )}
                                >
                                  <Checkbox
                                    checked={item.selected}
                                    onCheckedChange={() => toggleItemSelection(item.id)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{item.name}</p>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {item.type}
                                      </Badge>
                                      {item.details && (
                                        <span className="text-xs text-muted-foreground">{item.details}</span>
                                      )}
                                    </div>
                                  </div>
                                  <Input
                                    type="number"
                                    className="w-24 text-right"
                                    value={item.price || ''}
                                    onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                                    placeholder="₹0"
                                  />
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>

                      {/* Custom Items */}
                      <div className="space-y-3">
                        <Label className="text-sm">Add Custom Item</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Item name"
                            value={newCustomItem.name}
                            onChange={(e) => setNewCustomItem({ ...newCustomItem, name: e.target.value })}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            placeholder="₹"
                            value={newCustomItem.price || ''}
                            onChange={(e) => setNewCustomItem({ ...newCustomItem, price: parseFloat(e.target.value) || 0 })}
                            className="w-24"
                          />
                          <Button size="sm" onClick={addCustomItem}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {customItems.length > 0 && (
                          <div className="space-y-2">
                            {customItems.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                                <span className="text-sm">{item.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">₹{item.price}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6"
                                    onClick={() => removeCustomItem(item.id)}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Separator />
                    </>
                  )}

                  {/* Total and Method */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Total Amount</Label>
                      <div className="text-2xl font-bold text-primary">
                        ₹{calculateTotal().toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Method</Label>
                      <Select value={formData.method} onValueChange={(v) => setFormData({ ...formData, method: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="insurance">Insurance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full"
                    disabled={!formData.patientId || calculateTotal() <= 0}
                  >
                    Record Payment - ₹{calculateTotal().toLocaleString()}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden space-y-3">
          {filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No payments found
              </CardContent>
            </Card>
          ) : (
            filteredPayments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{payment.patient_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.date), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge className={cn(statusColors[payment.status])}>{payment.status}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">₹{Number(payment.amount).toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground capitalize">{payment.method}</span>
                  </div>
                  {payment.description && (
                    <p className="text-xs text-muted-foreground mt-2 truncate">{payment.description}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <Card className="hidden sm:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.patient_name}</TableCell>
                      <TableCell>₹{Number(payment.amount).toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{payment.method}</TableCell>
                      <TableCell>{format(new Date(payment.date), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Badge className={cn(statusColors[payment.status])}>{payment.status}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                        {payment.description || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Payments;