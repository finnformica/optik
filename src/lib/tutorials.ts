import { createClient } from "@/lib/supabase/client";

export interface TutorialVideo {
  name: string;
  displayName: string;
  size: number;
  lastModified: string;
}

export interface TutorialCategory {
  category: string;
  displayName: string;
  videos: TutorialVideo[];
}

export async function getTutorialStructure(): Promise<TutorialCategory[]> {
  const supabase = createClient();

  try {
    // List all folders (categories) in tutorials bucket
    const { data: folders, error } = await supabase.storage
      .from('tutorials')
      .list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('Error loading tutorial folders:', error);
      return [];
    }

    if (!folders) return [];

    // For each folder, get the videos inside
    const structure = await Promise.all(
      folders
        .filter(item => !item.name.includes('.')) // Only folders (no file extensions)
        .map(async (folder) => {
          const { data: videos, error: videosError } = await supabase.storage
            .from('tutorials')
            .list(folder.name, {
              limit: 100,
              sortBy: { column: 'name', order: 'asc' }
            });

          if (videosError) {
            console.error(`Error loading videos for ${folder.name}:`, videosError);
            return {
              category: folder.name,
              displayName: formatCategoryName(folder.name),
              videos: []
            };
          }

          const videoFiles = videos?.filter(item =>
            item.name.endsWith('.mp4') || item.name.endsWith('.webm') || item.name.endsWith('.mov')
          ) || [];

          return {
            category: folder.name,
            displayName: formatCategoryName(folder.name),
            videos: videoFiles.map(video => ({
              name: video.name,
              displayName: formatVideoName(video.name),
              size: video.metadata?.size || 0,
              lastModified: video.updated_at || video.created_at || ''
            }))
          };
        })
    );

    return structure.filter(category => category.videos.length > 0);
  } catch (error) {
    console.error('Error in getTutorialStructure:', error);
    return [];
  }
}

export function formatCategoryName(folderName: string): string {
  return folderName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatVideoName(fileName: string): string {
  return fileName
    .replace(/\.(mp4|webm|mov)$/i, '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function getVideoSignedUrl(category: string, videoName: string): Promise<string | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.storage
      .from('tutorials')
      .createSignedUrl(`${category}/${videoName}`, 60 * 60); // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data?.signedUrl || null;
  } catch (error) {
    console.error('Error in getVideoSignedUrl:', error);
    return null;
  }
}