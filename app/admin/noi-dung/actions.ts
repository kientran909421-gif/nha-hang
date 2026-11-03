"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

const openingHourSchema = z.object({
  day: z.string().trim().min(1, "Vui lòng nhập ngày."),
  hours: z.string().trim().min(1, "Vui lòng nhập giờ mở cửa."),
});

const settingsSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên nhà hàng."),
  tagline: z.string().trim().min(1, "Vui lòng nhập khẩu hiệu."),
  phone: z
    .string()
    .transform((value) => value.replace(/[\s.-]/g, ""))
    .refine((value) => /^(\+84|0)(3|5|7|8|9)\d{8}$/.test(value), {
      message: "Số điện thoại không đúng định dạng Việt Nam.",
    }),
  email: z.string().trim().email("Email không hợp lệ."),
  address: z.string().trim().min(1, "Vui lòng nhập địa chỉ."),
  mapEmbedUrl: z.string().trim().refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return (
        (url.hostname === "google.com" || url.hostname === "www.google.com") &&
        url.pathname.startsWith("/maps")
      );
    } catch {
      return false;
    }
  }, "Link bản đồ phải thuộc google.com/maps."),
  facebook: z.string().trim().refine((value) => !value || value === "#" || URL.canParse(value), "Link Facebook không hợp lệ."),
  instagram: z.string().trim().refine((value) => !value || value === "#" || URL.canParse(value), "Link Instagram không hợp lệ."),
  zalo: z.string().trim().refine((value) => !value || value === "#" || URL.canParse(value), "Link Zalo không hợp lệ."),
  openingHours: z.array(openingHourSchema).min(1, "Cần ít nhất một dòng giờ mở cửa."),
});

const homepageSchema = z.object({
  heroTitle: z.string().trim().min(1, "Vui lòng nhập tiêu đề hero."),
  heroTagline: z.string().trim().min(1, "Vui lòng nhập phụ đề hero."),
  heroImageUrl: z.string().trim().min(1, "Vui lòng tải ảnh hero."),
  storyTitle: z.string().trim().min(1, "Vui lòng nhập tiêu đề câu chuyện."),
  storyContent: z.string().trim().min(1, "Vui lòng nhập nội dung câu chuyện."),
  storyImageUrl: z.string().trim().min(1, "Vui lòng tải ảnh câu chuyện."),
});

const seoSchema = z.object({
  seoTitle: z.string().trim().min(1, "Vui lòng nhập tiêu đề SEO.").max(60, "Tiêu đề SEO không quá 60 ký tự."),
  seoDescription: z.string().trim().min(1, "Vui lòng nhập mô tả SEO.").max(160, "Mô tả SEO không quá 160 ký tự."),
});

const promotionSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Vui lòng nhập tiêu đề."),
  description: z.string().trim().min(1, "Vui lòng nhập mô tả."),
  imageUrl: z.string().trim().min(1, "Vui lòng tải ảnh ưu đãi."),
  startsOn: z.string().min(1, "Vui lòng chọn ngày bắt đầu."),
  endsOn: z.string().min(1, "Vui lòng chọn ngày kết thúc."),
  active: z.enum(["true", "false"]).transform((value) => value === "true"),
});

const testimonialSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Vui lòng nhập tên khách."),
  quote: z.string().trim().min(1, "Vui lòng nhập nội dung."),
  stars: z.coerce.number().int().min(1).max(5),
  source: z.enum(["Google", "Facebook", "Khác"]),
  active: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export type SaveSettingsState = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  savedValues?: Record<string, string>;
};

function validationState(error: z.ZodError): SaveSettingsState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
  }
  return { success: false, fieldErrors };
}

