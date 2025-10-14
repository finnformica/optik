"use client";

import { Play, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTutorials } from "@/api/tutorials";

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  const { tutorials, isLoading } = useTutorials();
  const pathname = usePathname();

  const getVideoSlug = (videoName: string) => {
    return videoName.replace(/\.(mp4|webm|mov)$/i, '');
  };

  const renderNavigation = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      );
    }

    if (tutorials.length === 0) {
      return null;
    }

    return (
      <nav className="space-y-6">
        {tutorials.map((category) => (
          <div key={category.category}>
            {/* Category Header - styled like documentation */}
            <h3 className="text-gray-300 font-medium text-sm mb-2">
              {category.displayName}
            </h3>

            {/* Video Links - styled like documentation */}
            <ul className="space-y-1">
              {category.videos.map((video) => {
                const videoSlug = getVideoSlug(video.name);
                const videoPath = `/help/${category.category}/${videoSlug}`;
                const isActive = pathname === videoPath;

                return (
                  <li key={video.name}>
                    <Link
                      href={videoPath}
                      className={`flex items-center px-2 py-1.5 rounded text-sm transition-colors ${
                        isActive
                          ? "bg-gray-800 text-white"
                          : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                      }`}
                    >
                      <Play className="w-3 h-3 mr-2 flex-shrink-0" />
                      {video.displayName}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    );
  };

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <nav className="min-w-60 overflow-y-auto pr-6 lg:h-auto">
        <h2 className="mb-4 border-b border-gray-700/50 pb-4 text-xl font-semibold text-white">
          Help & Tutorials
        </h2>

        {renderNavigation()}
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:pr-6 lg:pb-6">
        <div className="pt-6 lg:p-0">{children}</div>
      </main>
    </div>
  );
}