const MAX_FILE_SIZE = 3 * 1024 * 1024;
const DEFAULT_MAX_DIMENSION = 1600;

export async function prepareImage(
  file: File,
  maxDimension = DEFAULT_MAX_DIMENSION,
): Promise<File> {
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
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Không thể tạo vùng xử lý ảnh.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const webpBlob = await canvasToBlob(canvas, "image/webp", 0.82);
    const format = webpBlob
      ? { blob: webpBlob, extension: "webp" }
      : { blob: await canvasToBlob(canvas, "image/jpeg", 0.82), extension: "jpg" };
    if (!format.blob) throw new Error("Trình duyệt không thể xuất ảnh.");

    let quality = 0.82;
    let blob = format.blob;
    let width = canvas.width;
    let height = canvas.height;
    while (blob.size > MAX_FILE_SIZE && quality >= 0.42) {
      quality = Math.max(0.42, quality - 0.08);
      blob = (await canvasToBlob(canvas, format.blob.type, quality)) ?? blob;
      if (quality === 0.42) break;
    }

    while (blob.size > MAX_FILE_SIZE && Math.max(width, height) > 640) {
      width = Math.max(1, Math.round(width * 0.85));
      height = Math.max(1, Math.round(height * 0.85));
      canvas.width = width;
      canvas.height = height;
      context.drawImage(bitmap, 0, 0, width, height);
      blob = (await canvasToBlob(canvas, format.blob.type, 0.72)) ?? blob;
    }

    if (blob.size > MAX_FILE_SIZE) {
      throw new Error("Không thể nén ảnh xuống dưới 3MB. Vui lòng chọn ảnh nhỏ hơn.");
    }

    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${format.extension}`, {
      type: format.blob.type,
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
