import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Plus, Search, Edit, Trash2, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Enquiry } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusColors = {
  new: "bg-primary/20 text-primary",
  contacted: "bg-warning/20 text-warning",
  converted: "bg-success/20 text-success",
  closed: "bg-muted text-muted-foreground",
};

const Enquiries = () => {
  const { enquiries, addEnquiry, updateEnquiry, deleteEnquiry } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
    status: "new" as Enquiry["status"],
  });

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      message: "",
      status: "new",
    });
    setEditingEnquiry(null);
  };

  const handleSubmit = () => {
    if (editingEnquiry) {
      updateEnquiry(editingEnquiry.id, formData);
    } else {
      const newEnquiry: Enquiry = {
        id: crypto.randomUUID(),
        ...formData,
        createdAt: new Date().toISOString(),
      };
      addEnquiry(newEnquiry);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (enquiry: Enquiry) => {
    setEditingEnquiry(enquiry);
    setFormData({
      name: enquiry.name,
      phone: enquiry.phone,
      email: enquiry.email || "",
      message: enquiry.message,
      status: enquiry.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteEnquiry(deleteId);
      setDeleteId(null);
    }
  };

  const filteredEnquiries = enquiries.filter(
    (enq) =>
      enq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enq.phone.includes(searchQuery) ||
      enq.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Enquiries</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage patient enquiries
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search enquiries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Enquiry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingEnquiry ? "Edit Enquiry" : "Add New Enquiry"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="Full name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email (Optional)</Label>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Enquiry details..."
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                    />
                  </div>

                  {editingEnquiry && (
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value as Enquiry["status"] })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button
                    onClick={handleSubmit}
                    className="w-full gradient-primary"
                    disabled={!formData.name || !formData.phone || !formData.message}
                  >
                    {editingEnquiry ? "Update Enquiry" : "Add Enquiry"}
                  </Button>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnquiries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No enquiries found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEnquiries.map((enquiry) => (
                    <TableRow key={enquiry.id}>
                      <TableCell className="font-medium">{enquiry.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {enquiry.phone}
                          </div>
                          {enquiry.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {enquiry.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{enquiry.message}</TableCell>
                      <TableCell>
                        {format(new Date(enquiry.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(statusColors[enquiry.status])}>
                          {enquiry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(enquiry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(enquiry.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Enquiry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this enquiry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default Enquiries;
