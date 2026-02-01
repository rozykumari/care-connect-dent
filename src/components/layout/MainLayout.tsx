import { memo } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

interface MainLayoutProps {
  children: React.ReactNode;
  showBreadcrumb?: boolean;
}

export const MainLayout = memo(function MainLayout({ 
  children, 
  showBreadcrumb = true 
}: MainLayoutProps) {
  const { user, signOut } = useAuth();
  const { isPatient } = useUserRole();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background print:block print:min-h-0">
        <AppSidebar />
        <main className="flex-1 overflow-auto flex flex-col print:overflow-visible">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur-md px-4 lg:px-6 print:hidden">
            <SidebarTrigger className="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            
            <div className="flex-1 flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">D</span>
                </div>
                <div>
                  <span className="font-semibold text-foreground">DentaCare</span>
                  <span className="hidden md:inline text-muted-foreground text-xs ml-2">Dental Clinic</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              {isPatient && (
                <Link to="/profile">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              {user && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 text-muted-foreground hover:text-destructive" 
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </header>

          <div className="flex-1 p-4 lg:p-8 print:p-0">
            <div className="mx-auto max-w-7xl animate-fade-in">
              {showBreadcrumb && <Breadcrumb />}
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
});