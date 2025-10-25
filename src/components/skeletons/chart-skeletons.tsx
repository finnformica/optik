interface BarChartSkeletonProps {
  bars?: number;
  height?: string;
}

export function BarChartSkeleton({
  bars = 12,
  height = "h-48",
}: BarChartSkeletonProps) {
  // Generate deterministic heights based on index to prevent re-renders
  const generateHeight = (index: number) => {
    // Use a simple algorithm to generate consistent heights
    const seed = (index * 7 + 3) % 13; // Simple pseudo-random based on index
    return 30 + seed * 5; // Heights between 30% and 90%
  };

  return (
    <div className={`w-full ${height} overflow-hidden`}>
      <div className={`flex h-full items-end justify-around space-x-1 px-4`}>
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className="max-w-8 flex-1 animate-pulse rounded-t bg-gray-700"
            style={{
              height: `${generateHeight(i)}%`,
              animationDelay: `${i * 100}ms`,
            }}
          ></div>
        ))}
      </div>
      <div className="mt-2 flex justify-around px-4">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className="h-3 w-6 flex-shrink-0 animate-pulse rounded bg-gray-700"
            style={{ animationDelay: `${i * 100}ms` }}
          ></div>
        ))}
      </div>
    </div>
  );
}

interface LineChartSkeletonProps {
  lines?: number;
  height?: string;
}

export function LineChartSkeleton({
  lines = 2,
  height = "h-48",
}: LineChartSkeletonProps) {
  return (
    <div className={`w-full ${height} overflow-hidden`}>
      <div className={`relative h-full`}>
        <svg
          className="h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Data lines */}
          {Array.from({ length: lines }).map((_, lineIndex) => (
            <path
              key={lineIndex}
              d={
                lineIndex === 0
                  ? "M 5 68 L 18 52 L 31 65 L 44 42 L 57 58 L 70 35 L 83 48 L 95 28"
                  : "M 5 82 L 18 68 L 31 78 L 44 58 L 57 72 L 70 50 L 83 65 L 95 45"
              }
              stroke="rgb(55, 65, 81)"
              strokeWidth="0.8"
              fill="none"
              className="animate-pulse"
              style={{ animationDelay: `${lineIndex * 0.5}s` }}
            />
          ))}
        </svg>
      </div>
      <div className="mt-2 flex justify-around">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-3 w-8 flex-shrink-0 animate-pulse rounded bg-gray-700"
            style={{ animationDelay: `${i * 100}ms` }}
          ></div>
        ))}
      </div>
    </div>
  );
}

interface PieChartSkeletonProps {
  segments?: number;
  size?: number;
  showLegend?: boolean;
  colorTheme?: "default" | "profit-loss";
}

export function PieChartSkeleton({
  segments = 6,
  size = 250,
  showLegend = false,
  colorTheme = "default",
}: PieChartSkeletonProps) {
  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size / 2 - 10;
  const innerRadius = size / 3; // Create donut hole

  // Generate gray variations
  const getGrayColor = (index: number) => {
    const grayShades = [
      "rgb(156, 163, 175)", // gray-400
      "rgb(55, 65, 81)", // gray-700
      "rgb(107, 114, 128)", // gray-500
      "rgb(209, 213, 219)", // gray-300
      "rgb(75, 85, 99)", // gray-600
      "rgb(229, 231, 235)", // gray-200
    ];
    return grayShades[index % grayShades.length];
  };

  // Ensure angles add up to exactly 360 degrees to prevent overlap
  const baseAngle = 360 / segments;
  const segmentAngles = Array.from({ length: segments }, (_, index) => {
    if (index === segments - 1) {
      // Last segment fills remaining space to prevent overlap
      return baseAngle;
    }
    const seed = (index * 7 + 3) % 11;
    return baseAngle + (seed - 5) * 2; // Smaller variation to prevent overlap
  });

  // Adjust last angle to ensure total is exactly 360
  const totalAngle = segmentAngles
    .slice(0, -1)
    .reduce((sum, angle) => sum + angle, 0);
  segmentAngles[segments - 1] = 360 - totalAngle;

  let cumulativeAngle = 0;

  return (
    <div className={`h-72 w-full`}>
      <div className="flex h-full items-center justify-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90 transform">
            {segmentAngles.map((angle, index) => {
              const startAngle = cumulativeAngle;
              const endAngle = cumulativeAngle + angle;

              const startAngleRad = (startAngle * Math.PI) / 180;
              const endAngleRad = (endAngle * Math.PI) / 180;

              // Outer arc points
              const x1 = centerX + outerRadius * Math.cos(startAngleRad);
              const y1 = centerY + outerRadius * Math.sin(startAngleRad);
              const x2 = centerX + outerRadius * Math.cos(endAngleRad);
              const y2 = centerY + outerRadius * Math.sin(endAngleRad);

              // Inner arc points
              const x3 = centerX + innerRadius * Math.cos(endAngleRad);
              const y3 = centerY + innerRadius * Math.sin(endAngleRad);
              const x4 = centerX + innerRadius * Math.cos(startAngleRad);
              const y4 = centerY + innerRadius * Math.sin(startAngleRad);

              const largeArcFlag = angle > 180 ? 1 : 0;

              // Create donut segment path
              const pathData = [
                `M ${x1} ${y1}`,
                `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                `L ${x3} ${y3}`,
                `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                "Z",
              ].join(" ");

              cumulativeAngle += angle;

              return (
                <path
                  key={index}
                  d={pathData}
                  fill={getGrayColor(index)}
                  opacity={0.8}
                  className="animate-pulse"
                  style={{ animationDelay: `${index * 200}ms` }}
                />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
