import { LayoutDashboard, Bot, Store, MessageCircle, Activity, BarChart3, CreditCard, Settings, Plus, LogOut, Sun, Moon, FlaskConical } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

const menuKeys = [
  { key: "sidebar.dashboard", url: "/dashboard", icon: LayoutDashboard },
  { key: "sidebar.agents", url: "/agents/new", icon: Bot },
  { key: "sidebar.marketplace", url: "/marketplace", icon: Store },
  { key: "sidebar.chat", url: "/chat", icon: MessageCircle },
  { key: "sidebar.monitor", url: "/monitor", icon: Activity },
  { key: "sidebar.analytics", url: "/analytics", icon: BarChart3 },
  { key: "sidebar.abTesting", url: "/ab-testing", icon: FlaskConical },
  { key: "sidebar.usage", url: "/usage", icon: CreditCard },
  { key: "sidebar.settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="p-4 flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-lg shrink-0">
          🧠
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-lg gradient-text">
            ThoughtMind
          </span>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuKeys.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith(item.url.split("/").slice(0, 2).join("/") || item.url)}
                    tooltip={t(item.key)}
                  >
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 transition-all hover:bg-sidebar-accent hover:translate-x-0.5"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{t(item.key)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2">
        {/* Dark mode toggle */}
        {!collapsed ? (
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 rounded-xl text-xs" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? t("theme.light") : t("theme.dark")}
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="rounded-xl mx-auto" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        )}

        {/* User info */}
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="text-xs bg-secondary">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!collapsed ? (
            <>
              <Button className="flex-1 gradient-primary text-primary-foreground rounded-xl gap-2" asChild>
                <NavLink to="/agents/new">
                  <Plus className="h-4 w-4" />
                  {t("sidebar.createAgent")}
                </NavLink>
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl shrink-0" onClick={handleSignOut} title={t("sidebar.signOut")}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button size="icon" className="gradient-primary text-primary-foreground rounded-xl" asChild>
              <NavLink to="/agents/new">
                <Plus className="h-4 w-4" />
              </NavLink>
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
