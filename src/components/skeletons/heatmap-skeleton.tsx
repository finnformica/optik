interface HeatmapSkeletonProps {
  weeks?: number;
  daysPerWeek?: number;
  showDayLabels?: boolean;
  showLegend?: boolean;
}

export function HeatmapSkeleton({
  weeks = 10,
  daysPerWeek = 5,
  showDayLabels = true,
  showLegend = true,
}: HeatmapSkeletonProps) {
  const dayLabels = ["M", "T", "W", "T", "F"];

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="flex h-full flex-col justify-between">
        {/* Scrollable container skeleton */}
        <div className="overflow-x-auto">
          <div className="flex gap-1 p-0.5" style={{ width: "max-content" }}>
            {/* Day labels skeleton */}
            {showDayLabels && (
              <div className="sticky left-0 z-10 flex flex-col justify-end gap-1 pr-2">
                {dayLabels.slice(0, daysPerWeek).map((day, i) => (
                  <div key={i} className="flex h-10 items-center">
                    <div
                      className="h-3 w-8 animate-pulse rounded bg-gray-700"
                      style={{ animationDelay: `${i * 100}ms` }}
                    ></div>
                  </div>
                ))}
              </div>
            )}

            {/* Heatmap grid skeleton */}
            <div className="flex gap-1">
              {Array.from({ length: weeks }).map((_, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {Array.from({ length: daysPerWeek }).map((_, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className="h-10 w-10 animate-pulse rounded bg-gray-700"
                      style={{
                        animationDelay: `${(weekIndex * daysPerWeek + dayIndex) * 50}ms`,
                        animationDuration: "2s",
                      }}
                    ></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend skeleton */}
        {showLegend && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-3 w-8 animate-pulse rounded bg-gray-700"></div>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-3 w-3 animate-pulse rounded bg-gray-700"
                    style={{ animationDelay: `${i * 200}ms` }}
                  ></div>
                ))}
              </div>
              <div className="h-3 w-8 animate-pulse rounded bg-gray-700"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-3 w-16 animate-pulse rounded bg-gray-700"></div>
              <div className="h-3 w-16 animate-pulse rounded bg-gray-700"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
