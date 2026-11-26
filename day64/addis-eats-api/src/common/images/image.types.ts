// What the database keeps about an image (never a URL: the URL embeds a provider you will change).
export interface StoredImage {
  key: string; // restaurants/3f7a....webp : location-independent
  thumbKey: string; // restaurants/3f7a....-thumb.webp
  originalName: string; // only a label for people, NEVER a path segment
  detectedType: string; // what the BYTES were (image/jpeg), not what the caller claimed
  contentType: string; // what we stored: always image/webp
  size: number; // bytes of the full image
  thumbSize: number;
}
