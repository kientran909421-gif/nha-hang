"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export type UpdateMenuAvailabilityState = {
  success: boolean;
  message: string;
};

export type UploadMenuImageState = {
  success: boolean;
  message: string;
  url?: string;
};

export type MenuFormValues = {
  id?: string;
  name: string;
  description: string;
  price: string;
  categorySlug: string;
  tags: string[];
  allergens: string;
  available: boolean;
  imageUrl?: string;
};

export type MenuFormState = {
  success: boolean;
  message: string;
  imagePersisted?: boolean;
  errors?: Record<string, string>;
  item?: {
    id: string;
    name: string;
    shortDescription: string;
    description: string;
    price: number;
    category: "Khai vị" | "Món chính" | "Tráng miệng" | "Đồ uống";
    image: string;
    tags: ("chay" | "cay" | "ban-chay")[];
    allergens: string[];
    available: boolean;
  };
};

export type MenuCategoryActionState = {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
};

const menuFormSchema = z.object({
  id: z.string().trim().optional(),
  name: z.string().trim().min(1, "Vui lòng nhập tên món."),
  description: z.string().trim(),
  price: z.string().trim().regex(/^\d+$/, "Giá phải là số nguyên không âm."),
  categorySlug: z.string().trim().min(1, "Vui lòng chọn danh mục."),
  tags: z.array(z.enum(["chay", "cay", "ban-chay"])),
  allergens: z.string(),
  available: z.boolean(),
  imageUrl: z.string().optional(),
});

function validationErrors(error: z.ZodError) {
  return Object.fromEntries(
    error.issues.map((issue) => [
      String(issue.path[0] ?? "form"),
      issue.message,
    ]),
  );
}

function revalidateMenu() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/thuc-don");
  revalidateTag("menu", "max");
}

