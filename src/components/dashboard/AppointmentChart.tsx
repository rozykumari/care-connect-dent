import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useStore } from "@/store/useStore";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ["hsl(199, 89%, 48%)", "hsl(173, 58%, 39%)", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

export function AppointmentChart() {
  const appointments = useStore((state) => state.appointments);

  const getDailyData = () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return days.map((day) => {
      const dayAppointments = appointments.filter(
        (apt) => format(new Date(apt.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
      );
      return {
        name: format(day, "EEE"),
        appointments: dayAppointments.length,
        completed: dayAppointments.filter((a) => a.status === "completed").length,
      };
    });
  };

  const getMonthlyData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.date);
        return aptDate >= monthStart && aptDate <= monthEnd;
      });

      months.push({
        name: format(date, "MMM"),
        appointments: monthAppointments.length,
        completed: monthAppointments.filter((a) => a.status === "completed").length,
      });
    }
    return months;
  };

  const getTypeDistribution = () => {
    const types: Record<string, number> = {};
    appointments.forEach((apt) => {
      types[apt.type] = (types[apt.type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({
      name: name.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      value,
    }));
  };

  const dailyData = getDailyData();
  const monthlyData = getMonthlyData();
  const typeData = getTypeDistribution();

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
                <Bar dataKey="appointments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
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
                <Bar dataKey="appointments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
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
}
