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
  const { state, setOpenMobile } = useSidebar();
  const { isDoctor, isPatient, loading } = useUserRole();
  const { user, signOut } = useAuth();
  const isCollapsed = state === "collapsed";

  const menuItems = isDoctor ? doctorMenuItems : isPatient ? patientMenuItems : [];

  const handleNavClick = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar
      className={cn(
        "border-r border-border bg-sidebar transition-all duration-300 print:hidden"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-primary-foreground font-bold text-base">D</span>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="font-semibold text-sidebar-foreground truncate">DentaCare</h1>
              <p className="text-xs text-muted-foreground truncate">
                {isDoctor ? "Doctor Portal" : "Patient Portal"}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4 px-2">
        <SidebarGroup>
          <SidebarGroupLabel className={cn(
            "text-xs font-medium text-muted-foreground px-2 mb-2",
            isCollapsed && "sr-only"
          )}>
            {isDoctor ? "Navigation" : "Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {loading ? (
                <div className="px-2 py-2 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
                  ))}
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
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                          "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                          isCollapsed && "justify-center px-2"
                        )}
                        activeClassName="bg-primary/10 text-primary font-medium"
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        {user && (
          <div className={cn("space-y-3", isCollapsed && "flex flex-col items-center")}>
            {!isCollapsed && (
              <div className="px-1">
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size={isCollapsed ? "icon" : "sm"}
              onClick={signOut}
              className={cn(
                "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                !isCollapsed && "w-full justify-start"
              )}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2 text-sm">Sign Out</span>}
            </Button>
          </div>
        )}
        {!isCollapsed && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground/60 text-center">
              © 2024 DentaCare
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}