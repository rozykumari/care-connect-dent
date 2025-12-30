import {
  Calendar,
  Users,
  CreditCard,
  Home,
  Stethoscope,
  LogOut,
  User,
  Clock,
  Package,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";

const doctorMenuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Appointments", url: "/appointments", icon: Calendar },
  { title: "Patients", url: "/patients", icon: Users },
  { title: "Patient Management", url: "/doctor", icon: Stethoscope },
  { title: "Availability", url: "/doctor/availability", icon: Clock },
  { title: "Inventory", url: "/doctor/inventory", icon: Package },
  { title: "Payments", url: "/payments", icon: CreditCard },
  { title: "My Profile", url: "/profile", icon: User },
];

const patientMenuItems = [
  { title: "My Profile", url: "/profile", icon: User },
  { title: "Book Appointment", url: "/book-appointment", icon: Calendar },
];

export function AppSidebar() {
  const { state, toggleSidebar, setOpenMobile } = useSidebar();
  const { isDoctor, isPatient, loading } = useUserRole();
  const { user, signOut } = useAuth();
  const isCollapsed = state === "collapsed";

  const menuItems = isDoctor ? doctorMenuItems : isPatient ? patientMenuItems : [];

  const handleNavClick = () => {
    // Close mobile sidebar when navigating
    setOpenMobile(false);
  };

  return (
    <Sidebar
      className={cn(
        "border-r border-sidebar-border bg-sidebar transition-all duration-300 print:hidden",
        "titanium-texture"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="p-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-sapphire flex items-center justify-center flex-shrink-0 glow-sapphire-subtle">
            <span className="text-primary-foreground font-bold text-sm tracking-tight">DC</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-display font-semibold text-sidebar-foreground tracking-tight">DentaCare</h1>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {isDoctor ? "Physician Portal" : "Patient Portal"}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className={cn("text-[10px] uppercase tracking-widest text-muted-foreground", isCollapsed && "sr-only")}>
            {isDoctor ? "Navigation" : "Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                <div className="px-3 py-2">
                  <div className="h-8 bg-muted/50 rounded animate-pulse" />
                </div>
              ) : (
                menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/" || item.url === "/doctor"}
                        onClick={handleNavClick}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200",
                          "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                          "border border-transparent hover:border-border/30",
                          isCollapsed && "justify-center px-2"
                        )}
                        activeClassName="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border/50">
        {user && (
          <div className={cn("space-y-3", isCollapsed && "flex flex-col items-center")}>
            {!isCollapsed && (
              <p className="text-[11px] text-muted-foreground truncate font-medium">
                {user.email}
              </p>
            )}
            <Button
              variant="ghost"
              size={isCollapsed ? "icon" : "sm"}
              onClick={signOut}
              className={cn(
                "text-muted-foreground hover:text-foreground hover:bg-destructive/10 transition-colors",
                !isCollapsed && "w-full justify-start"
              )}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2 text-sm">Sign Out</span>}
            </Button>
          </div>
        )}
        {!isCollapsed && (
          <div className="mt-4 pt-3 border-t border-sidebar-border/30">
            <p className="text-[10px] text-muted-foreground/60 text-center uppercase tracking-widest">
              © 2024 DentaCare
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}