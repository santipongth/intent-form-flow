import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import AgentBuilder from "./pages/AgentBuilder";
import ChatConsole from "./pages/ChatConsole";
import Monitor from "./pages/Monitor";
import Marketplace from "./pages/Marketplace";
import SettingsPage from "./pages/SettingsPage";
import Analytics from "./pages/Analytics";
import AgentDetail from "./pages/AgentDetail";
import ResetPassword from "./pages/ResetPassword";
import UsageBilling from "./pages/UsageBilling";
import ABTesting from "./pages/ABTesting";
import ABTestDetail from "./pages/ABTestDetail";
import ABTestResults from "./pages/ABTestResults";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import WidgetPreview from "./pages/WidgetPreview";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
                <Route path="/agents/new" element={<ProtectedRoute><AppLayout><AgentBuilder /></AppLayout></ProtectedRoute>} />
                <Route path="/agents/:id" element={<ProtectedRoute><AppLayout><AgentDetail /></AppLayout></ProtectedRoute>} />
                <Route path="/marketplace" element={<ProtectedRoute><AppLayout><Marketplace /></AppLayout></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><AppLayout><ChatConsole /></AppLayout></ProtectedRoute>} />
                <Route path="/chat/:conversationId" element={<ProtectedRoute><AppLayout><ChatConsole /></AppLayout></ProtectedRoute>} />
                <Route path="/monitor" element={<ProtectedRoute><AppLayout><Monitor /></AppLayout></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><AppLayout><Analytics /></AppLayout></ProtectedRoute>} />
                <Route path="/usage" element={<ProtectedRoute><AppLayout><UsageBilling /></AppLayout></ProtectedRoute>} />
                <Route path="/ab-testing" element={<ProtectedRoute><AppLayout><ABTesting /></AppLayout></ProtectedRoute>} />
                <Route path="/ab-testing/results" element={<ProtectedRoute><AppLayout><ABTestResults /></AppLayout></ProtectedRoute>} />
                <Route path="/ab-testing/:id" element={<ProtectedRoute><AppLayout><ABTestDetail /></AppLayout></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
                <Route path="/widget-preview/:agentId" element={<WidgetPreview />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
