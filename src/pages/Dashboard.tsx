import { useState, useMemo, memo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardSEO } from "@/components/SEO";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AppointmentChart } from "@/components/dashboard/AppointmentChart";
import { TodayAppointments } from "@/components/dashboard/TodayAppointments";
import { RecentPatients } from "@/components/dashboard/RecentPatients";
import { useDashboardStats } from "@/hooks/useQueries";
import { Calendar, CreditCard, ClipboardList, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DashboardSkeleton, StatsCardSkeleton } from "@/components/ui/skeleton-card";

const StatsGrid = memo(function StatsGrid({
  stats,
  displayDate,
  isLoading,
}: {
  stats?: { todayAppointments: number; totalRevenue: number; totalProcedures: number };
  displayDate: string;
  isLoading: boolean;
}) {
  if (isLoading) {
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
        value={stats?.todayAppointments || 0}
        icon={Calendar}
      />
      <StatsCard
        title={`${displayDate}'s Revenue`}
        value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
        icon={CreditCard}
      />
      <StatsCard
        title={`${displayDate}'s Procedures`}
        value={stats?.totalProcedures || 0}
        icon={ClipboardList}
      />
    </div>
  );
});

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // React Query for dashboard stats with automatic caching and background refetching
  const { data: stats, isLoading } = useDashboardStats(selectedDate);

  const { isToday, displayDate, headerText } = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
    return {
      isToday: today,
      displayDate: today ? "Today" : format(selectedDate, "MMM d, yyyy"),
      headerText: today
        ? "Welcome back! Here's what's happening today."
        : `Showing data for ${format(selectedDate, "MMMM d, yyyy")}`,
    };
  }, [selectedDate]);

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
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Stats Grid */}
          <StatsGrid stats={stats} displayDate={displayDate} isLoading={isLoading} />

          {/* Charts and Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AppointmentChart />
            <TodayAppointments selectedDate={selectedDate} />
          </div>

          {/* Recent Patients */}
          <RecentPatients />
        </div>
      </MainLayout>
    </>
  );
};

export default Dashboard;
