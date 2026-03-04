import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import About from "./pages/About";
import Courses from "./pages/Courses";
import Contact from "./pages/Contact";
import Social from "./pages/Social";
import Consulting from "./pages/Consulting";

import Admin from "./pages/Admin";
import Portal from "./pages/Portal";
import StudentDashboard from "./pages/StudentDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import CatalogRequest from "./pages/CatalogRequest";

const queryClient = new QueryClient();

const routerBasename = (() => {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "");
  return base && base !== "/" ? base : undefined;
})();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={routerBasename}>
            <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/portal" element={<Portal />} />
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/parent-dashboard" element={<ParentDashboard />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/social" element={<Social />} />
                <Route path="/consulting" element={<Consulting />} />
                <Route path="/auth" element={<Navigate to="/portal" replace />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/catalog" element={<CatalogRequest />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                {/* Redirect old parent-portal URL */}
                <Route path="/parent-portal" element={<Navigate to="/portal" replace />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

