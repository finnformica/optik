"use client";

interface VideoPlayerProps {
  signedUrl: string | null;
  title: string;
}

export function VideoPlayer({ signedUrl, title }: VideoPlayerProps) {
  if (!signedUrl) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-gray-800">
        <div className="text-center">
          <div className="mb-2 text-red-400">Video Not Available</div>
          <div className="text-sm text-gray-400">
            Unable to load video. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <video
        controls
        className="h-full w-full"
        src={signedUrl}
        title={title}
      >
        <p className="p-4 text-white">
          Your browser does not support the video tag.
          <a href={signedUrl} className="ml-2 text-blue-400 underline">
            Download the video instead
          </a>
        </p>
      </video>
    </div>
  );
}