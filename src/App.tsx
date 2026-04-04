import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";

const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Courses = lazy(() => import("./pages/Courses"));
const Contact = lazy(() => import("./pages/Contact"));
const Social = lazy(() => import("./pages/Social"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Consulting = lazy(() => import("./pages/Consulting"));
const CollegeConsulting = lazy(() => import("./pages/CollegeConsulting"));
const Testimonials = lazy(() => import("./pages/Testimonials"));
const Admin = lazy(() => import("./pages/Admin"));
const Portal = lazy(() => import("./pages/Portal"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CatalogRequest = lazy(() => import("./pages/CatalogRequest"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <Suspense fallback={<div className="min-h-screen" />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/portal" element={<Portal />} />
                  <Route path="/dashboard" element={<StudentDashboard />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/social" element={<Social />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/consulting" element={<Consulting />} />
                  <Route path="/college-consulting" element={<CollegeConsulting />} />
                  <Route path="/testimonials" element={<Testimonials />} />
                  <Route path="/auth" element={<Navigate to="/portal" replace />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/catalog" element={<CatalogRequest />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  {/* Redirect old parent URLs */}
                  <Route path="/parent-portal" element={<Navigate to="/portal" replace />} />
                  <Route path="/parent-dashboard" element={<Navigate to="/portal" replace />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Layout>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
