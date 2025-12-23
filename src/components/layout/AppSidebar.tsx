import {
  Calendar,
  Users,
  CreditCard,
  Home,
  Menu,
  X,
  Stethoscope,
  LogOut,
  Settings,
  User,
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
  { title: "Payments", url: "/payments", icon: CreditCard },
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
        "border-r border-sidebar-border bg-sidebar transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">DC</span>
              </div>
              <div>
                <h1 className="font-semibold text-sidebar-foreground">DentaCare</h1>
                <p className="text-xs text-muted-foreground">Clinic Management</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hidden md:flex"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className={cn(isCollapsed && "sr-only")}>
            {isDoctor ? "Doctor Menu" : "Patient Menu"}
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
                        end={item.url === "/"}
                        onClick={handleNavClick}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                          "text-sidebar-foreground hover:bg-sidebar-accent",
                          isCollapsed && "justify-center px-2"
                        )}
                        activeClassName="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        {user && (
          <div className={cn("space-y-2", isCollapsed && "flex flex-col items-center")}>
            {!isCollapsed && (
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            )}
            <Button
              variant="ghost"
              size={isCollapsed ? "icon" : "sm"}
              onClick={signOut}
              className={cn(
                "text-muted-foreground hover:text-foreground",
                !isCollapsed && "w-full justify-start"
              )}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">Sign Out</span>}
            </Button>
          </div>
        )}
        {!isCollapsed && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            © 2024 DentaCare
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}