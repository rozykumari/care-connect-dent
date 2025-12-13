import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Plus, Search, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Payment } from "@/types";
import { Label } from "@/components/ui/label";

const statusColors = {
  pending: "bg-warning/20 text-warning",
  completed: "bg-success/20 text-success",
  refunded: "bg-destructive/20 text-destructive",
};

const Payments = () => {
  const { payments, patients, addPayment } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    patientId: "",
    amount: 0,
    method: "cash" as Payment["method"],
    description: "",
  });

  const handleSubmit = () => {
    const patient = patients.find((p) => p.id === formData.patientId);
    if (!patient) return;

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      patientId: formData.patientId,
      patientName: patient.name,
      amount: formData.amount,
      method: formData.method,
      status: "completed",
      date: new Date().toISOString(),
      description: formData.description,
    };

    addPayment(newPayment);
    setIsDialogOpen(false);
    setFormData({ patientId: "", amount: 0, method: "cash", description: "" });
  };

  const filteredPayments = payments.filter((p) =>
    p.patientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0);

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payments</h1>
            <p className="text-muted-foreground mt-1">Total Revenue: ₹{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-64" />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary"><Plus className="h-4 w-4 mr-2" />Record Payment</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Patient</Label>
                    <Select value={formData.patientId} onValueChange={(v) => setFormData({ ...formData, patientId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                      <SelectContent>{patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Amount (₹)</Label>
                      <Input type="number" value={formData.amount || ""} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Method</Label>
                      <Select value={formData.method} onValueChange={(v) => setFormData({ ...formData, method: v as Payment["method"] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Payment for..." />
                  </div>
                  <Button onClick={handleSubmit} className="w-full gradient-primary" disabled={!formData.patientId || !formData.amount}>Record Payment</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Card className="glass-card">
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
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No payments found</TableCell></TableRow>
                ) : (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.patientName}</TableCell>
                      <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                      <TableCell className="capitalize">{payment.method}</TableCell>
                      <TableCell>{format(new Date(payment.date), "MMM d, yyyy")}</TableCell>
                      <TableCell><Badge className={cn(statusColors[payment.status])}>{payment.status}</Badge></TableCell>
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
