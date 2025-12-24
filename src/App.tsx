import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import DoctorRoute from "@/components/DoctorRoute";

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

// Lazy load all pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Appointments = lazy(() => import("./pages/Appointments"));
const Patients = lazy(() => import("./pages/Patients"));
const Procedures = lazy(() => import("./pages/Procedures"));
const Prescriptions = lazy(() => import("./pages/Prescriptions"));
const Enquiries = lazy(() => import("./pages/Enquiries"));
const Payments = lazy(() => import("./pages/Payments"));
const Inventory = lazy(() => import("./pages/Inventory"));
const DoctorInventory = lazy(() => import("./pages/DoctorInventory"));
const Reports = lazy(() => import("./pages/Reports"));
const Auth = lazy(() => import("./pages/Auth"));
const PatientProfile = lazy(() => import("./pages/PatientProfile"));
const DoctorManagement = lazy(() => import("./pages/DoctorManagement"));
const DoctorAvailability = lazy(() => import("./pages/DoctorAvailability"));
const BookAppointment = lazy(() => import("./pages/BookAppointment"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Configure React Query with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
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
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
