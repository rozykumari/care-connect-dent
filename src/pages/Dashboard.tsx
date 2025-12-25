import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardSEO } from "@/components/SEO";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AppointmentChart } from "@/components/dashboard/AppointmentChart";
import { TodayAppointments } from "@/components/dashboard/TodayAppointments";
import { RecentPatients } from "@/components/dashboard/RecentPatients";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, CreditCard, ClipboardList } from "lucide-react";
import { format } from "date-fns";

interface DashboardStats {
  todayAppointments: number;
  totalPatients: number;
  totalRevenue: number;
  totalProcedures: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    totalPatients: 0,
    totalRevenue: 0,
    totalProcedures: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");

      // Fetch all stats in parallel
      const [appointmentsRes, patientsRes, paymentsRes, proceduresRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("id", { count: "exact" })
          .eq("date", today),
        supabase
          .from("patients")
          .select("id", { count: "exact" }),
        supabase
          .from("payments")
          .select("amount")
          .eq("status", "completed"),
        supabase
          .from("patient_procedures")
          .select("id", { count: "exact" }),
      ]);

      const totalRevenue = paymentsRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setStats({
        todayAppointments: appointmentsRes.count || 0,
        totalPatients: patientsRes.count || 0,
        totalRevenue,
        totalProcedures: proceduresRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </MainLayout>
    );
  }

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
              value={stats.todayAppointments}
              icon={Calendar}
            />
            <StatsCard
              title="Total Patients"
              value={stats.totalPatients}
              icon={Users}
            />
            <StatsCard
              title="Total Revenue"
              value={`₹${stats.totalRevenue.toLocaleString()}`}
              icon={CreditCard}
            />
            <StatsCard
              title="Procedures"
              value={stats.totalProcedures}
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
