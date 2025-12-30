import { memo } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Menu } from "lucide-react";
import { Link } from "react-router-dom";

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
          {/* Header with sidebar trigger - hidden on print */}
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 print:hidden">
            <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <div className="flex-1">
              <span className="font-display font-semibold text-foreground tracking-tight">DentaCare</span>
              <span className="hidden sm:inline text-muted-foreground text-sm ml-2">|</span>
              <span className="hidden sm:inline text-muted-foreground text-xs ml-2 uppercase tracking-widest">Precision Medicine</span>
            </div>
            <div className="flex items-center gap-1">
              {isPatient && (
                <Link to="/profile">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              {user && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" 
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </header>
          <div className="container mx-auto p-4 md:p-6 max-w-7xl flex-1 print:p-0 print:max-w-none">
            {showBreadcrumb && <Breadcrumb />}
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
});