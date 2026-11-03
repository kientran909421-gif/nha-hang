import { cacheLife, cacheTag, unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  defaultPromotions,
  defaultTestimonials,
  site as defaultSite,
} from "@/data/site";
import { menuItems as defaultMenuItems } from "@/data/menu";
import type { MenuCategory, MenuItem, MenuTag } from "@/data/menu";

export type SiteSettings = {
  name: string;
  address: string;
  phone: string;
  email: string;
  phoneHref: string;
  openingHours: string;
  openingHoursSchedule: ReadonlyArray<{ day: string; hours: string }>;
  copyrightYear: string;
  heroTitle: string;
  heroTagline: string;
  heroImageUrl: string;
  storyTitle: string;
  storyContent: string;
  storyImageUrl: string;
  mapEmbedUrl: string;
  seo: {
    title: string;
    description: string;
  };
  socialLinks: {
    facebook: string;
    instagram: string;
    zalo: string;
  };
};

export type Promotion = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  startsOn?: string | null;
  endsOn?: string | null;
  active?: boolean;
  sortOrder?: number;
};

export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  stars: number;
  source?: string;
  active?: boolean;
  sortOrder?: number;
};

export type AdminMenuCategory = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  sortOrder: number;
};

const menuCategories = new Set<MenuCategory>([
  "Khai vị",
  "Món chính",
  "Tráng miệng",
  "Đồ uống",
]);
const menuTags = new Set<MenuTag>(["chay", "cay", "ban-chay"]);

function isMenuCategory(value: unknown): value is MenuCategory {
  return typeof value === "string" && value.trim().length > 0;
}

function isMenuTag(value: unknown): value is MenuTag {
  return typeof value === "string" && menuTags.has(value as MenuTag);
}

export async function getMenu(): Promise<MenuItem[]> {
  "use cache";

  cacheTag("menu");

  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .select(
      "id, name, description, price, image_url, tags, allergens, available, sort_order, category:menu_categories!inner(name, slug, active)",
    )
    .eq("menu_categories.active", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error("Không thể đọc menu từ Supabase:", error.message);
    return [...defaultMenuItems];
  }

  return ((data ?? []) as Array<Record<string, unknown>>)
    .map((row): MenuItem | null => {
      const category = row.category as Record<string, unknown> | null;
      const categoryName = category?.name;
      if (!isMenuCategory(categoryName)) {
        return null;
      }

      const tags = Array.isArray(row.tags)
        ? row.tags.filter(isMenuTag)
        : [];
      const allergens = Array.isArray(row.allergens)
        ? row.allergens.filter((value): value is string => typeof value === "string")
        : [];

      return {
        id: String(row.id),
        name: String(row.name ?? ""),
        shortDescription: String(row.short_description ?? row.description ?? ""),
        description: String(row.description ?? ""),
        price: Number(row.price ?? 0),
        category: categoryName,
        image: String(row.image_url ?? ""),
        tags,
        allergens,
        available: row.available !== false,
      };
    })
    .filter((item): item is MenuItem => item !== null);
}

