import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Clock, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Availability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DoctorAvailability = () => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, [user]);

  const fetchAvailability = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', user.id)
        .order('day_of_week');

      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const addSlot = async (dayOfWeek: number) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('doctor_availability')
        .insert({
          doctor_id: user.id,
          day_of_week: dayOfWeek,
          start_time: '09:00',
          end_time: '17:00',
          slot_duration: 30,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      setAvailability([...availability, data]);
      toast.success('Slot added');
    } catch (error) {
      console.error('Error adding slot:', error);
      toast.error('Failed to add slot');
    }
  };

  const updateSlot = async (id: string, updates: Partial<Availability>) => {
    try {
      const { error } = await supabase
        .from('doctor_availability')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setAvailability(availability.map(slot => 
        slot.id === id ? { ...slot, ...updates } : slot
      ));
    } catch (error) {
      console.error('Error updating slot:', error);
      toast.error('Failed to update');
    }
  };

  const deleteSlot = async (id: string) => {
    try {
      const { error } = await supabase
        .from('doctor_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAvailability(availability.filter(slot => slot.id !== id));
      toast.success('Slot removed');
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast.error('Failed to delete');
    }
  };

  const getSlotsByDay = (day: number) => availability.filter(slot => slot.day_of_week === day);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Availability Settings</h1>
          <p className="text-muted-foreground mt-1">Set your available time slots for patient appointments</p>
        </div>

        <div className="grid gap-4">
          {DAYS.map((day, index) => (
            <Card key={day}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{day}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSlot(index)}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Slot</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {getSlotsByDay(index).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No availability set for {day}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {getSlotsByDay(index).map((slot) => (
                      <div
                        key={slot.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={slot.is_active}
                            onCheckedChange={(checked) => updateSlot(slot.id, { is_active: checked })}
                          />
                          <span className="text-sm text-muted-foreground">
                            {slot.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 flex-1">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <Input
                              type="time"
                              value={slot.start_time}
                              onChange={(e) => updateSlot(slot.id, { start_time: e.target.value })}
                              className="w-28"
                            />
                          </div>
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) => updateSlot(slot.id, { end_time: e.target.value })}
                            className="w-28"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Label className="text-sm whitespace-nowrap">Slot:</Label>
                          <Select
                            value={slot.slot_duration.toString()}
                            onValueChange={(v) => updateSlot(slot.id, { slot_duration: parseInt(v) })}
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15">15 min</SelectItem>
                              <SelectItem value="30">30 min</SelectItem>
                              <SelectItem value="45">45 min</SelectItem>
                              <SelectItem value="60">60 min</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSlot(slot.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default DoctorAvailability;