function slugifyCategory(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueCategorySlug(name: string, id?: string) {
  const baseSlug = slugifyCategory(name);
  if (!baseSlug) return null;

  const { data, error } = await supabaseAdmin
    .from("menu_categories")
    .select("id, slug")
    .ilike("slug", `${baseSlug}%`);
  if (error) return { error };

  const used = new Set(
    (data ?? [])
      .filter((category) => String(category.id) !== id)
      .map((category) => String(category.slug)),
  );
  let slug = baseSlug;
  let suffix = 2;
  while (used.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return { slug };
}

function menuStoragePathFromPublicUrl(value: string) {
  try {
    const url = new URL(value);
    const marker = "/storage/v1/object/public/menu-images/";
    const index = url.pathname.indexOf(marker);
    return index >= 0
      ? decodeURIComponent(url.pathname.slice(index + marker.length))
      : null;
  } catch {
    return null;
  }
}

function menuImageType(bytes: Uint8Array) {
  if (
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { extension: "png", contentType: "image/png" };
  }
  if (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return { extension: "webp", contentType: "image/webp" };
  }
  return null;
}

export async function uploadMenuImage(
  formData: FormData,
): Promise<UploadMenuImageState> {
  await requireAdmin();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { success: false, message: "Vui lòng chọn một ảnh hợp lệ." };
  }
  if (file.size > 3 * 1024 * 1024) {
    return { success: false, message: "Ảnh không được vượt quá 3MB." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const imageType = menuImageType(bytes);
  if (!imageType) {
    return {
      success: false,
      message: "Chỉ chấp nhận ảnh JPG, PNG hoặc WebP hợp lệ.",
    };
  }

  const path = `${crypto.randomUUID()}.${imageType.extension}`;
  const { error } = await supabaseAdmin.storage
    .from("menu-images")
    .upload(path, bytes, {
      contentType: imageType.contentType,
      upsert: false,
    });

  if (error) {
    console.error("Không thể tải ảnh món lên:", error.message);
    return {
      success: false,
      message: `Không thể tải ảnh lên: ${error.message}`,
    };
  }

  return {
    success: true,
    message: "Đã tải ảnh lên.",
    url: supabaseAdmin.storage.from("menu-images").getPublicUrl(path).data
      .publicUrl,
  };
}

export async function deleteUploadedMenuImage(
  imageUrl: string,
): Promise<UpdateMenuAvailabilityState> {
  await requireAdmin();
  const path = menuStoragePathFromPublicUrl(imageUrl);
  if (!path) {
    return { success: false, message: "Ảnh tải lên không hợp lệ." };
  }

  const { error } = await supabaseAdmin.storage
    .from("menu-images")
    .remove([path]);
  if (error) {
    console.error("Không thể dọn ảnh tải lên:", error.message);
    return {
      success: false,
      message: `Không thể dọn ảnh tải lên: ${error.message}`,
    };
  }
  return { success: true, message: "Đã dọn ảnh tải lên." };
}

export async function updateMenuAvailability(
  itemId: string,
  available: boolean,
): Promise<UpdateMenuAvailabilityState> {
  await requireAdmin();

  if (!itemId.trim()) {
    return { success: false, message: "Mã món không hợp lệ." };
  }

  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .update({ available })
    .eq("id", itemId)
    .select("id");

  if (error) {
    console.error("Không thể cập nhật trạng thái món:", error.message);
    return {
      success: false,
      message: `Không thể cập nhật trạng thái món: ${error.message}`,
    };
  }

  if (data.length !== 1) {
    return {
      success: false,
      message: "Không tìm thấy món hoặc trạng thái chưa được cập nhật.",
    };
  }

  revalidateMenu();

  return {
    success: true,
    message: available ? "Đã đánh dấu món còn món." : "Đã đánh dấu món tạm hết.",
  };
}

export async function saveMenuItem(values: MenuFormValues): Promise<MenuFormState> {
  await requireAdmin();
  const parsed = menuFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      message: "Vui lòng kiểm tra lại thông tin món.",
      errors: validationErrors(parsed.error),
    };
  }

  const input = parsed.data;
  const price = Number(input.price);
  const allergens = input.allergens
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const { data: category, error: categoryError } = await supabaseAdmin
    .from("menu_categories")
    .select("id, name")
    .eq("slug", input.categorySlug)
    .eq("active", true)
    .maybeSingle();

  if (categoryError) {
    console.error("Không thể kiểm tra danh mục món:", categoryError.message);
    return { success: false, message: `Không thể kiểm tra danh mục: ${categoryError.message}` };
  }
  if (!category) {
    return {
      success: false,
      message: "Danh mục không tồn tại hoặc đang bị tắt.",
      errors: { categorySlug: "Vui lòng chọn danh mục đang hoạt động." },
    };
  }

  const payload = {
    name: input.name,
    description: input.description,
    price,
    category_id: category.id,
    tags: input.tags,
    allergens,
    available: input.available,
    image_url: input.imageUrl || "/images/mon-1.jpg",
  };

  if (input.id) {
    const { data: current, error: currentError } = await supabaseAdmin
      .from("menu_items")
      .select("image_url")
      .eq("id", input.id)
      .maybeSingle();

    if (currentError) {
      console.error("Không thể đọc ảnh món hiện tại:", currentError.message);
      return {
        success: false,
        message: `Không thể đọc ảnh món hiện tại: ${currentError.message}`,
      };
    }

    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", input.id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Không thể cập nhật món:", error.message);
      return { success: false, message: `Không thể cập nhật món: ${error.message}` };
    }
    if (!data) {
      return { success: false, message: "Không tìm thấy món để cập nhật." };
    }

    const oldPath = menuStoragePathFromPublicUrl(
      String(current?.image_url ?? ""),
    );
    const newPath = menuStoragePathFromPublicUrl(input.imageUrl ?? "");
    if (oldPath && oldPath !== newPath) {
      const { error: deleteError } = await supabaseAdmin.storage
        .from("menu-images")
        .remove([oldPath]);
      if (deleteError) {
        console.error("Không thể xóa ảnh món cũ:", deleteError.message);
        return {
          success: false,
          message: `Đã lưu món nhưng không thể xóa ảnh cũ: ${deleteError.message}`,
          imagePersisted: true,
        };
      }
    }
  } else {
    const { data: lastItem, error: orderError } = await supabaseAdmin
      .from("menu_items")
      .select("sort_order")
      .eq("category_id", category.id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderError) {
      console.error("Không thể lấy thứ tự món:", orderError.message);
      return { success: false, message: `Không thể tạo món: ${orderError.message}` };
    }

    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .insert({ ...payload, sort_order: Number(lastItem?.sort_order ?? 0) + 1 })
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Không thể thêm món:", error.message);
      return { success: false, message: `Không thể thêm món: ${error.message}` };
    }
    if (!data) {
      return { success: false, message: "Không thể xác nhận món đã được thêm." };
    }
  }

  revalidateMenu();
  return {
    success: true,
    message: input.id ? "Đã cập nhật món." : "Đã thêm món.",
    imagePersisted: true,
  };
}

