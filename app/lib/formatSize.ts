/**
 * Converts bytes to a human-readable file size string
 * @param bytes - The size in bytes
 * @returns A formatted string (e.g., "1.5 MB", "256 KB", "2.3 GB")
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export const generateUUID = (): string => crypto.randomUUID();
