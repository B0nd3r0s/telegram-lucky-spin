
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Rating from "./pages/Rating";
import Upgrade from "./pages/Upgrade";
import Invite from "./pages/Invite";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Navigation from "./components/Navigation";
import { AuthProvider } from "./contexts/AuthContext";
import { useEffect } from "react";
import { initTelegramWebApp } from "./lib/telegram";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialize Telegram WebApp
    try {
      initTelegramWebApp();
    } catch (error) {
      console.warn("Telegram WebApp initialization failed", error);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen pb-20">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/rating" element={<Rating />} />
                <Route path="/upgrade" element={<Upgrade />} />
                <Route path="/invite" element={<Invite />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Navigation />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
