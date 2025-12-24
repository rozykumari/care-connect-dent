import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEO 
        title="Page Not Found" 
        description="The page you're looking for doesn't exist."
        noIndex
      />
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center px-4">
          <div className="mb-8">
            <h1 className="text-8xl font-bold text-primary">404</h1>
          </div>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">Page Not Found</h2>
          <p className="mb-8 text-muted-foreground max-w-md mx-auto">
            Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
          </p>
          <Link to="/">
            <Button className="gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFound;