export async function reorderMenuItem(
  itemId: string,
  direction: "up" | "down",
): Promise<UpdateMenuAvailabilityState> {
  await requireAdmin();
  if (!itemId.trim()) return { success: false, message: "Mã món không hợp lệ." };

  const { data: current, error: currentError } = await supabaseAdmin
    .from("menu_items")
    .select("id, category_id, sort_order")
    .eq("id", itemId)
    .maybeSingle();
  if (currentError) return { success: false, message: `Không thể đọc thứ tự món: ${currentError.message}` };
  if (!current) return { success: false, message: "Không tìm thấy món." };

  let neighborQuery = supabaseAdmin
    .from("menu_items")
    .select("id, sort_order")
    .eq("category_id", current.category_id);
  const { data: neighbor, error: neighborError } = await (direction === "up"
    ? neighborQuery.lt("sort_order", current.sort_order).order("sort_order", { ascending: false })
    : neighborQuery.gt("sort_order", current.sort_order).order("sort_order", { ascending: true })
  ).limit(1).maybeSingle();
  if (neighborError) return { success: false, message: `Không thể tìm món kế bên: ${neighborError.message}` };
  if (!neighbor) {
    return {
      success: false,
      message: direction === "up" ? "Món đã ở đầu danh mục." : "Món đã ở cuối danh mục.",
    };
  }

  const { error: firstError } = await supabaseAdmin
    .from("menu_items")
    .update({ sort_order: neighbor.sort_order })
    .eq("id", current.id);
  if (firstError) return { success: false, message: `Không thể đổi thứ tự món: ${firstError.message}` };
  const { error: secondError } = await supabaseAdmin
    .from("menu_items")
    .update({ sort_order: current.sort_order })
    .eq("id", neighbor.id);
  if (secondError) return { success: false, message: `Đã đổi một phần thứ tự món: ${secondError.message}` };
  revalidateMenu();
  return { success: true, message: "Đã cập nhật thứ tự món." };
}

const categorySchema = z.object({
  id: z.string().trim().optional(),
  name: z.string().trim().min(1, "Vui lòng nhập tên danh mục."),
  active: z.boolean(),
});

export async function saveMenuCategory(
  values: { id?: string; name: string; active: boolean },
): Promise<MenuCategoryActionState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "Vui lòng kiểm tra lại danh mục.", errors: validationErrors(parsed.error) };
  }
  const slugResult = await uniqueCategorySlug(parsed.data.name, parsed.data.id);
  if (!slugResult) {
    return { success: false, message: "Tên danh mục không tạo được slug hợp lệ.", errors: { name: "Tên danh mục phải có ký tự chữ hoặc số." } };
  }
  if ("error" in slugResult) {
    return {
      success: false,
      message: `Không thể kiểm tra slug danh mục: ${slugResult.error?.message ?? "Lỗi không xác định."}`,
    };
  }

  if (parsed.data.id) {
    const { data, error } = await supabaseAdmin
      .from("menu_categories")
      .update({ name: parsed.data.name, slug: slugResult.slug, active: parsed.data.active })
      .eq("id", parsed.data.id)
      .select("id");
    if (error) return { success: false, message: `Không thể sửa danh mục: ${error.message}` };
    if (data.length !== 1) return { success: false, message: "Không tìm thấy danh mục để sửa." };
  } else {
    const { data: last, error: orderError } = await supabaseAdmin
      .from("menu_categories")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (orderError) return { success: false, message: `Không thể tạo danh mục: ${orderError.message}` };
    const { data, error } = await supabaseAdmin
      .from("menu_categories")
      .insert({ name: parsed.data.name, slug: slugResult.slug, active: parsed.data.active, sort_order: Number(last?.sort_order ?? 0) + 1 })
      .select("id");
    if (error) return { success: false, message: `Không thể thêm danh mục: ${error.message}` };
    if (data.length !== 1) return { success: false, message: "Không thể xác nhận danh mục đã được thêm." };
  }
  revalidateMenu();
  return { success: true, message: parsed.data.id ? "Đã sửa danh mục." : "Đã thêm danh mục." };
}

export async function updateMenuCategoryActive(id: string, active: boolean): Promise<MenuCategoryActionState> {
  await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from("menu_categories")
    .update({ active })
    .eq("id", id)
    .select("id");
  if (error) return { success: false, message: `Không thể cập nhật danh mục: ${error.message}` };
  if (data.length !== 1) return { success: false, message: "Không tìm thấy danh mục." };
  revalidateMenu();
  return { success: true, message: active ? "Đã hiện danh mục." : "Đã ẩn danh mục." };
}

