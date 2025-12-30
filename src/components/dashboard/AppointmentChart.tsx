import { useState, useEffect, memo, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface Appointment {
  id: string;
  date: string;
  status: string;
  type: string;
}

const COLORS = ["hsl(199, 89%, 48%)", "hsl(173, 58%, 39%)", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

const ChartSkeleton = memo(function ChartSkeleton() {
  return (
    <div className="h-[300px] flex items-center justify-center">
      <div className="space-y-4 w-full px-8">
        <div className="flex items-end justify-between gap-2 h-40">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="flex-1" style={{ height: `${30 + Math.random() * 70}%` }} />
          ))}
        </div>
        <div className="flex justify-between">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-8" />
          ))}
        </div>
      </div>
    </div>
  );
});

export const AppointmentChart = memo(function AppointmentChart() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    try {
      // Fetch appointments for the last 6 months - only select needed fields
      const sixMonthsAgo = subMonths(new Date(), 6);
      
      const { data, error } = await supabase
        .from("appointments")
        .select("id, date, status, type")
        .gte("date", format(sixMonthsAgo, "yyyy-MM-dd"))
        .order("date", { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const { dailyData, monthlyData, typeData } = useMemo(() => {
    // Daily data
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const daily = days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayAppointments = appointments.filter((apt) => apt.date === dayStr);
      return {
        name: format(day, "EEE"),
        appointments: dayAppointments.length,
        completed: dayAppointments.filter((a) => a.status === "completed").length,
      };
    });

    // Monthly data
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.date);
        return aptDate >= monthStart && aptDate <= monthEnd;
      });

      monthly.push({
        name: format(date, "MMM"),
        appointments: monthAppointments.length,
        completed: monthAppointments.filter((a) => a.status === "completed").length,
      });
    }

    // Type distribution
    const types: Record<string, number> = {};
    appointments.forEach((apt) => {
      types[apt.type] = (types[apt.type] || 0) + 1;
    });
    const typeDistribution = Object.entries(types).map(([name, value]) => ({
      name: name.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      value,
    }));

    return { dailyData: daily, monthlyData: monthly, typeData: typeDistribution };
  }, [appointments]);

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Appointment Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Appointment Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="types">By Type</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="appointments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="completed" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="monthly" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="appointments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="completed" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="types" className="h-[300px]">
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {typeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No appointment data available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});