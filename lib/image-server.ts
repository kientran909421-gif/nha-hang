import sharp from "sharp";
import { getImageProfile, isImageProfileName } from "@/lib/image-profiles";

export class ImageProcessingError extends Error {}

export async function prepareServerImage(
  file: File,
  profileName: string,
  browserPrepared = false,
): Promise<Buffer> {
  if (!isImageProfileName(profileName)) {
    throw new ImageProcessingError("Loại ảnh không hợp lệ.");
  }
  const profile = getImageProfile(profileName);
  if (file.size > 4 * 1024 * 1024) {
    throw new ImageProcessingError("Ảnh gửi lên vượt quá giới hạn 4MB.");
  }

  const input = Buffer.from(await file.arrayBuffer());
  if (!isSupportedImage(input)) {
    throw new ImageProcessingError("Chỉ chấp nhận ảnh JPG, PNG hoặc WebP hợp lệ.");
  }

  const metadata = await sharp(input).metadata();
  if (
    browserPrepared &&
    metadata.format === "webp" &&
    metadata.width &&
    metadata.height &&
    Math.max(metadata.width, metadata.height) <= profile.maxDimension &&
    file.size <= profile.maxBytes
  ) {
    return sharp(input).rotate().toBuffer();
  }

  let width = profile.maxDimension;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    for (let quality = profile.quality * 100; quality >= profile.minQuality * 100; quality -= 5) {
      const output = await sharp(input)
        .rotate()
        .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
        .webp({ quality, effort: 4, smartSubsample: true })
        .toBuffer();
      if (output.length <= profile.maxBytes) return output;
    }
    width = Math.max(640, Math.round(width * 0.85));
  }

  throw new ImageProcessingError(`Không thể xử lý ảnh xuống dưới ${profile.maxBytes / (1024 * 1024)}MB. Vui lòng chọn ảnh nhỏ hơn.`);
}

function isSupportedImage(bytes: Uint8Array) {
  return (
    (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
    (bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a) ||
    (bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP")
  );
}
