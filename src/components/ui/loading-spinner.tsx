import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  fullScreen?: boolean;
  text?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-4",
  lg: "h-12 w-12 border-4",
};

export const LoadingSpinner = ({ 
  size = "md", 
  className,
  fullScreen = false,
  text,
}: LoadingSpinnerProps) => {
  const spinner = (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div 
        className={cn(
          "animate-spin rounded-full border-primary border-t-transparent",
          sizeClasses[size]
        )} 
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export const PageLoader = () => (
  <LoadingSpinner fullScreen size="lg" text="Loading..." />
);

export const CardLoader = () => (
  <div className="flex items-center justify-center h-64">
    <LoadingSpinner size="md" />
  </div>
);
