import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

export function StatCard({ title, value, change, changeType = "neutral", icon: Icon, iconColor }: StatCardProps) {
  return (
    <Card className="stat-gradient">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {change && (
              <p className={cn("text-xs font-medium", {
                "text-success": changeType === "positive",
                "text-destructive": changeType === "negative",
                "text-muted-foreground": changeType === "neutral",
              })}>
                {change}
              </p>
            )}
          </div>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconColor || "bg-primary/10")}>
            <Icon className={cn("h-5 w-5", iconColor ? "text-primary-foreground" : "text-primary")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
