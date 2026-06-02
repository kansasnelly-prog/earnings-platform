import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/SafeAuthProvider";
import AdminLayout from "./components/admin/AdminLayout";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AppProvider } from "./contexts/AppContext";
import { CSNotificationProvider } from "./contexts/CSNotificationContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import AIAssistantWorkspace from "./pages/AIAssistantWorkspace";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <ThemeProvider defaultTheme="light">
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <LanguageProvider>
              <CSNotificationProvider>
                <AuthProvider>
                  <AppProvider>
                    <Toaster />
                    <Sonner />
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/admin/*" element={<AdminLayout />}> 
                        <Route index element={<Admin />} />
                      </Route>
                      <Route element={<ProtectedRoute />}>
                        <Route path="/ai-assistant" element={<AIAssistantWorkspace />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppProvider>
                </AuthProvider>
              </CSNotificationProvider>
            </LanguageProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
