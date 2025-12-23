import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Menu } from "lucide-react";
import { Link } from "react-router-dom";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, signOut } = useAuth();
  const { isDoctor, isPatient } = useUserRole();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto flex flex-col">
          {/* Header with sidebar trigger - visible on all screen sizes */}
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4">
            <SidebarTrigger className="h-8 w-8">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <div className="flex-1">
              <span className="font-semibold text-foreground">DentaCare</span>
            </div>
            <div className="flex items-center gap-2">
              {isPatient && (
                <Link to="/profile">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              {user && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </header>
          <div className="container mx-auto p-4 md:p-6 max-w-7xl flex-1">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}