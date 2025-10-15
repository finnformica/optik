"use server";

import { createClient } from "@/lib/supabase/server";
import { formatCategoryName, formatVideoName } from "@/lib/tutorials";
import { TutorialCategory } from "@/types/tutorials";

export async function getVideoSignedUrl(
  category: string,
  videoName: string,
): Promise<string | null> {
  const supabase = await createClient();

  try {
    // Ensure videoName has the correct file extension
    let fullVideoName = videoName;
    if (!videoName.match(/\.(mp4|webm|mov)$/i)) {
      // If no extension, try to find the file with extension
      const { data: files, error: listError } = await supabase.storage
        .from("tutorials")
        .list(category);

      if (listError) {
        console.error("Error listing files in category:", listError);
        return null;
      }

      const matchingFile = files?.find(
        (file) => file.name.replace(/\.(mp4|webm|mov)$/i, "") === videoName,
      );

      if (matchingFile) {
        fullVideoName = matchingFile.name;
      } else {
        console.error(
          `Video file not found: ${videoName} in category ${category}`,
        );
        return null;
      }
    }

    const filePath = `${category}/${fullVideoName}`;

    const { data, error } = await supabase.storage
      .from("tutorials")
      .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

    if (error) {
      console.error(
        "Error creating signed URL:",
        error,
        "for file path:",
        filePath,
      );
      return null;
    }

    return data?.signedUrl || null;
  } catch (error) {
    console.error("Error in getVideoSignedUrl:", error);
    return null;
  }
}

export async function getTutorialStructure(): Promise<TutorialCategory[]> {
  const supabase = await createClient();

  try {
    // List all folders (categories) in tutorials bucket
    const { data: folders, error } = await supabase.storage
      .from("tutorials")
      .list("", {
        limit: 100,
        sortBy: { column: "name", order: "asc" },
      });

    if (error) {
      console.error("Error message:", error.message);
      console.error("Error details:", error);
      return [];
    }

    if (!folders) {
      return [];
    }

    // For each folder, get the videos inside
    const folderItems = folders.filter((item) => !item.name.includes("."));

    if (folderItems.length === 0) {
      return [];
    }

    const structure = await Promise.all(
      folderItems.map(async (folder) => {
        const { data: videos, error: videosError } = await supabase.storage
          .from("tutorials")
          .list(folder.name, {
            limit: 100,
            sortBy: { column: "name", order: "asc" },
          });

        if (videosError) {
          return {
            category: folder.name,
            displayName: formatCategoryName(folder.name),
            videos: [],
          };
        }

        const videoFiles =
          videos?.filter(
            (item) =>
              item.name.endsWith(".mp4") ||
              item.name.endsWith(".webm") ||
              item.name.endsWith(".mov"),
          ) || [];

        return {
          category: folder.name,
          displayName: formatCategoryName(folder.name),
          videos: videoFiles.map((video) => ({
            name: video.name,
            displayName: formatVideoName(video.name),
            size: video.metadata?.size || 0,
            lastModified: video.updated_at || video.created_at || "",
          })),
        };
      }),
    );

    const finalStructure = structure.filter(
      (category) => category.videos.length > 0,
    );

    return finalStructure;
  } catch (error) {
    console.error("Error in getTutorialStructure:", error);
    return [];
  }
}
