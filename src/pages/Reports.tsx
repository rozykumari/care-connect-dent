import { MainLayout } from "@/components/layout/MainLayout";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Package, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const Reports = () => {
  const { payments, appointments, medicines } = useStore();

  const getMonthlyRevenue = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const revenue = payments
        .filter((p) => p.status === "completed" && new Date(p.date) >= start && new Date(p.date) <= end)
        .reduce((sum, p) => sum + p.amount, 0);
      months.push({ name: format(date, "MMM"), revenue });
    }
    return months;
  };

  const downloadCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {}).join(",");
    const rows = data.map((row) => Object.values(row).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
  };

  const lowStockMedicines = medicines.filter((m) => m.stock <= m.reorderLevel);

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-1">View and download clinic reports</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Revenue Report</CardTitle>
              <Button variant="outline" size="sm" onClick={() => downloadCSV(payments.map((p) => ({ Patient: p.patientName, Amount: p.amount, Date: p.date, Status: p.status })), "financial-report")}>
                <Download className="h-4 w-4 mr-2" />Export
              </Button>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getMonthlyRevenue()}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" />Inventory Status</CardTitle>
              <Button variant="outline" size="sm" onClick={() => downloadCSV(medicines.map((m) => ({ Name: m.name, Stock: m.stock, ReorderLevel: m.reorderLevel })), "inventory-report")}>
                <Download className="h-4 w-4 mr-2" />Export
              </Button>
            </CardHeader>
            <CardContent>
              {lowStockMedicines.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">All medicines are well stocked</p>
              ) : (
                <div className="space-y-3">
                  {lowStockMedicines.map((med) => (
                    <div key={med.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                      <span className="font-medium">{med.name}</span>
                      <span className="text-destructive">Stock: {med.stock}/{med.reorderLevel}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports;
