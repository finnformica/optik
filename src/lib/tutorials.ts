export function formatCategoryName(folderName: string): string {
  return folderName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatVideoName(fileName: string): string {
  return fileName
    .replace(/\.(mp4|webm|mov)$/i, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
