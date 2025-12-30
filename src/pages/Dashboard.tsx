import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardSEO } from "@/components/SEO";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AppointmentChart } from "@/components/dashboard/AppointmentChart";
import { TodayAppointments } from "@/components/dashboard/TodayAppointments";
import { RecentPatients } from "@/components/dashboard/RecentPatients";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CreditCard, ClipboardList, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { StatsCardSkeleton } from "@/components/ui/skeleton-card";

interface DashboardStats {
  todayAppointments: number;
  totalRevenue: number;
  totalProcedures: number;
}

const StatsGrid = memo(function StatsGrid({ 
  stats, 
  displayDate, 
  loading 
}: { 
  stats: DashboardStats; 
  displayDate: string; 
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatsCard
        title={`${displayDate}'s Appointments`}
        value={stats.todayAppointments}
        icon={Calendar}
      />
      <StatsCard
        title={`${displayDate}'s Revenue`}
        value={`₹${stats.totalRevenue.toLocaleString()}`}
        icon={CreditCard}
      />
      <StatsCard
        title={`${displayDate}'s Procedures`}
        value={stats.totalProcedures}
        icon={ClipboardList}
      />
    </div>
  );
});

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    totalRevenue: 0,
    totalProcedures: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const fetchDashboardStats = useCallback(async (date: Date) => {
    try {
      setLoading(true);
      const dateStr = format(date, "yyyy-MM-dd");

      // Fetch all stats in parallel for the selected date
      const [appointmentsRes, paymentsRes, proceduresRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("id", { count: "exact", head: true })
          .eq("date", dateStr),
        supabase
          .from("payments")
          .select("paid_amount, amount")
          .eq("status", "completed")
          .eq("date", dateStr),
        supabase
          .from("patient_procedures")
          .select("id", { count: "exact", head: true })
          .eq("date", dateStr),
      ]);

      const totalRevenue = paymentsRes.data?.reduce((sum, p) => sum + Number(p.paid_amount || p.amount), 0) || 0;

      setStats({
        todayAppointments: appointmentsRes.count || 0,
        totalRevenue,
        totalProcedures: proceduresRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats(selectedDate);
  }, [selectedDate, fetchDashboardStats]);

  const { isToday, displayDate, headerText } = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
    return {
      isToday: today,
      displayDate: today ? "Today" : format(selectedDate, "MMM d, yyyy"),
      headerText: today 
        ? "Welcome back! Here's what's happening today." 
        : `Showing data for ${format(selectedDate, "MMMM d, yyyy")}`
    };
  }, [selectedDate]);

  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (date) setSelectedDate(date);
  }, []);

  return (
    <>
      <DashboardSEO />
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-1">{headerText}</p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "EEEE, MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Stats Grid */}
          <StatsGrid stats={stats} displayDate={displayDate} loading={loading} />

          {/* Charts and Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AppointmentChart />
            <TodayAppointments />
          </div>

          {/* Recent Patients */}
          <RecentPatients />
        </div>
      </MainLayout>
    </>
  );
};

export default Dashboard;