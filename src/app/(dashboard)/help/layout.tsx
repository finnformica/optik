"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getTutorialStructure, type TutorialCategory } from "@/lib/tutorials";

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  const [structure, setStructure] = useState<TutorialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const pathname = usePathname();

  useEffect(() => {
    loadTutorialStructure();
  }, []);

  const loadTutorialStructure = async () => {
    try {
      setLoading(true);
      const tutorialStructure = await getTutorialStructure();
      setStructure(tutorialStructure);

      // Auto-expand all categories by default for better UX
      if (tutorialStructure.length > 0) {
        setExpandedCategories(new Set(tutorialStructure.map(cat => cat.category)));
      }
    } catch (error) {
      console.error('Failed to load tutorial structure:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getVideoSlug = (videoName: string) => {
    return videoName.replace(/\.(mp4|webm|mov)$/i, '');
  };

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <nav className="min-w-60 overflow-y-auto pr-6 lg:h-auto">
        <h2 className="mb-4 border-b border-gray-700/50 pb-4 text-xl font-semibold text-white">
          Help & Tutorials
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : structure.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <p>No tutorials available yet.</p>
            <p className="text-sm mt-2">Check back soon for helpful guides!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {structure.map((category) => (
              <div key={category.category}>
                {/* Category Header */}
                <div className="mb-2">
                  <Button
                    variant="ghost"
                    onClick={() => toggleCategory(category.category)}
                    className="w-full justify-between text-left text-gray-300 hover:bg-gray-700/50 hover:text-white font-medium"
                  >
                    <span>{category.displayName}</span>
                    {expandedCategories.has(category.category) ?
                      <ChevronDown className="h-4 w-4 flex-shrink-0" /> :
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    }
                  </Button>
                </div>

                {/* Video List */}
                {expandedCategories.has(category.category) && (
                  <div className="ml-4 mb-4 space-y-1">
                    {category.videos.map((video) => {
                      const videoSlug = getVideoSlug(video.name);
                      const videoPath = `/help/${category.category}/${videoSlug}`;
                      const isActive = pathname === videoPath;

                      return (
                        <Link key={video.name} href={videoPath}>
                          <Button
                            variant="ghost"
                            className={`w-full justify-start pl-4 text-sm transition-colors duration-200 ${
                              isActive
                                ? "bg-blue-600/20 text-blue-300"
                                : "text-gray-400 hover:bg-gray-700/30 hover:text-white"
                            }`}
                          >
                            <Play className="mr-2 h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{video.displayName}</span>
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:pr-6 lg:pb-6">
        <div className="pt-6 lg:p-0">{children}</div>
      </main>
    </div>
  );
}