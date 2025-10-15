import { redirect } from "next/navigation";
import { getTutorialStructure } from "./actions";

export default async function HelpPage() {
  const structure = await getTutorialStructure();

  // Find the first available video
  const firstCategoryWithVideos = structure.find(category => category.videos.length > 0);

  if (firstCategoryWithVideos && firstCategoryWithVideos.videos.length > 0) {
    const firstVideo = firstCategoryWithVideos.videos[0];
    const videoSlug = firstVideo.name.replace(/\.(mp4|webm|mov)$/i, "");
    redirect(`/help/${firstCategoryWithVideos.category}/${videoSlug}`);
  }

  // If no videos available, show empty state
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Help & Tutorials</h1>
        <p className="text-gray-400">No tutorials available yet.</p>
        <p className="text-sm text-gray-500 mt-2">Check back soon for helpful guides!</p>
      </div>
    </div>
  );
}
