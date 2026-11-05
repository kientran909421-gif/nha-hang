export type ImageProfileName = "hero" | "story" | "promo" | "menu";

export type ImageProfile = {
  maxDimension: number;
  quality: number;
  maxBytes: number;
  minQuality: number;
};

export const IMAGE_PROFILES: Record<ImageProfileName, ImageProfile> = {
  hero: { maxDimension: 2560, quality: 0.9, maxBytes: 3.5 * 1024 * 1024, minQuality: 0.8 },
  story: { maxDimension: 1920, quality: 0.86, maxBytes: 3 * 1024 * 1024, minQuality: 0.8 },
  promo: { maxDimension: 1920, quality: 0.86, maxBytes: 3 * 1024 * 1024, minQuality: 0.8 },
  menu: { maxDimension: 1200, quality: 0.82, maxBytes: 3 * 1024 * 1024, minQuality: 0.8 },
};

export function getImageProfile(name: ImageProfileName) {
  return IMAGE_PROFILES[name];
}

export function isImageProfileName(value: string): value is ImageProfileName {
  return value in IMAGE_PROFILES;
}
