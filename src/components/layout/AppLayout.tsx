import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";

import { Button } from "@/components/ui/button";
import { Sun, Moon, Globe } from "lucide-react";

export function AppLayout({ children }: {children: React.ReactNode;}) {
  const { user } = useAuth();
  const { locale, setLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-h-screen">
          <header className="h-14 flex items-center justify-between border-b border-border/50 px-4 bg-background/70 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg gap-1.5 text-xs font-medium h-8 px-2.5"
                onClick={() => setLocale(locale === "th" ? "en" : "th")}>

                <Globe className="h-3.5 w-3.5" />
                {locale === "th" ? "TH" : "EN"}
              </Button>
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg h-8 w-8"
                onClick={toggleTheme}>

                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </header>
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>);

}