export async function getAdminMenu(): Promise<MenuItem[]> {
  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .select(
      "id, name, description, price, image_url, tags, allergens, available, sort_order, category:menu_categories!inner(name, slug, active)",
    )
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error("Không thể đọc menu quản trị từ Supabase:", error.message);
    throw new Error(`Không thể đọc thực đơn: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>)
    .map((row): MenuItem | null => {
      const category = row.category as Record<string, unknown> | null;
      const categoryName = category?.name;
      if (!isMenuCategory(categoryName)) {
        return null;
      }

      return {
        id: String(row.id),
        name: String(row.name ?? ""),
        shortDescription: String(row.description ?? ""),
        description: String(row.description ?? ""),
        price: Number(row.price ?? 0),
        category: categoryName,
        image: String(row.image_url ?? ""),
        tags: Array.isArray(row.tags) ? row.tags.filter(isMenuTag) : [],
        allergens: Array.isArray(row.allergens)
          ? row.allergens.filter(
              (value): value is string => typeof value === "string",
            )
          : [],
        available: row.available !== false,
      };
    })
    .filter((item): item is MenuItem => item !== null);
}

export async function getAdminMenuCategories(): Promise<AdminMenuCategory[]> {
  const { data, error } = await supabaseAdmin
    .from("menu_categories")
    .select("id, name, slug, active, sort_order")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error("Không thể đọc danh mục menu quản trị:", error.message);
    throw new Error(`Không thể đọc danh mục thực đơn: ${error.message}`);
  }

  return (data ?? []).map((category) => ({
    id: String(category.id),
    name: String(category.name),
    slug: String(category.slug),
    active: category.active === true,
    sortOrder: Number(category.sort_order ?? 0),
  }));
}

type SiteSettingsRow = Partial<{
  data: Record<string, unknown>;
  name: string;
  address: string;
  phone: string;
  email: string;
  phone_href: string;
  opening_hours: string;
  openingHours: Array<{ day?: string; days?: string; hours?: string }>;
  opening_hours_schedule: Array<{ day?: string; days?: string; hours?: string }>;
  tagline: string;
  mapEmbedUrl: string;
  copyright_year: string | number;
  hero_title: string;
  hero_tagline: string;
  hero_image_url: string;
  story_title: string;
  story_content: string;
  story_image_url: string;
  map_embed_url: string;
  social_links: { facebook?: string; instagram?: string; zalo?: string };
  socialLinks: { facebook?: string; instagram?: string; zalo?: string };
  seo: { title?: string; description?: string };
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeSettings(input: unknown): SiteSettings {
  const row = isRecord(input) ? input : {};
  const nested = isRecord(row.data) ? row.data : {};
  const settings = { ...row, ...nested };
  const hero = isRecord(settings.hero) ? settings.hero : {};
  const story = isRecord(settings.story) ? settings.story : {};
  const seo = isRecord(settings.seo) ? settings.seo : {};
  const social = isRecord(settings.socialLinks)
    ? settings.socialLinks
    : isRecord(settings.social)
      ? settings.social
      : isRecord(settings.social_links)
        ? settings.social_links
        : {};
  const rawHours = Array.isArray(settings.openingHours)
    ? settings.openingHours
    : Array.isArray(settings.opening_hours_schedule)
      ? settings.opening_hours_schedule
      : [];
  const openingHoursSchedule = rawHours.map((row) => {
    const value = isRecord(row) ? row : {};
    return {
      day: String(value.day ?? value.days ?? ""),
      hours: String(value.hours ?? ""),
    };
  });
  const openingHours =
    typeof settings.opening_hours === "string"
      ? settings.opening_hours
      : openingHoursSchedule.length > 0
        ? openingHoursSchedule.map((row) => `${row.day}: ${row.hours}`).join(" · ")
        : defaultSite.openingHours;

  return {
    ...defaultSite,
    name: String(settings.name ?? defaultSite.name),
    address: String(settings.address ?? defaultSite.address),
    phone: String(settings.phone ?? defaultSite.phone),
    email: String(settings.email ?? defaultSite.email),
    phoneHref: String(settings.phone_href ?? settings.phoneHref ?? defaultSite.phoneHref),
    openingHours,
    openingHoursSchedule:
      openingHoursSchedule.length > 0
        ? openingHoursSchedule
        : defaultSite.openingHoursSchedule,
    copyrightYear: String(settings.copyright_year ?? settings.copyrightYear ?? defaultSite.copyrightYear),
    heroTitle: String(hero.title ?? settings.hero_title ?? settings.heroTitle ?? defaultSite.heroTitle),
    heroTagline: String(hero.tagline ?? settings.hero_tagline ?? settings.tagline ?? settings.heroTagline ?? defaultSite.heroTagline),
    heroImageUrl: String(hero.imageUrl ?? hero.image_url ?? settings.hero_image_url ?? settings.heroImageUrl ?? defaultSite.heroImageUrl),
    storyTitle: String(story.title ?? settings.story_title ?? settings.storyTitle ?? defaultSite.storyTitle),
    storyContent: String(story.content ?? settings.story_content ?? settings.storyContent ?? defaultSite.storyContent),
    storyImageUrl: String(story.imageUrl ?? story.image_url ?? settings.story_image_url ?? settings.storyImageUrl ?? defaultSite.storyImageUrl),
    mapEmbedUrl: String(settings.map_embed_url ?? settings.mapEmbedUrl ?? defaultSite.mapEmbedUrl),
    socialLinks: {
      facebook: String(social.facebook ?? defaultSite.socialLinks.facebook),
      instagram: String(social.instagram ?? defaultSite.socialLinks.instagram),
      zalo: String(social.zalo ?? defaultSite.socialLinks.zalo),
    },
    seo: {
      title: String(seo.title ?? defaultSite.seo.title),
      description: String(seo.description ?? defaultSite.seo.description),
    },
  };
}

const siteSettingsCache = unstable_cache(
  async (): Promise<SiteSettings> => {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle<SiteSettingsRow>();

    if (error) {
      console.error("Không thể đọc site settings từ Supabase:", error.message);
      return defaultSite;
    }

    if (!data) {
      return defaultSite;
    }

    return normalizeSettings(data);
  },
  ["site-settings"],
  { revalidate: 60, tags: ["site-settings"] },
);

async function getCachedPromotions(): Promise<Promotion[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("promotions");

  const now = new Date();
  const vietnamNow = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(now);
  const currentTime = new Date(`${vietnamNow.replace(" ", "T")}+07:00`).getTime();
  const { data, error } = await supabaseAdmin
    .from("promotions")
    .select("*");

  if (error) {
    console.error("Không thể đọc promotions từ Supabase:", error.message);
    return [];
  }

  return (data ?? [])
    .filter((promotion) => {
      const startsOn = promotion.starts_on
        ? new Date(String(promotion.starts_on)).getTime()
        : Number.NEGATIVE_INFINITY;
      const endsOn = promotion.ends_on
        ? new Date(String(promotion.ends_on)).getTime()
        : Number.POSITIVE_INFINITY;
      return (
        promotion.active === true &&
        startsOn <= currentTime &&
        endsOn >= currentTime
      );
    })
    .sort(
      (a, b) =>
        new Date(String(b.starts_on ?? 0)).getTime() -
        new Date(String(a.starts_on ?? 0)).getTime(),
    )
    .map((promotion) => ({
      id: String(promotion.id),
      title: String(promotion.title),
      description: String(promotion.description ?? ""),
      imageUrl: String(promotion.image_url ?? promotion.image),
    }));
}

const testimonialsCache = unstable_cache(
  async (): Promise<Testimonial[]> => {
    const { data, error } = await supabaseAdmin
      .from("testimonials")
      .select("*");

    if (error) {
      console.error("Không thể đọc testimonials từ Supabase:", error.message);
      return [];
    }

    return (data ?? [])
      .filter((testimonial) => testimonial.active !== false)
      .sort(
        (a, b) =>
          new Date(String(b.created_at ?? 0)).getTime() -
          new Date(String(a.created_at ?? 0)).getTime(),
      )
      .map((testimonial) => ({
        id: String(testimonial.id),
        quote: String(
          testimonial.quote ??
            testimonial.content ??
            testimonial.message ??
            "",
        ),
        name: String(
          testimonial.name ??
            testimonial.customer_name ??
            testimonial.author_name ??
            "Khách hàng",
        ),
        stars: Number(testimonial.stars ?? testimonial.rating ?? 5),
      }))
      .filter((testimonial) => testimonial.quote.length > 0);
  },
  ["testimonials"],
  { revalidate: 60, tags: ["testimonials"] },
);

export async function getSiteSettings() {
  return siteSettingsCache();
}

export async function getPromotions() {
  const promotions = await getCachedPromotions();
  return promotions.length > 0 ? promotions : [...defaultPromotions];
}

export async function getAdminPromotions(): Promise<Promotion[]> {
  const { data, error } = await supabaseAdmin
    .from("promotions")
    .select("id, title, description, image_url, starts_on, ends_on, active, sort_order")
    .order("sort_order", { ascending: true })
    .order("starts_on", { ascending: false });

  if (error) {
    console.error("Không thể đọc promotions quản trị:", error.message);
    return [];
  }

  return (data ?? []).map((promotion) => ({
    id: String(promotion.id),
    title: String(promotion.title),
    description: String(promotion.description ?? ""),
    imageUrl: String(promotion.image_url ?? ""),
    startsOn: promotion.starts_on ? String(promotion.starts_on) : null,
    endsOn: promotion.ends_on ? String(promotion.ends_on) : null,
    active: Boolean(promotion.active),
    sortOrder: Number(promotion.sort_order ?? 0),
  }));
}

export async function getAdminTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Không thể đọc testimonials quản trị:", error.message);
    return [];
  }

  return (data ?? []).map((testimonial) => ({
    id: String(testimonial.id),
    quote: String(testimonial.quote ?? testimonial.content ?? testimonial.message ?? ""),
    name: String(testimonial.name ?? testimonial.customer_name ?? testimonial.author_name ?? ""),
    stars: Number(testimonial.stars ?? testimonial.rating ?? 5),
    source: String(testimonial.source ?? "Khác"),
    active: testimonial.active !== false,
    sortOrder: Number(testimonial.sort_order ?? 0),
  }));
}

export async function getTestimonials() {
  const testimonials = await testimonialsCache();
  return testimonials.length > 0 ? testimonials : [...defaultTestimonials];
}
