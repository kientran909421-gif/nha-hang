import { getImageProfile, type ImageProfileName } from "@/lib/image-profiles";

export async function prepareImage(
  file: File,
  profileName: ImageProfileName,
): Promise<File> {
  const profile = getImageProfile(profileName);
  const extension = file.name.split(".").pop()?.toLowerCase();
  const supportedType =
    ["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    (file.type === "" && ["jpg", "jpeg", "png", "webp"].includes(extension ?? ""));
  if (!supportedType) {
    throw new Error("Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.");
  }

  if (!("createImageBitmap" in window)) {
    throw new Error("Trình duyệt không hỗ trợ xử lý ảnh này.");
  }

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, profile.maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Không thể tạo vùng xử lý ảnh.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const webpBlob = await canvasToBlob(canvas, "image/webp", profile.quality);
    const format = webpBlob
      ? { blob: webpBlob, extension: "webp" }
      : { blob: await canvasToBlob(canvas, "image/jpeg", profile.quality), extension: "jpg" };
    if (!format.blob) throw new Error("Trình duyệt không thể xuất ảnh.");

    let quality = profile.quality;
    let blob = format.blob;
    let width = canvas.width;
    let height = canvas.height;
    while (blob.size > profile.maxBytes && quality > profile.minQuality) {
      quality = Math.max(profile.minQuality, quality - 0.05);
      blob = (await canvasToBlob(canvas, format.blob.type, quality)) ?? blob;
    }

    while (blob.size > profile.maxBytes && Math.max(width, height) > 640) {
      width = Math.max(1, Math.round(width * 0.85));
      height = Math.max(1, Math.round(height * 0.85));
      canvas.width = width;
      canvas.height = height;
      context.drawImage(bitmap, 0, 0, width, height);
      blob = (await canvasToBlob(canvas, format.blob.type, profile.minQuality)) ?? blob;
    }

    if (blob.size > profile.maxBytes) {
      throw new Error(`Không thể nén ảnh xuống dưới ${profile.maxBytes / (1024 * 1024)}MB. Vui lòng chọn ảnh nhỏ hơn.`);
    }

    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${format.extension}`, {
      type: format.blob.type,
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

export async function readImageInfo(file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const info = { width: bitmap.width, height: bitmap.height, bytes: file.size };
  bitmap.close();
  return info;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