export async function reorderMenuCategory(id: string, direction: "up" | "down"): Promise<MenuCategoryActionState> {
  await requireAdmin();
  const { data: current, error } = await supabaseAdmin
    .from("menu_categories")
    .select("id, sort_order")
    .eq("id", id)
    .maybeSingle();
  if (error) return { success: false, message: `Không thể đọc thứ tự danh mục: ${error.message}` };
  if (!current) return { success: false, message: "Không tìm thấy danh mục." };

  let neighborQuery = supabaseAdmin.from("menu_categories").select("id, sort_order");
  const { data: neighbor, error: neighborError } = await (direction === "up"
    ? neighborQuery.lt("sort_order", current.sort_order).order("sort_order", { ascending: false })
    : neighborQuery.gt("sort_order", current.sort_order).order("sort_order", { ascending: true })
  ).limit(1).maybeSingle();
  if (neighborError) return { success: false, message: `Không thể tìm danh mục kế bên: ${neighborError.message}` };
  if (!neighbor) return { success: false, message: direction === "up" ? "Danh mục đã ở đầu danh sách." : "Danh mục đã ở cuối danh sách." };

  const { error: firstError } = await supabaseAdmin.from("menu_categories").update({ sort_order: neighbor.sort_order }).eq("id", current.id);
  if (firstError) return { success: false, message: `Không thể đổi thứ tự danh mục: ${firstError.message}` };
  const { error: secondError } = await supabaseAdmin.from("menu_categories").update({ sort_order: current.sort_order }).eq("id", neighbor.id);
  if (secondError) return { success: false, message: `Đã đổi một phần thứ tự danh mục: ${secondError.message}` };
  revalidateMenu();
  return { success: true, message: "Đã cập nhật thứ tự danh mục." };
}

export async function deleteMenuCategory(id: string): Promise<MenuCategoryActionState> {
  await requireAdmin();
  const { count, error: countError } = await supabaseAdmin
    .from("menu_items")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if (countError) return { success: false, message: `Không thể kiểm tra món trong danh mục: ${countError.message}` };
  if ((count ?? 0) > 0) {
    return { success: false, message: "Không thể xóa danh mục vì danh mục vẫn còn món. Hãy chuyển hoặc xóa các món trước." };
  }
  const { data, error } = await supabaseAdmin.from("menu_categories").delete().eq("id", id).select("id");
  if (error) return { success: false, message: `Không thể xóa danh mục: ${error.message}` };
  if (data.length !== 1) return { success: false, message: "Không tìm thấy danh mục để xóa." };
  revalidateMenu();
  return { success: true, message: "Đã xóa danh mục." };
}

export async function deleteMenuItem(itemId: string): Promise<UpdateMenuAvailabilityState> {
  await requireAdmin();
  if (!itemId.trim()) {
    return { success: false, message: "Mã món không hợp lệ." };
  }

  const { data: current, error: currentError } = await supabaseAdmin
    .from("menu_items")
    .select("image_url")
    .eq("id", itemId)
    .maybeSingle();
  if (currentError) {
    console.error("Không thể đọc ảnh món cần xóa:", currentError.message);
    return {
      success: false,
      message: `Không thể đọc ảnh món cần xóa: ${currentError.message}`,
    };
  }
  if (!current) {
    return { success: false, message: "Không tìm thấy món để xóa." };
  }

  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .delete()
    .eq("id", itemId)
    .select("id");

  if (error) {
    console.error("Không thể xóa món:", error.message);
    return { success: false, message: `Không thể xóa món: ${error.message}` };
  }
  if (data.length !== 1) {
    return { success: false, message: "Không tìm thấy món để xóa." };
  }

  const oldPath = menuStoragePathFromPublicUrl(
    String(current.image_url ?? ""),
  );
  if (oldPath) {
    const { error: deleteError } = await supabaseAdmin.storage
      .from("menu-images")
      .remove([oldPath]);
    if (deleteError) {
      console.error("Không thể xóa ảnh món:", deleteError.message);
      return {
        success: false,
        message: `Đã xóa món nhưng không thể xóa ảnh: ${deleteError.message}`,
      };
    }
  }

  revalidateMenu();
  return { success: true, message: "Đã xóa món." };
}
