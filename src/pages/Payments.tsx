import { useState, useEffect, useCallback, useMemo, memo, CSSProperties } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Plus, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatAge } from "@/lib/helpers";
import { PageSkeleton } from "@/components/ui/skeleton-card";
import { VirtualizedTable, VirtualizedList } from "@/components/ui/virtualized-table";
interface Payment {
  id: string;
  patient_id: string;
  amount: number;
  paid_amount: number | null;
  balance_amount: number | null;
  due_date: string | null;
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
  date_of_birth: string | null;
}

interface PrescribedItem {
  id: string;
  name: string;
  type: 'medicine' | 'procedure' | 'examination';
  price: number;
  selected: boolean;
  details?: string;
  quantity?: number;
  inventoryId?: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning",
  completed: "bg-green-100 text-green-800",
  partial: "bg-orange-100 text-orange-800",
  refunded: "bg-destructive/20 text-destructive",
};

const CONSULTING_FEE = 200;

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
  const [inventorySearchOpen, setInventorySearchOpen] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>("");

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel for better performance
      const [patientsRes, inventoryRes, paymentsRes] = await Promise.all([
        supabase
          .from("patients")
          .select("id, name, phone, user_id, date_of_birth")
          .order("name"),
        supabase
          .from("inventory")
          .select("id, name, category, price, stock"),
        supabase
          .from("payments")
          .select(`
            *,
            patients!payments_patient_id_fkey (name)
          `)
          .order("created_at", { ascending: false })
          .limit(100) // Limit initial load
      ]);

      if (patientsRes.data) setPatients(patientsRes.data);
      if (inventoryRes.data) setInventoryItems(inventoryRes.data);

      const formattedPayments = paymentsRes.data?.map((p) => ({
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
  }, []);

  const fetchPatientPrescribedItems = async (patientId: string, userId: string | null) => {
    try {
      // Build queries that check both patient_id and user_id
      const prescPromise = userId 
        ? supabase.from('patient_prescriptions').select('*').or(`user_id.eq.${userId},patient_id.eq.${patientId}`)
        : supabase.from('patient_prescriptions').select('*').eq('patient_id', patientId);
      
      const procPromise = userId
        ? supabase.from('patient_procedures').select('*').or(`user_id.eq.${userId},patient_id.eq.${patientId}`)
        : supabase.from('patient_procedures').select('*').eq('patient_id', patientId);

      const [prescRes, procRes] = await Promise.all([prescPromise, procPromise]);

      const items: PrescribedItem[] = [];

      // Add default consulting fee (selected by default)
      items.push({
        id: 'consulting-fee',
        name: 'Consulting Fee',
        type: 'procedure',
        price: CONSULTING_FEE,
        selected: true,
      });

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
            selected: false,
            details: `${med.dose} (${timing})`,
            quantity: 1,
            inventoryId: inventoryMatch?.id
          });
        });
      }

      // Add procedures and examinations
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
            type: inventoryMatch?.category === 'examination' ? 'examination' : 'procedure',
            price: inventoryMatch ? Number(inventoryMatch.price) : 0,
            selected: false,
            details: proc.status,
            inventoryId: inventoryMatch?.id
          });
        });
      }

      setPrescribedItems(items);
      // Set initial paid amount to total
      const total = items.filter(i => i.selected).reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
      setPaidAmount(total);
    } catch (error) {
      console.error("Error fetching prescribed items:", error);
      // Even on error, add consulting fee
      setPrescribedItems([{
        id: 'consulting-fee',
        name: 'Consulting Fee',
        type: 'procedure',
        price: CONSULTING_FEE,
        selected: true,
      }]);
      setPaidAmount(CONSULTING_FEE);
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
    setPaidAmount(0);
    setDueDate("");
    await fetchPatientPrescribedItems(patient.id, patient.user_id);
  };

  const updateItemQuantity = (id: string, quantity: number) => {
    setPrescribedItems(items => 
      items.map(item => 
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const toggleItemSelection = (id: string) => {
    setPrescribedItems(items => {
      const updated = items.map(item => 
        item.id === id ? { ...item, selected: !item.selected } : item
      );
      // Update paid amount when selection changes
      const total = calculateTotalFromItems(updated, customItems);
      setPaidAmount(total);
      return updated;
    });
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
    
    const newItem = {
      id: `custom-${Date.now()}`,
      name: newCustomItem.name,
      type: 'procedure' as const,
      price: newCustomItem.price,
      selected: true
    };
    const updated = [...customItems, newItem];
    setCustomItems(updated);
    setNewCustomItem({ name: '', price: 0 });
    // Update paid amount
    setPaidAmount(prev => prev + newCustomItem.price);
  };

  const removeCustomItem = (id: string) => {
    const item = customItems.find(i => i.id === id);
    setCustomItems(items => items.filter(item => item.id !== id));
    if (item) {
      setPaidAmount(prev => Math.max(0, prev - (item.price * (item.quantity || 1))));
    }
  };

  const addFromInventory = (item: InventoryItem) => {
    // Check if already added
    const existsInPrescribed = prescribedItems.some(p => p.inventoryId === item.id);
    const existsInCustom = customItems.some(c => c.inventoryId === item.id);
    
    if (existsInPrescribed || existsInCustom) {
      toast.info("Item already added");
      return;
    }

    const newItem = {
      id: `inv-${item.id}-${Date.now()}`,
      name: item.name,
      type: item.category as 'medicine' | 'procedure' | 'examination',
      price: Number(item.price),
      selected: true,
      quantity: item.category === 'medicine' ? 1 : undefined,
      inventoryId: item.id
    };
    
    setCustomItems([...customItems, newItem]);
    setInventorySearchOpen(false);
    setInventorySearch("");
    // Update paid amount
    setPaidAmount(prev => prev + Number(item.price));
  };

  const filteredInventoryForSearch = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
    item.category.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  const calculateTotalFromItems = (prescribed: PrescribedItem[], custom: PrescribedItem[]) => {
    const prescribedTotal = prescribed
      .filter(item => item.selected)
      .reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const customTotal = custom.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    return prescribedTotal + customTotal;
  };

  const calculateTotal = () => {
    return calculateTotalFromItems(prescribedItems, customItems);
  };

  const calculateBalance = () => {
    const total = calculateTotal();
    return Math.max(0, total - paidAmount);
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

    if (paidAmount <= 0) {
      toast.error("Please enter paid amount");
      return;
    }

    const balance = calculateBalance();
    if (balance > 0 && !dueDate) {
      toast.error("Please set due date for partial payment");
      return;
    }

    // Build description from selected items
    const selectedPrescribed = prescribedItems.filter(i => i.selected);
    const allItems = [...selectedPrescribed, ...customItems];
    const description = allItems.map(i => {
      const qty = i.quantity || 1;
      return qty > 1 ? `${i.name} x${qty}: ₹${i.price * qty}` : `${i.name}: ₹${i.price}`;
    }).join(', ');

    const paymentStatus = balance > 0 ? "partial" : "completed";

    try {
      // Insert payment
      const { error } = await supabase.from("payments").insert({
        patient_id: formData.patientId,
        amount: totalAmount,
        paid_amount: paidAmount,
        balance_amount: balance,
        due_date: balance > 0 ? dueDate : null,
        method: formData.method,
        status: paymentStatus,
        description: description || null,
      });

      if (error) throw error;

      // Deduct inventory for all items with inventoryId (both prescribed and custom)
      const itemsToDeduct = [
        ...selectedPrescribed.filter(item => item.inventoryId),
        ...customItems.filter(item => item.inventoryId)
      ];

      for (const item of itemsToDeduct) {
        const inventoryItem = inventoryItems.find(inv => inv.id === item.inventoryId);
        if (inventoryItem && item.type === 'medicine') {
          const newStock = Math.max(0, inventoryItem.stock - (item.quantity || 1));
          await supabase
            .from("inventory")
            .update({ stock: newStock })
            .eq("id", item.inventoryId);
        }
      }

      toast.success(balance > 0 ? "Partial payment recorded" : "Payment recorded and inventory updated");
      setIsDialogOpen(false);
      setFormData({ patientId: "", patientName: "", patientUserId: null, method: "cash", description: "" });
      setPrescribedItems([]);
      setCustomItems([]);
      setPaidAmount(0);
      setDueDate("");
      fetchData();
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment");
    }
  };

  const filteredPayments = useMemo(() => 
    payments.filter((p) =>
      p.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())
    ), [payments, searchQuery]);

  const filteredPatients = useMemo(() => 
    patients.filter((p) =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.phone.includes(patientSearch)
    ), [patients, patientSearch]);

  const { totalRevenue, totalDue } = useMemo(() => ({
    totalRevenue: payments
      .filter((p) => p.status === "completed" || p.status === "partial")
      .reduce((sum, p) => sum + Number(p.paid_amount || p.amount), 0),
    totalDue: payments
      .filter((p) => p.status === "partial")
      .reduce((sum, p) => sum + Number(p.balance_amount || 0), 0)
  }), [payments]);

  if (loading) {
    return (
      <MainLayout>
        <PageSkeleton />
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
            <div className="flex flex-wrap gap-4 mt-1">
              <p className="text-muted-foreground">Total Revenue: ₹{totalRevenue.toLocaleString()}</p>
              {totalDue > 0 && (
                <p className="text-orange-600 font-medium">Total Due: ₹{totalDue.toLocaleString()}</p>
              )}
            </div>
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
                                    <p className="font-medium">
                                      {p.name}
                                      {p.date_of_birth && (
                                        <span className="text-muted-foreground ml-2 text-sm">
                                          ({formatAge(p.date_of_birth)})
                                        </span>
                                      )}
                                    </p>
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
                                    "flex items-center gap-2 p-2 rounded-md border",
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
                                  {item.type === 'medicine' && (
                                    <Input
                                      type="number"
                                      className="w-16 text-center"
                                      value={item.quantity || 1}
                                      onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                      min={1}
                                      placeholder="Qty"
                                    />
                                  )}
                                  <Input
                                    type="number"
                                    className="w-20 text-right"
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

                      {/* Add from Inventory */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Add from Inventory</Label>
                        <Popover open={inventorySearchOpen} onOpenChange={setInventorySearchOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <Search className="h-4 w-4 mr-2" />
                              Search inventory items...
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Search medicines, procedures..."
                                value={inventorySearch}
                                onValueChange={setInventorySearch}
                              />
                              <CommandList>
                                <CommandEmpty>No items found</CommandEmpty>
                                <CommandGroup>
                                  {filteredInventoryForSearch.slice(0, 10).map((item) => (
                                    <CommandItem
                                      key={item.id}
                                      value={item.id}
                                      onSelect={() => addFromInventory(item)}
                                    >
                                      <div className="flex-1">
                                        <p className="font-medium">{item.name}</p>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs capitalize">
                                            {item.category}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            Stock: {item.stock}
                                          </span>
                                        </div>
                                      </div>
                                      <span className="text-sm font-medium">₹{item.price}</span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
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
                              <div key={item.id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium">{item.name}</span>
                                  <Badge variant="outline" className="ml-2 text-xs capitalize">
                                    {item.type}
                                  </Badge>
                                </div>
                                {item.type === 'medicine' && item.quantity !== undefined && (
                                  <Input
                                    type="number"
                                    className="w-14 text-center"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const qty = parseInt(e.target.value) || 1;
                                      setCustomItems(items => 
                                        items.map(i => i.id === item.id ? { ...i, quantity: Math.max(1, qty) } : i)
                                      );
                                    }}
                                    min={1}
                                  />
                                )}
                                <span className="text-sm font-medium">₹{item.price * (item.quantity || 1)}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => removeCustomItem(item.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Separator />
                    </>
                  )}

                  {/* Total, Paid Amount, Balance, and Method */}
                  <div className="space-y-4">
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

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Paid Amount</Label>
                        <Input
                          type="number"
                          value={paidAmount || ''}
                          onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                          placeholder="Enter paid amount"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Balance</Label>
                        <div className={cn(
                          "text-xl font-bold p-2 rounded-md",
                          calculateBalance() > 0 ? "text-orange-600 bg-orange-50" : "text-green-600 bg-green-50"
                        )}>
                          ₹{calculateBalance().toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {calculateBalance() > 0 && (
                      <div className="space-y-2">
                        <Label>Due Date *</Label>
                        <Input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          min={format(new Date(), "yyyy-MM-dd")}
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full"
                    disabled={!formData.patientId || calculateTotal() <= 0 || paidAmount <= 0}
                  >
                    {calculateBalance() > 0 
                      ? `Record Partial Payment - ₹${paidAmount.toLocaleString()}`
                      : `Record Payment - ₹${calculateTotal().toLocaleString()}`
                    }
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden">
          <VirtualizedList
            data={filteredPayments}
            itemHeight={140}
            height={600}
            keyExtractor={(p) => p.id}
            emptyMessage="No payments found"
            renderItem={(payment, index, style) => (
              <div style={style} className="p-1">
                <Card>
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
                      <div>
                        <span className="text-lg font-semibold">₹{Number(payment.paid_amount || payment.amount).toLocaleString()}</span>
                        {payment.balance_amount && Number(payment.balance_amount) > 0 && (
                          <span className="text-sm text-orange-600 ml-2">
                            (Due: ₹{Number(payment.balance_amount).toLocaleString()})
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground capitalize">{payment.method}</span>
                    </div>
                    {payment.due_date && (
                      <p className="text-xs text-orange-600 mt-2">
                        Due by: {format(new Date(payment.due_date), "MMM d, yyyy")}
                      </p>
                    )}
                    {payment.description && (
                      <p className="text-xs text-muted-foreground mt-2 truncate">{payment.description}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          />
        </div>

        {/* Desktop Table View */}
        <Card className="hidden sm:block">
          <CardContent className="p-0">
            <VirtualizedTable
              data={filteredPayments}
              rowHeight={56}
              height={500}
              keyExtractor={(p) => p.id}
              emptyMessage="No payments found"
              columns={[
                {
                  key: "patient",
                  header: "Patient",
                  render: (p) => <span className="font-medium">{p.patient_name}</span>,
                },
                {
                  key: "paid",
                  header: "Paid",
                  render: (p) => `₹${Number(p.paid_amount || p.amount).toLocaleString()}`,
                },
                {
                  key: "balance",
                  header: "Balance",
                  className: cn(Number(filteredPayments[0]?.balance_amount) > 0 && "text-orange-600"),
                  render: (p) => (
                    <span className={cn(Number(p.balance_amount) > 0 && "text-orange-600 font-medium")}>
                      {Number(p.balance_amount) > 0 ? `₹${Number(p.balance_amount).toLocaleString()}` : '-'}
                    </span>
                  ),
                },
                {
                  key: "dueDate",
                  header: "Due Date",
                  render: (p) => (
                    <span className={cn(p.due_date && "text-orange-600")}>
                      {p.due_date ? format(new Date(p.due_date), "MMM d, yyyy") : '-'}
                    </span>
                  ),
                },
                {
                  key: "method",
                  header: "Method",
                  render: (p) => <span className="capitalize">{p.method}</span>,
                },
                {
                  key: "date",
                  header: "Date",
                  render: (p) => format(new Date(p.date), "MMM d, yyyy"),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (p) => (
                    <Badge className={cn(statusColors[p.status])}>{p.status}</Badge>
                  ),
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Payments;