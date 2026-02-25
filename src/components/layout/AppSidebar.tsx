import { LayoutDashboard, Bot, Store, MessageCircle, Activity, BarChart3, CreditCard, Settings, Plus, LogOut, FlaskConical, ChevronUp } from "lucide-react";
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
  useSidebar } from
"@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import tmLogo from "@/assets/tm-logo.png";

const menuKeys = [
{ key: "sidebar.dashboard", url: "/dashboard", icon: LayoutDashboard },
{ key: "sidebar.agents", url: "/agents/new", icon: Bot },
{ key: "sidebar.marketplace", url: "/marketplace", icon: Store },
{ key: "sidebar.chat", url: "/chat", icon: MessageCircle },
{ key: "sidebar.monitor", url: "/monitor", icon: Activity },
{ key: "sidebar.analytics", url: "/analytics", icon: BarChart3 },
{ key: "sidebar.abTesting", url: "/ab-testing", icon: FlaskConical },
{ key: "sidebar.usage", url: "/usage", icon: CreditCard },
{ key: "sidebar.settings", url: "/settings", icon: Settings }];


export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { t } = useLanguage();


  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="p-4 flex items-center gap-3">
        <img alt="ThoughtMind" className="w-10 h-10 rounded-xl object-contain shrink-0" src="/lovable-uploads/d1798342-d432-4714-bef6-57e1d84e6ac8.png" />
        {!collapsed &&
        <div className="flex flex-col">
            <span className="font-display font-bold text-lg leading-tight gradient-text">
              ThoughtMind
            </span>
            <span className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase">
              Agentic AI Platform
            </span>
          </div>
        }
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuKeys.map((item) =>
              <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                  asChild
                  isActive={location.pathname.startsWith(item.url.split("/").slice(0, 2).join("/") || item.url)}
                  tooltip={t(item.key)}>

                    <NavLink
                    to={item.url}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-200 hover:bg-sidebar-accent hover:translate-x-1 hover:shadow-sm active:scale-[0.98]"
                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm">

                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{t(item.key)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2">
        {/* Create Agent CTA */}
        <div className="px-1">
          {!collapsed ?
          <Button className="w-full gradient-primary text-primary-foreground rounded-xl gap-2 h-10 shadow-md hover:shadow-lg transition-shadow" asChild>
              <NavLink to="/agents/new">
                <Plus className="h-4 w-4" />
                {t("sidebar.createAgent")}
              </NavLink>
            </Button> :

          <Button size="icon" className="w-full gradient-primary text-primary-foreground rounded-xl shadow-md hover:shadow-lg transition-shadow" asChild>
              <NavLink to="/agents/new">
                <Plus className="h-4 w-4" />
              </NavLink>
            </Button>
          }
        </div>

        {/* User card */}
        <div className={`rounded-xl border border-sidebar-border bg-sidebar-accent/40 backdrop-blur-sm transition-all ${collapsed ? "p-2 flex flex-col items-center gap-2" : "p-3"}`}>
          <div className={`flex items-center ${collapsed ? "flex-col gap-2" : "gap-3"}`}>
            <Avatar className={`${collapsed ? "h-8 w-8" : "h-10 w-10"} ring-2 ring-primary/20 shrink-0`}>
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="text-xs font-semibold gradient-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed &&
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-sidebar-foreground">{displayName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            }
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ${collapsed ? "h-7 w-7" : "h-8 w-8 shrink-0"}`}
              onClick={handleSignOut}
              title={t("sidebar.signOut")}>

              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>);

}