async function updateSettingsData(
  updates: Record<string, unknown>,
  savedValues?: Record<string, string>,
): Promise<SaveSettingsState> {
  const { data: current, error: readError } = await supabaseAdmin
    .from("site_settings")
    .select("id, data")
    .eq("id", 1)
    .maybeSingle<{ id: string; data: Record<string, unknown> | null }>();

  if (readError) {
    console.log("[admin-content] Đọc site_settings lỗi:", readError.message);
    return { success: false, message: `Không thể đọc thông tin website: ${readError.message}` };
  }

  const nextData = {
    ...(current?.data ?? {}),
    ...updates,
  };
  const payload = {
    data: nextData,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("site_settings")
    .update({
      ...payload,
    })
    .eq("id", 1)
    .select();

  console.log("[admin-content] Cập nhật site_settings:", {
    error: updateError?.message ?? null,
    rows: updated?.length ?? 0,
  });
  if (updateError) {
    return { success: false, message: `Không thể lưu thông tin website: ${updateError.message}` };
  }
  if (updated?.length !== 1) {
    const { data: inserted, error: upsertError } = await supabaseAdmin
      .from("site_settings")
      .upsert({ id: 1, ...payload }, { onConflict: "id" })
      .select();

    console.log("[admin-content] Upsert site_settings:", {
      error: upsertError?.message ?? null,
      rows: inserted?.length ?? 0,
    });
    if (upsertError) {
      return { success: false, message: `Không thể tạo thông tin website: ${upsertError.message}` };
    }
    if (inserted?.length !== 1) {
      return { success: false, message: "Không thể xác nhận dữ liệu website đã được lưu." };
    }
  }

  revalidatePath("/", "layout");
  revalidatePath("/lien-he");
  revalidatePath("/admin/noi-dung");
  return { success: true, message: "Đã lưu", savedValues };
}

export async function saveSiteSettings(
  _previousState: SaveSettingsState,
  formData: FormData,
): Promise<SaveSettingsState> {
  await requirePermission("settings.edit");
  let openingHours: unknown;
  try {
    openingHours = JSON.parse(String(formData.get("openingHours") ?? "[]"));
  } catch {
    return { success: false, message: "Danh sách giờ mở cửa không hợp lệ." };
  }

  const parsed = settingsSchema.safeParse({
    name: formData.get("name"),
    tagline: formData.get("tagline"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    mapEmbedUrl: formData.get("mapEmbedUrl"),
    facebook: formData.get("facebook"),
    instagram: formData.get("instagram"),
    zalo: formData.get("zalo"),
    openingHours,
  });
  if (!parsed.success) return validationState(parsed.error);

  const { data: current, error: readError } = await supabaseAdmin
    .from("site_settings")
    .select("data")
    .eq("id", 1)
    .maybeSingle<{ data: Record<string, unknown> | null }>();
  if (readError) {
    console.log("[admin-content] Đọc site_settings lỗi:", readError.message);
    return { success: false, message: `Không thể đọc thông tin website: ${readError.message}` };
  }

  const currentData = current?.data ?? {};
  return updateSettingsData({
    name: parsed.data.name,
    tagline: parsed.data.tagline,
    phone: parsed.data.phone,
    email: parsed.data.email,
    address: parsed.data.address,
    mapEmbedUrl: parsed.data.mapEmbedUrl,
    socialLinks: {
      ...(typeof currentData.socialLinks === "object" && currentData.socialLinks !== null
        ? currentData.socialLinks
        : {}),
      facebook: parsed.data.facebook,
      instagram: parsed.data.instagram,
      zalo: parsed.data.zalo,
    },
    openingHours: parsed.data.openingHours,
  }, {
    name: parsed.data.name,
    tagline: parsed.data.tagline,
    phone: parsed.data.phone,
    email: parsed.data.email,
    address: parsed.data.address,
    mapEmbedUrl: parsed.data.mapEmbedUrl,
    facebook: parsed.data.facebook,
    instagram: parsed.data.instagram,
    zalo: parsed.data.zalo,
    openingHours: JSON.stringify(parsed.data.openingHours),
  });
}

export async function saveHomepageSettings(
  _previousState: SaveSettingsState,
  formData: FormData,
): Promise<SaveSettingsState> {
  await requirePermission("content.edit");
  const parsed = homepageSchema.safeParse({
    heroTitle: formData.get("heroTitle"),
    heroTagline: formData.get("heroTagline"),
    heroImageUrl: formData.get("heroImageUrl"),
    storyTitle: formData.get("storyTitle"),
    storyContent: formData.get("storyContent"),
    storyImageUrl: formData.get("storyImageUrl"),
  });
  if (!parsed.success) return validationState(parsed.error);
  return updateSettingsData(parsed.data);
}

export async function saveSeoSettings(
  _previousState: SaveSettingsState,
  formData: FormData,
): Promise<SaveSettingsState> {
  await requirePermission("settings.edit");
  const parsed = seoSchema.safeParse({
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
  });
  if (!parsed.success) return validationState(parsed.error);
  return updateSettingsData({
    seo: { title: parsed.data.seoTitle, description: parsed.data.seoDescription },
  });
}

function storagePathFromPublicUrl(value: string) {
  try {
    const url = new URL(value);
    const marker = "/storage/v1/object/public/site-images/";
    const index = url.pathname.indexOf(marker);
    return index >= 0 ? decodeURIComponent(url.pathname.slice(index + marker.length)) : null;
  } catch {
    return null;
  }
}

function getImageType(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { extension: "png", contentType: "image/png" };
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return { extension: "webp", contentType: "image/webp" };
  }
  return null;
}

export async function uploadSiteImage(formData: FormData) {
  await requirePermission("content.edit");
  const file = formData.get("file");
  const oldImageUrl = String(formData.get("oldImageUrl") ?? "");
  if (!(file instanceof File)) return { success: false, message: "Vui lòng chọn một ảnh hợp lệ." };
  if (file.size > 3 * 1024 * 1024) return { success: false, message: "Ảnh không được vượt quá 3MB." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const imageType = getImageType(bytes);
  if (!imageType) return { success: false, message: "Chỉ chấp nhận ảnh JPG, PNG hoặc WebP hợp lệ." };

  const path = `${crypto.randomUUID()}.${imageType.extension}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from("site-images")
    .upload(path, bytes, {
      contentType: imageType.contentType,
      upsert: false,
    });
  if (uploadError) return { success: false, message: uploadError.message };

  const publicUrl = supabaseAdmin.storage.from("site-images").getPublicUrl(path).data.publicUrl;
  const oldPath = storagePathFromPublicUrl(oldImageUrl);
  if (oldPath) {
    const { error: deleteError } = await supabaseAdmin.storage.from("site-images").remove([oldPath]);
    if (deleteError) {
      await supabaseAdmin.storage.from("site-images").remove([path]);
      return { success: false, message: deleteError.message };
    }
  }

  return { success: true, url: publicUrl };
}

export async function savePromotion(formData: FormData) {
  await requirePermission("promotions.edit");
  const parsed = promotionSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    title: formData.get("title"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    startsOn: formData.get("startsOn"),
    endsOn: formData.get("endsOn"),
    active: formData.get("active"),
  });
  if (!parsed.success) return validationState(parsed.error);
  if (new Date(parsed.data.endsOn) < new Date(parsed.data.startsOn)) {
    return { success: false, message: "Ngày kết thúc phải sau ngày bắt đầu." };
  }

  const payload = {
    title: parsed.data.title,
    description: parsed.data.description,
    image_url: parsed.data.imageUrl,
    starts_on: new Date(parsed.data.startsOn).toISOString(),
    ends_on: new Date(parsed.data.endsOn).toISOString(),
    active: parsed.data.active,
  };
  const query = parsed.data.id
    ? supabaseAdmin.from("promotions").update(payload).eq("id", parsed.data.id)
    : supabaseAdmin.from("promotions").insert({ ...payload, sort_order: 0 });
  const { error } = await query;
  if (error) return { success: false, message: error.message };
  revalidatePath("/");
  updateTag("promotions");
  return { success: true, message: "Đã lưu ưu đãi" };
}

export async function deletePromotion(id: string, imageUrl?: string) {
  await requirePermission("promotions.edit");
  if (!id) return { success: false, message: "Ưu đãi không hợp lệ." };
  const { error } = await supabaseAdmin.from("promotions").delete().eq("id", id);
  if (error) return { success: false, message: error.message };
  const oldPath = imageUrl ? storagePathFromPublicUrl(imageUrl) : null;
  if (oldPath) await supabaseAdmin.storage.from("site-images").remove([oldPath]);
  revalidatePath("/");
  updateTag("promotions");
  return { success: true, message: "Đã xóa ưu đãi" };
}

export async function togglePromotion(id: string, active: boolean) {
  await requirePermission("promotions.edit");
  const { error } = await supabaseAdmin
    .from("promotions")
    .update({ active })
    .eq("id", id);
  if (error) return { success: false, message: error.message };
  revalidatePath("/");
  updateTag("promotions");
  return { success: true };
}

export async function movePromotion(id: string, direction: "up" | "down") {
  await requirePermission("promotions.edit");
  const { data, error } = await supabaseAdmin
    .from("promotions")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });
  if (error) return { success: false, message: error.message };

  const index = (data ?? []).findIndex((item) => String(item.id) === id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= (data ?? []).length) {
    return { success: true };
  }

  const current = data![index];
  const target = data![targetIndex];
  const { error: updateError } = await supabaseAdmin
    .from("promotions")
    .update({ sort_order: target.sort_order })
    .eq("id", current.id);
  if (updateError) return { success: false, message: updateError.message };
  const { error: swapError } = await supabaseAdmin
    .from("promotions")
    .update({ sort_order: current.sort_order })
    .eq("id", target.id);
  if (swapError) return { success: false, message: swapError.message };
  revalidatePath("/");
  updateTag("promotions");
  return { success: true };
}

export async function saveTestimonial(formData: FormData) {
  await requirePermission("content.edit");
  const parsed = testimonialSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    name: formData.get("name"),
    quote: formData.get("quote"),
    stars: formData.get("stars"),
    source: formData.get("source"),
    active: formData.get("active"),
  });
  if (!parsed.success) return validationState(parsed.error);
  const payload = { name: parsed.data.name, quote: parsed.data.quote, stars: parsed.data.stars, source: parsed.data.source, active: parsed.data.active };
  const query = parsed.data.id
    ? supabaseAdmin.from("testimonials").update(payload).eq("id", parsed.data.id)
    : supabaseAdmin.from("testimonials").insert({ ...payload, sort_order: 0 }).select("id").single();
  const { data, error } = await query;
  if (error) return { success: false, message: error.message };
  revalidatePath("/");
  return { success: true, message: "Đã lưu đánh giá", id: String(data?.id ?? parsed.data.id) };
}

export async function deleteTestimonial(id: string) {
  await requirePermission("content.edit");
  const { error } = await supabaseAdmin.from("testimonials").delete().eq("id", id);
  if (error) return { success: false, message: error.message };
  revalidatePath("/");
  return { success: true, message: "Đã xóa đánh giá" };
}

export async function toggleTestimonial(id: string, active: boolean) {
  await requirePermission("content.edit");
  const { error } = await supabaseAdmin.from("testimonials").update({ active }).eq("id", id);
  if (error) return { success: false, message: error.message };
  revalidatePath("/");
  return { success: true };
}

export async function moveTestimonial(id: string, direction: "up" | "down") {
  await requirePermission("content.edit");
  const { data, error } = await supabaseAdmin.from("testimonials").select("id, sort_order").order("sort_order", { ascending: true });
  if (error) return { success: false, message: error.message };
  const index = (data ?? []).findIndex((item) => String(item.id) === id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= (data ?? []).length) return { success: true };
  const current = data![index];
  const target = data![targetIndex];
  const { error: currentError } = await supabaseAdmin.from("testimonials").update({ sort_order: target.sort_order }).eq("id", current.id);
  if (currentError) return { success: false, message: currentError.message };
  const { error: targetError } = await supabaseAdmin.from("testimonials").update({ sort_order: current.sort_order }).eq("id", target.id);
  if (targetError) return { success: false, message: targetError.message };
  revalidatePath("/");
  return { success: true };
}
