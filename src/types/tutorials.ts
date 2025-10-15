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
