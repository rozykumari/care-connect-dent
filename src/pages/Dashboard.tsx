import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardSEO } from "@/components/SEO";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AppointmentChart } from "@/components/dashboard/AppointmentChart";
import { TodayAppointments } from "@/components/dashboard/TodayAppointments";
import { RecentPatients } from "@/components/dashboard/RecentPatients";
import { useStore } from "@/store/useStore";
import { Calendar, Users, CreditCard, ClipboardList } from "lucide-react";
import { format } from "date-fns";

const Dashboard = () => {
  const { appointments, patients, payments, procedures } = useStore();
  
  const today = format(new Date(), "yyyy-MM-dd");
  const todayAppointments = appointments.filter((apt) => apt.date === today);
  const completedPayments = payments.filter((p) => p.status === "completed");
  const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <>
      <DashboardSEO />
      <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's what's happening today.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Today</p>
            <p className="text-lg font-semibold text-foreground">
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Today's Appointments"
            value={todayAppointments.length}
            icon={Calendar}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Total Patients"
            value={patients.length}
            icon={Users}
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="Total Revenue"
            value={`₹${totalRevenue.toLocaleString()}`}
            icon={CreditCard}
            trend={{ value: 15, isPositive: true }}
          />
          <StatsCard
            title="Procedures"
            value={procedures.length}
            icon={ClipboardList}
          />
        </div>

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
