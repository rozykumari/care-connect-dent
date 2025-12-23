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
import { Plus, Search, CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning",
  completed: "bg-green-100 text-green-800",
  refunded: "bg-destructive/20 text-destructive",
};

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");

  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    amount: 0,
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
        .select("id, name, phone")
        .order("name");

      if (patientsData) setPatients(patientsData);

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

  const handleSubmit = async () => {
    if (!formData.patientId || !formData.amount) {
      toast.error("Please select a patient and enter amount");
      return;
    }

    try {
      const { error } = await supabase.from("payments").insert({
        patient_id: formData.patientId,
        amount: formData.amount,
        method: formData.method,
        status: "completed",
        description: formData.description || null,
      });

      if (error) throw error;

      toast.success("Payment recorded");
      setIsDialogOpen(false);
      setFormData({ patientId: "", patientName: "", amount: 0, method: "cash", description: "" });
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
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
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
                                  onSelect={() => {
                                    setFormData({ ...formData, patientId: p.id, patientName: p.name });
                                    setPatientSearchOpen(false);
                                    setPatientSearch("");
                                  }}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount (₹)</Label>
                      <Input
                        type="number"
                        value={formData.amount || ""}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      />
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

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Payment for..."
                    />
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="w-full"
                    disabled={!formData.patientId || !formData.amount}
                  >
                    Record Payment
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
