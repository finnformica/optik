import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardWidgetProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const DashboardWidget = ({
  title,
  children,
  className,
  contentClassName,
}: DashboardWidgetProps) => {
  return (
    <Card className={cn("gap-0 border-gray-800 bg-[#1a2236] py-0", className)}>
      <CardHeader className="border-b border-gray-800 p-4">
        <CardTitle className="text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent
        className={cn("relative h-[320px] p-4 px-2", contentClassName)}
      >
        {children}
      </CardContent>
    </Card>
  );
};
