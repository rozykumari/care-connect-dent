import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Patients from "./pages/Patients";
import Procedures from "./pages/Procedures";
import Prescriptions from "./pages/Prescriptions";
import Enquiries from "./pages/Enquiries";
import Payments from "./pages/Payments";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/procedures" element={<Procedures />} />
          <Route path="/prescriptions" element={<Prescriptions />} />
          <Route path="/enquiries" element={<Enquiries />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
