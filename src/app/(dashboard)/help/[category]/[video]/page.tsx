import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  getTutorialStructure,
  getVideoSignedUrl,
} from "@/app/(dashboard)/help/actions";
import { VideoPlayer } from "@/components/help/video-player";
import { VideoSkeleton } from "@/components/help/video-skeleton";
import { formatVideoName } from "@/lib/tutorials";

interface VideoPageProps {
  params: Promise<{ category: string; video: string }>;
}

async function VideoContent({
  category,
  video,
}: {
  category: string;
  video: string;
}) {
  // Verify the video exists by checking our tutorial structure
  const structure = await getTutorialStructure();
  const categoryData = structure.find((cat) => cat.category === category);

  if (!categoryData) {
    notFound();
  }

  const videoData = categoryData.videos.find((v) => {
    const videoSlug = v.name.replace(/\.(mp4|webm|mov)$/i, "");
    return videoSlug === video;
  });

  if (!videoData) {
    notFound();
  }

  const videoDisplayName = formatVideoName(videoData.name);

  // Get signed URL server-side
  const signedUrl = await getVideoSignedUrl(category, videoData.name);

  return (
    <div className="space-y-6">
      <h1 className="mb-3 text-xl font-bold text-white">{videoDisplayName}</h1>

      {/* Video Player */}
      <VideoPlayer signedUrl={signedUrl} title={videoDisplayName} />
    </div>
  );
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { category, video } = await params;

  return (
    <Suspense fallback={<VideoSkeleton />}>
      <VideoContent category={category} video={video} />
    </Suspense>
  );
}
