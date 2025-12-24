import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import DoctorRoute from "@/components/DoctorRoute";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Patients from "./pages/Patients";
import Procedures from "./pages/Procedures";
import Prescriptions from "./pages/Prescriptions";
import Enquiries from "./pages/Enquiries";
import Payments from "./pages/Payments";
import Inventory from "./pages/Inventory";
import DoctorInventory from "./pages/DoctorInventory";
import Reports from "./pages/Reports";
import Auth from "./pages/Auth";
import PatientProfile from "./pages/PatientProfile";
import DoctorManagement from "./pages/DoctorManagement";
import DoctorAvailability from "./pages/DoctorAvailability";
import BookAppointment from "./pages/BookAppointment";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            {/* Patient Routes */}
            <Route path="/profile" element={<ProtectedRoute><PatientProfile /></ProtectedRoute>} />
            <Route path="/book-appointment" element={<ProtectedRoute><BookAppointment /></ProtectedRoute>} />
            {/* Doctor Routes */}
            <Route path="/doctor" element={<DoctorRoute><DoctorManagement /></DoctorRoute>} />
            <Route path="/doctor/availability" element={<DoctorRoute><DoctorAvailability /></DoctorRoute>} />
            <Route path="/doctor/inventory" element={<DoctorRoute><DoctorInventory /></DoctorRoute>} />
            <Route path="/" element={<DoctorRoute><Dashboard /></DoctorRoute>} />
            <Route path="/appointments" element={<DoctorRoute><Appointments /></DoctorRoute>} />
            <Route path="/patients" element={<DoctorRoute><Patients /></DoctorRoute>} />
            <Route path="/procedures" element={<DoctorRoute><Procedures /></DoctorRoute>} />
            <Route path="/prescriptions" element={<DoctorRoute><Prescriptions /></DoctorRoute>} />
            <Route path="/enquiries" element={<DoctorRoute><Enquiries /></DoctorRoute>} />
            <Route path="/payments" element={<DoctorRoute><Payments /></DoctorRoute>} />
            <Route path="/inventory" element={<DoctorRoute><Inventory /></DoctorRoute>} />
            <Route path="/reports" element={<DoctorRoute><Reports /></DoctorRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
