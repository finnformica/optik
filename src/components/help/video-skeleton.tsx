export function VideoSkeleton() {
  return (
    <div className="space-y-6">
      <div className="mb-4 h-8 w-80 animate-pulse rounded bg-gray-600"></div>

      {/* Video Player Skeleton */}
      <div className="aspect-video w-full animate-pulse rounded-lg bg-gray-800">
        <div className="flex h-full items-center justify-center">
          <div className="text-gray-500">
            <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
