import sharp from "sharp";

const MAX_FILE_SIZE = 3 * 1024 * 1024;

export class ImageProcessingError extends Error {}

export async function prepareServerImage(
  file: File,
  maxDimension = 1600,
): Promise<Buffer> {
  if (file.size > MAX_FILE_SIZE) {
    throw new ImageProcessingError("Ảnh không được vượt quá 3MB.");
  }

  const input = Buffer.from(await file.arrayBuffer());
  if (!isSupportedImage(input)) {
    throw new ImageProcessingError("Chỉ chấp nhận ảnh JPG, PNG hoặc WebP hợp lệ.");
  }

  let width = maxDimension;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    for (let quality = 82; quality >= 42; quality -= 8) {
      const output = await sharp(input)
        .rotate()
        .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();
      if (output.length <= MAX_FILE_SIZE) return output;
    }
    width = Math.max(640, Math.round(width * 0.85));
  }

  throw new ImageProcessingError("Không thể xử lý ảnh xuống dưới 3MB.");
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
