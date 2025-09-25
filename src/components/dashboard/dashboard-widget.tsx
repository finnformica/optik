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
    <Card className={cn("bg-[#1a2236] border-gray-800 py-0", className)}>
      <CardHeader className="border-b border-gray-800 p-4">
        <CardTitle className="text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className={cn("px-2", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
};
