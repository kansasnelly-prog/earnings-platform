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

const App = () => (
  <ThemeProvider defaultTheme="light">
    <LanguageProvider>
      <CSNotificationProvider>
        <ErrorBoundary>
  <BrowserRouter>
    <AuthProvider>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* Admin routes */}
          <Route path="/admin/*" element={<AdminLayout />}> {/* Admin layout wrapper */}
            <Route index element={<Admin />} />
          </Route>
          {/* Protected AI Assistant route */}
          <Route element={<ProtectedRoute />}> 
            <Route path="/ai-assistant" element={<AIAssistantWorkspace />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppProvider>
    </AuthProvider>
  </BrowserRouter>
        </ErrorBoundary>
      </CSNotificationProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
