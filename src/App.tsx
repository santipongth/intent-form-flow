import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import AgentBuilder from "./pages/AgentBuilder";
import ChatConsole from "./pages/ChatConsole";
import Monitor from "./pages/Monitor";
import Marketplace from "./pages/Marketplace";
import SettingsPage from "./pages/SettingsPage";
import DeployPanel from "./pages/DeployPanel";
import Analytics from "./pages/Analytics";
import UsageBilling from "./pages/UsageBilling";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/agents/new" element={<AppLayout><AgentBuilder /></AppLayout>} />
          <Route path="/marketplace" element={<AppLayout><Marketplace /></AppLayout>} />
          <Route path="/chat" element={<AppLayout><ChatConsole /></AppLayout>} />
          <Route path="/monitor" element={<AppLayout><Monitor /></AppLayout>} />
          <Route path="/analytics" element={<AppLayout><Analytics /></AppLayout>} />
          <Route path="/usage" element={<AppLayout><UsageBilling /></AppLayout>} />
          <Route path="/deploy" element={<AppLayout><DeployPanel /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
