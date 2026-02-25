import { LayoutDashboard, Bot, Store, MessageCircle, Activity, Rocket, Settings, Plus } from "lucide-react";
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

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Agents", url: "/agents/new", icon: Bot },
  { title: "Marketplace", url: "/marketplace", icon: Store },
  { title: "Chat", url: "/chat", icon: MessageCircle },
  { title: "Monitor", url: "/monitor", icon: Activity },
  { title: "Deploy", url: "/deploy", icon: Rocket },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

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
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname.startsWith(item.url.split("/").slice(0, 2).join("/") || item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed ? (
          <Button className="w-full gradient-primary text-primary-foreground rounded-xl gap-2" asChild>
            <NavLink to="/agents/new">
              <Plus className="h-4 w-4" />
              สร้าง Agent ใหม่
            </NavLink>
          </Button>
        ) : (
          <Button size="icon" className="gradient-primary text-primary-foreground rounded-xl" asChild>
            <NavLink to="/agents/new">
              <Plus className="h-4 w-4" />
            </NavLink>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
