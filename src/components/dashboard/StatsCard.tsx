import { memo } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatsCard = memo(function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  className 
}: StatsCardProps) {
  return (
    <div className={cn(
      "bg-card rounded-xl border border-border p-6 shadow-soft",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm flex items-center gap-1 pt-1",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              <span className="font-medium">{trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground font-normal">vs last period</span>
            </p>
          )}
        </div>
        <div className="p-3 rounded-xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </div>
  );
});