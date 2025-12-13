import { MainLayout } from "@/components/layout/MainLayout";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Plus, Search, Package } from "lucide-react";
import { Medicine } from "@/types";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const Inventory = () => {
  const { medicines, addMedicine, updateMedicine } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({ name: "", category: "", stock: 0, unit: "tablets", reorderLevel: 10, price: 0, expiryDate: "" });

  const handleSubmit = () => {
    addMedicine({ id: crypto.randomUUID(), ...formData });
    setIsDialogOpen(false);
    setFormData({ name: "", category: "", stock: 0, unit: "tablets", reorderLevel: 10, price: 0, expiryDate: "" });
  };

  const filteredMedicines = medicines.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
            <p className="text-muted-foreground mt-1">Manage medicines and supplies</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-64" />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild><Button className="gradient-primary"><Plus className="h-4 w-4 mr-2" />Add Medicine</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Medicine</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Category</Label><Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Stock</Label><Input type="number" value={formData.stock || ""} onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} /></div>
                    <div className="space-y-2"><Label>Unit</Label><Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Reorder Level</Label><Input type="number" value={formData.reorderLevel || ""} onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Price (₹)</Label><Input type="number" value={formData.price || ""} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} /></div>
                    <div className="space-y-2"><Label>Expiry Date</Label><Input type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} /></div>
                  </div>
                  <Button onClick={handleSubmit} className="w-full gradient-primary" disabled={!formData.name}>Add Medicine</Button>
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
                  <TableHead>Medicine</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicines.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No medicines found</TableCell></TableRow>
                ) : (
                  filteredMedicines.map((med) => (
                    <TableRow key={med.id}>
                      <TableCell className="font-medium">{med.name}</TableCell>
                      <TableCell>{med.category}</TableCell>
                      <TableCell>{med.stock} {med.unit}</TableCell>
                      <TableCell>₹{med.price}</TableCell>
                      <TableCell>{med.expiryDate ? format(new Date(med.expiryDate), "MMM yyyy") : "-"}</TableCell>
                      <TableCell>
                        <Badge className={cn(med.stock <= med.reorderLevel ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success")}>
                          {med.stock <= med.reorderLevel ? "Low Stock" : "In Stock"}
                        </Badge>
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

export default Inventory;
