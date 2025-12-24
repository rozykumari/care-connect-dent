import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/appointments": "Appointments",
  "/patients": "Patients",
  "/procedures": "Procedures",
  "/prescriptions": "Prescriptions",
  "/enquiries": "Enquiries",
  "/payments": "Payments",
  "/inventory": "Inventory",
  "/reports": "Reports",
  "/doctor": "Patient Management",
  "/doctor/availability": "Availability",
  "/doctor/inventory": "Inventory",
  "/profile": "My Profile",
  "/book-appointment": "Book Appointment",
  "/auth": "Sign In",
};

export const Breadcrumb = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Build breadcrumb items
  const items: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

  let currentPath = "";
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`;
    const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
    items.push({ label, href: currentPath });
  });

  // Don't show breadcrumb on home page or auth page
  if (location.pathname === "/" || location.pathname === "/auth") {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={item.href || index} className="flex items-center gap-1">
              {index === 0 && <Home className="h-3.5 w-3.5" />}
              
              {isLast ? (
                <span className="font-medium text-foreground" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <>
                  <Link
                    to={item.href!}
                    className={cn(
                      "hover:text-foreground transition-colors",
                      index === 0 && "ml-1"
                    )}
                  >
                    {item.label}
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
