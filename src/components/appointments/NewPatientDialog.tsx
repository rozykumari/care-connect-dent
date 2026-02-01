import { memo, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NewPatientData {
  name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  address: string;
}

const initialData: NewPatientData = {
  name: "",
  phone: "",
  email: "",
  date_of_birth: "",
  address: "",
};

interface NewPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatientCreated: (patient: { id: string; name: string; phone: string; email?: string }) => void;
}

export const NewPatientDialog = memo(function NewPatientDialog({
  open,
  onOpenChange,
  onPatientCreated,
}: NewPatientDialogProps) {
  const [formData, setFormData] = useState<NewPatientData>(initialData);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback(
    (field: keyof NewPatientData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = field === "phone" ? e.target.value.replace(/\D/g, "") : e.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setSubmitting(true);
    try {
      // Check if phone already exists
      const { data: existingPatient } = await supabase
        .from("patients")
        .select("id")
        .eq("phone", formData.phone)
        .maybeSingle();

      if (existingPatient) {
        toast.error("This mobile number is already registered");
        return;
      }

      const { data, error } = await supabase
        .from("patients")
        .insert({
          name: formData.name.trim(),
          phone: formData.phone,
          email: formData.email.trim() || null,
          date_of_birth: formData.date_of_birth || null,
          address: formData.address.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Patient added successfully");
      onPatientCreated(data);
      setFormData(initialData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating patient:", error);
      toast.error("Failed to add patient");
    } finally {
      setSubmitting(false);
    }
  }, [formData, onOpenChange, onPatientCreated]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setFormData(initialData);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange("name")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone * (10 digits)</Label>
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange("phone")}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange("email")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange("date_of_birth")}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                placeholder="City, State"
                value={formData.address}
                onChange={handleChange("address")}
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={submitting || !formData.name.trim() || !formData.phone.trim()}
          >
            {submitting ? "Adding..." : "Add Patient"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
