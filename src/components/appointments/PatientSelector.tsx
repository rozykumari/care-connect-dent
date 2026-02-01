import { memo, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, UserPlus } from "lucide-react";
import { Label } from "@/components/ui/label";

interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface PatientSelectorProps {
  patients: Patient[];
  selectedPatientId: string;
  onPatientSelect: (patientId: string) => void;
  onAddNewClick: () => void;
}

export const PatientSelector = memo(function PatientSelector({
  patients,
  selectedPatientId,
  onPatientSelect,
  onAddNewClick,
}: PatientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId),
    [patients, selectedPatientId]
  );

  const filteredPatients = useMemo(
    () =>
      patients.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.phone.includes(searchQuery)
      ),
    [patients, searchQuery]
  );

  const handleSelect = useCallback(
    (patientId: string) => {
      onPatientSelect(patientId);
      setOpen(false);
      setSearchQuery("");
    },
    [onPatientSelect]
  );

  return (
    <div className="space-y-2">
      <Label>Patient</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-start text-left font-normal"
            >
              <Search className="mr-2 h-4 w-4 shrink-0" />
              {selectedPatient ? selectedPatient.name : "Search patient..."}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search by name or phone..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>No patient found.</CommandEmpty>
                <CommandGroup>
                  {filteredPatients.map((patient) => (
                    <CommandItem
                      key={patient.id}
                      value={patient.name}
                      onSelect={() => handleSelect(patient.id)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{patient.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {patient.phone}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onAddNewClick}
          title="Add new patient"
        >
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});
