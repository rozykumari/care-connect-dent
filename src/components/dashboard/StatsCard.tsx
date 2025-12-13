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

export function StatsCard({ title, value, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <div className={cn(
      "glass-card rounded-xl p-6 animate-fade-in",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm mt-2 flex items-center gap-1",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              <span className="text-muted-foreground">vs last month</span>
            </p>
          )}
        </div>
        <div className="p-3 rounded-lg gradient-primary">
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
}
