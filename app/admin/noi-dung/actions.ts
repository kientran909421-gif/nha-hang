"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-audit";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ImageProcessingError, prepareServerImage } from "@/lib/image-server";

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

const signatureSchema = z.object({
  signatureCount: z.coerce.number().int().min(2, "Số món tối thiểu là 2.").max(12, "Số món tối đa là 12."),
});

const promotionSchema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập tiêu đề."),
  description: z.string().trim().min(1, "Vui lòng nhập mô tả."),
  imageUrl: z.string().trim().min(1, "Vui lòng tải ảnh ưu đãi."),
  startsOn: z.string().min(1, "Vui lòng chọn ngày bắt đầu."),
  endsOn: z.string().min(1, "Vui lòng chọn ngày kết thúc."),
  active: z.enum(["true", "false"]).transform((value) => value === "true"),
});
const promotionUpdateSchema = promotionSchema.extend({
  id: z.string().uuid("Mã ưu đãi không hợp lệ."),
});

const testimonialSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên khách."),
  quote: z.string().trim().min(1, "Vui lòng nhập nội dung."),
  stars: z.coerce.number().int().min(1).max(5),
  source: z.enum(["Google", "Facebook", "Khác"]),
  active: z.enum(["true", "false"]).transform((value) => value === "true"),
});
const testimonialUpdateSchema = testimonialSchema.extend({
  id: z.string().uuid("Mã đánh giá không hợp lệ."),
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

  if (updateError) {
    return { success: false, message: `Không thể lưu thông tin website: ${updateError.message}` };
  }
  if (updated?.length !== 1) {
    const { data: inserted, error: upsertError } = await supabaseAdmin
      .from("site_settings")
      .upsert({ id: 1, ...payload }, { onConflict: "id" })
      .select();

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
  updateTag("site-settings");
  updateTag("settings");
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

export async function saveSignatureSettings(
  _previousState: SaveSettingsState,
  formData: FormData,
) {
  const actor = await requirePermission("signature.manage");
  const parsed = signatureSchema.safeParse({
    signatureCount: formData.get("signatureCount"),
  });
  if (!parsed.success) return validationState(parsed.error);

  const { data: current, error } = await supabaseAdmin
    .from("site_settings")
    .select("data")
    .eq("id", 1)
    .maybeSingle<{ data: Record<string, unknown> | null }>();
  if (error) {
    return { success: false, message: `Không thể đọc cài đặt món signature: ${error.message}` };
  }

  const oldValue =
    typeof current?.data?.signatureCount === "number"
      ? current.data.signatureCount
      : 4;
  const result = await updateSettingsData({
    signatureCount: parsed.data.signatureCount,
  });
  if (!result.success) return result;

  const audit = await logAdminAction(actor, {
    action: "signature_count_change",
    area: "content",
    details: { oldValue, newValue: parsed.data.signatureCount },
  });
  if (audit.error) {
    return {
      ...result,
      message: `Đã lưu số món signature nhưng không ghi được nhật ký: ${audit.error.message}`,
    };
  }
  return { success: true, message: "Đã lưu số món signature." };
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

export async function uploadSiteImage(formData: FormData) {
  await requirePermission("content.edit");
  const file = formData.get("file");
  const imageKind = String(formData.get("imageKind") ?? "story");
  const browserPrepared = formData.get("browserPrepared") === "true";
  const oldImageUrl = String(formData.get("oldImageUrl") ?? "");
  if (!(file instanceof File)) return { success: false, message: "Vui lòng chọn một ảnh hợp lệ." };
  let bytes: Buffer;
  try {
    bytes = await prepareServerImage(file, imageKind, browserPrepared);
  } catch (error) {
    if (error instanceof ImageProcessingError) return { success: false, message: error.message };
    console.error("Không thể xử lý ảnh website:", error);
    return { success: false, message: "Không thể xử lý ảnh. Vui lòng thử lại." };
  }

  const path = `${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from("site-images")
    .upload(path, bytes, {
      contentType: "image/webp",
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

function promotionFields(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    startsOn: formData.get("startsOn"),
    endsOn: formData.get("endsOn"),
    active: formData.get("active"),
  };
}

function promotionPayload(input: z.infer<typeof promotionSchema>) {
  return {
    title: input.title,
    description: input.description,
    image_url: input.imageUrl,
    starts_on: new Date(input.startsOn).toISOString(),
    ends_on: new Date(input.endsOn).toISOString(),
    active: input.active,
  };
}

export async function createPromotion(formData: FormData) {
  await requirePermission("promotions.edit");
  const parsed = promotionSchema.safeParse(promotionFields(formData));
  if (!parsed.success) return validationState(parsed.error);
  if (new Date(parsed.data.endsOn) < new Date(parsed.data.startsOn)) {
    return { success: false, message: "Ngày kết thúc phải sau ngày bắt đầu." };
  }
  const { data, error } = await supabaseAdmin.from("promotions").insert({ ...promotionPayload(parsed.data), sort_order: 0 }).select("id");
  if (error) return { success: false, message: error.message };
  if (data.length !== 1) return { success: false, message: "Không thể xác nhận ưu đãi đã được thêm." };
  revalidatePath("/");
  revalidatePath("/admin/noi-dung");
  updateTag("promotions");
  return { success: true, message: "Đã lưu ưu đãi" };
}

export async function updatePromotion(formData: FormData) {
  await requirePermission("promotions.edit");
  const parsed = promotionUpdateSchema.safeParse({
    ...promotionFields(formData),
    id: formData.get("id"),
  });
  if (!parsed.success) return validationState(parsed.error);
  if (new Date(parsed.data.endsOn) < new Date(parsed.data.startsOn)) {
    return { success: false, message: "Ngày kết thúc phải sau ngày bắt đầu." };
  }
  const { data, error } = await supabaseAdmin
    .from("promotions")
    .update(promotionPayload(parsed.data))
    .eq("id", parsed.data.id)
    .select("id");
  if (error) return { success: false, message: error.message };
  if (data.length !== 1) return { success: false, message: "Không tìm thấy ưu đãi cần sửa." };
  revalidatePath("/");
  revalidatePath("/admin/noi-dung");
  updateTag("promotions");
  return { success: true, message: "Đã sửa ưu đãi" };
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

function testimonialFields(formData: FormData) {
  return {
    name: formData.get("name"),
    quote: formData.get("quote"),
    stars: formData.get("stars"),
    source: formData.get("source"),
    active: formData.get("active"),
  };
}

export async function createTestimonial(formData: FormData) {
  await requirePermission("content.edit");
  const parsed = testimonialSchema.safeParse(testimonialFields(formData));
  if (!parsed.success) return validationState(parsed.error);
  const payload = { name: parsed.data.name, quote: parsed.data.quote, stars: parsed.data.stars, source: parsed.data.source, active: parsed.data.active };
  const { data, error } = await supabaseAdmin.from("testimonials").insert({ ...payload, sort_order: 0 }).select("id");
  if (error) return { success: false, message: error.message };
  if (data.length !== 1) return { success: false, message: "Không thể xác nhận đánh giá đã được thêm." };
  revalidatePath("/");
  revalidatePath("/admin/noi-dung");
  return { success: true, message: "Đã thêm đánh giá", id: String(data[0].id) };
}

export async function updateTestimonial(formData: FormData) {
  await requirePermission("content.edit");
  const parsed = testimonialUpdateSchema.safeParse({
    ...testimonialFields(formData),
    id: formData.get("id"),
  });
  if (!parsed.success) return validationState(parsed.error);
  const payload = { name: parsed.data.name, quote: parsed.data.quote, stars: parsed.data.stars, source: parsed.data.source, active: parsed.data.active };
  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .update(payload)
    .eq("id", parsed.data.id)
    .select("id");
  if (error) return { success: false, message: error.message };
  if (data.length !== 1) return { success: false, message: "Không tìm thấy đánh giá cần sửa." };
  revalidatePath("/");
  revalidatePath("/admin/noi-dung");
  return { success: true, message: "Đã sửa đánh giá", id: parsed.data.id };
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
