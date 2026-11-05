"use client";

import Link from "next/link";
import Image from "next/image";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SiteSettings } from "@/lib/content";
import type { Promotion } from "@/lib/content";
import { AdminPromotions } from "@/components/admin-promotions";
import { AdminTestimonials } from "@/components/admin-testimonials";
import { prepareImage } from "@/lib/image-client";
import {
  saveSiteSettings,
  saveHomepageSettings,
  saveSeoSettings,
  saveSignatureSettings,
  uploadSiteImage,
  type SaveSettingsState,
} from "@/app/admin/noi-dung/actions";

type OpeningHour = { day: string; hours: string };

const initialState: SaveSettingsState = { success: false };

export function AdminContentForm({
  site,
  promotions,
  testimonials,
  canManageSignature,
  signatureEligibleCount,
}: {
  site: SiteSettings;
  promotions: Promotion[];
  testimonials: import("@/lib/content").Testimonial[];
  canManageSignature: boolean;
  signatureEligibleCount: number;
}) {
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>(
    site.openingHoursSchedule.length > 0
      ? [...site.openingHoursSchedule]
      : [{ day: "Thứ 2 - Chủ nhật", hours: site.openingHours }],
  );
  const [state, formAction, pending] = useActionState(
    saveSiteSettings,
    initialState,
  );
  const [homepageState, homepageAction, homepagePending] = useActionState(
    saveHomepageSettings,
    initialState,
  );
  const [seoState, seoAction, seoPending] = useActionState(
    saveSeoSettings,
    initialState,
  );
  const [heroImage, setHeroImage] = useState(site.heroImageUrl);
  const [storyImage, setStoryImage] = useState(site.storyImageUrl);
  const [uploading, setUploading] = useState<"hero" | "story" | null>(null);
  const [homepageImagesUnsaved, setHomepageImagesUnsaved] = useState(false);
  const [seoTitle, setSeoTitle] = useState(site.seo.title);
  const [seoDescription, setSeoDescription] = useState(site.seo.description);
  const [signatureCount, setSignatureCount] = useState(String(site.signatureCount));
  const [signatureState, signatureAction, signaturePending] = useActionState(
    saveSignatureSettings,
    initialState,
  );
  const [isDirty, setIsDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      if (state.savedValues && formRef.current) {
        for (const [name, value] of Object.entries(state.savedValues)) {
          const field = formRef.current.elements.namedItem(name);
          if (field instanceof HTMLInputElement) field.value = value;
        }
        if (state.savedValues.openingHours) {
          const savedOpeningHours = JSON.parse(state.savedValues.openingHours) as OpeningHour[];
          window.setTimeout(() => setOpeningHours(savedOpeningHours), 0);
        }
      }
      const resetDirtyState = window.setTimeout(() => setIsDirty(false), 0);
      toast.success(state.message ?? "Đã lưu");
      return () => window.clearTimeout(resetDirtyState);
    } else if (state.message) {
      toast.error(state.message);
    } else if (state.fieldErrors) {
      toast.error(Object.values(state.fieldErrors)[0] ?? "Vui lòng kiểm tra lại thông tin.");
    }
  }, [state]);

  useEffect(() => {
    if (homepageState.success || seoState.success) {
      if (homepageState.success) setHomepageImagesUnsaved(false);
      const resetDirtyState = window.setTimeout(() => setIsDirty(false), 0);
      toast.success(homepageState.message ?? seoState.message ?? "Đã lưu");
      return () => window.clearTimeout(resetDirtyState);
    }
    const message = homepageState.message ?? seoState.message;
    if (message) toast.error(message);
  }, [homepageState, seoState]);

  useEffect(() => {
    if (signatureState.success) {
      toast.success(signatureState.message ?? "Đã lưu số món signature.");
    } else if (signatureState.message) {
      toast.error(signatureState.message);
    } else if (signatureState.fieldErrors) {
      toast.error(Object.values(signatureState.fieldErrors)[0] ?? "Số món không hợp lệ.");
    }
  }, [signatureState]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (isDirty) {
        event.preventDefault();
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function updateOpeningHour(
    index: number,
    field: keyof OpeningHour,
    value: string,
  ) {
    setOpeningHours((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
    setIsDirty(true);
  }

  async function uploadImage(
    event: ChangeEvent<HTMLInputElement>,
    kind: "hero" | "story",
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(kind);
    let preparedFile: File;
    try {
      preparedFile = await prepareImage(file, kind === "hero" ? 2000 : 1600);
    } catch (error) {
      setUploading(null);
      event.target.value = "";
      toast.error(error instanceof Error ? error.message : "Không thể xử lý ảnh.");
      return;
    }
    const data = new FormData();
    data.set("file", preparedFile);
    data.set("oldImageUrl", kind === "hero" ? heroImage : storyImage);
    const result = await uploadSiteImage(data);
    setUploading(null);
    event.target.value = "";
    if (!result.success || !result.url) {
      toast.error(result.message ?? "Không thể tải ảnh.");
      return;
    }
    if (kind === "hero") setHeroImage(result.url);
    else setStoryImage(result.url);
    setIsDirty(true);
    setHomepageImagesUnsaved(true);
    toast.success("Đã tải ảnh");
  }

  return (
    <Tabs defaultValue="general" className="mt-8">
      <TabsList variant="line">
        <TabsTrigger value="general">Thông tin chung</TabsTrigger>
        <TabsTrigger value="homepage">Trang chủ</TabsTrigger>
        <TabsTrigger value="seo">SEO</TabsTrigger>
        <TabsTrigger value="promotions">Ưu đãi</TabsTrigger>
        <TabsTrigger value="testimonials">Đánh giá</TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="mt-8">
        <form
          ref={formRef}
          action={formAction}
          onChange={() => setIsDirty(true)}
          className="grid gap-8"
        >
          <input
            type="hidden"
            name="openingHours"
            value={JSON.stringify(openingHours)}
          />
          <div className="grid gap-5 rounded-2xl border border-border bg-background p-5 sm:grid-cols-2 lg:p-8">
            <Field label="Tên nhà hàng" name="name" defaultValue={site.name} error={state.fieldErrors?.name} />
            <Field label="Khẩu hiệu" name="tagline" defaultValue={site.heroTagline} error={state.fieldErrors?.tagline} />
            <Field label="Số điện thoại" name="phone" defaultValue={site.phone} error={state.fieldErrors?.phone} />
            <Field label="Email" name="email" type="email" defaultValue={site.email} error={state.fieldErrors?.email} />
            <Field label="Địa chỉ" name="address" defaultValue={site.address} error={state.fieldErrors?.address} className="sm:col-span-2" />
            <div className="grid gap-2 sm:col-span-2">
              <label htmlFor="mapEmbedUrl" className="text-sm font-medium">
                Link nhúng Google Maps
              </label>
              <Input id="mapEmbedUrl" name="mapEmbedUrl" defaultValue={site.mapEmbedUrl} placeholder="https://www.google.com/maps/embed?..." />
              <p className="text-xs text-muted-foreground">
                Google Maps → Chia sẻ → Nhúng bản đồ → copy giá trị src
              </p>
              {state.fieldErrors?.mapEmbedUrl ? <ErrorText>{state.fieldErrors.mapEmbedUrl}</ErrorText> : null}
            </div>
            <Field label="Link Facebook" name="facebook" defaultValue={site.socialLinks.facebook} error={state.fieldErrors?.facebook} />
            <Field label="Link Instagram" name="instagram" defaultValue={site.socialLinks.instagram} error={state.fieldErrors?.instagram} />
            <Field label="Link Zalo" name="zalo" defaultValue={site.socialLinks.zalo} error={state.fieldErrors?.zalo} />
          </div>

          <div className="rounded-2xl border border-border bg-background p-5 lg:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl font-semibold">Giờ mở cửa</h2>
                <p className="mt-1 text-sm text-muted-foreground">Thiết lập lịch hoạt động hiển thị trên website.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpeningHours((current) => [...current, { day: "", hours: "" }]);
                  setIsDirty(true);
                }}
              >
                Thêm dòng
              </Button>
            </div>
            <div className="mt-5 grid gap-3">
              {openingHours.map((row, index) => (
                <div key={`${index}-${row.day}`} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <Input value={row.day} onChange={(event) => updateOpeningHour(index, "day", event.target.value)} placeholder="Ngày" aria-label="Ngày" />
                  <Input value={row.hours} onChange={(event) => updateOpeningHour(index, "hours", event.target.value)} placeholder="Giờ mở cửa" aria-label="Giờ mở cửa" />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setOpeningHours((current) => current.filter((_, rowIndex) => rowIndex !== index));
                      setIsDirty(true);
                    }}
                  >
                    Xóa
                  </Button>
                </div>
              ))}
            </div>
            {state.fieldErrors?.openingHours ? <ErrorText>{state.fieldErrors.openingHours}</ErrorText> : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button nativeButton={false} render={<Link href="/" target="_blank" rel="noreferrer" />} variant="outline">
              Xem trang
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </form>
      </TabsContent>
      <TabsContent value="promotions" className="mt-8">
        <AdminPromotions initialItems={promotions} />
      </TabsContent>
      <TabsContent value="testimonials" className="mt-8">
        <AdminTestimonials initialItems={testimonials} />
      </TabsContent>
      <TabsContent value="homepage" className="mt-8">
        <form action={homepageAction} onChange={() => setIsDirty(true)} className="grid gap-8">
          <input type="hidden" name="heroImageUrl" value={heroImage} />
          <input type="hidden" name="storyImageUrl" value={storyImage} />
          <div className="grid gap-5 rounded-2xl border border-border bg-background p-5 lg:grid-cols-2 lg:p-8">
            <div className="grid gap-2">
              <label htmlFor="heroTitle" className="text-sm font-medium">Tiêu đề hero</label>
              <Input id="heroTitle" name="heroTitle" defaultValue={site.heroTitle} />
              {homepageState.fieldErrors?.heroTitle ? <ErrorText>{homepageState.fieldErrors.heroTitle}</ErrorText> : null}
            </div>
            <div className="grid gap-2">
              <label htmlFor="heroTagline" className="text-sm font-medium">Phụ đề hero</label>
              <Textarea id="heroTagline" name="heroTagline" defaultValue={site.heroTagline} />
              {homepageState.fieldErrors?.heroTagline ? <ErrorText>{homepageState.fieldErrors.heroTagline}</ErrorText> : null}
            </div>
            <ImageUpload
              id="heroImage"
              label="Ảnh hero"
              value={heroImage}
              uploading={uploading === "hero"}
              unsaved={homepageImagesUnsaved}
              onChange={(event) => uploadImage(event, "hero")}
            />
            <div className="grid gap-2">
              <label htmlFor="storyTitle" className="text-sm font-medium">Tiêu đề câu chuyện</label>
              <Input id="storyTitle" name="storyTitle" defaultValue={site.storyTitle} />
              {homepageState.fieldErrors?.storyTitle ? <ErrorText>{homepageState.fieldErrors.storyTitle}</ErrorText> : null}
            </div>
            <div className="grid gap-2 lg:col-span-2">
              <label htmlFor="storyContent" className="text-sm font-medium">Nội dung câu chuyện</label>
              <Textarea id="storyContent" name="storyContent" rows={6} defaultValue={site.storyContent} />
              {homepageState.fieldErrors?.storyContent ? <ErrorText>{homepageState.fieldErrors.storyContent}</ErrorText> : null}
            </div>
            <ImageUpload
              id="storyImage"
              label="Ảnh câu chuyện"
              value={storyImage}
              uploading={uploading === "story"}
              unsaved={homepageImagesUnsaved}
              onChange={(event) => uploadImage(event, "story")}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={homepagePending || uploading !== null}>
              {homepagePending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </form>
        {canManageSignature ? (
          <form action={signatureAction} className="mt-6 grid gap-4 rounded-2xl border border-border bg-background p-5 lg:p-8">
            <div>
              <h2 className="font-heading text-2xl font-semibold">Món signature</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Số món hiện ở trang chủ. Món được lấy từ các món gắn tag Bán chạy và đang còn món.
              </p>
            </div>
            <div className="grid gap-2 sm:max-w-xs">
              <label htmlFor="signatureCount" className="text-sm font-medium">Số món hiển thị</label>
              <Input
                id="signatureCount"
                name="signatureCount"
                type="number"
                min={2}
                max={12}
                step={1}
                value={signatureCount}
                onChange={(event) => setSignatureCount(event.target.value)}
              />
              {signatureState.fieldErrors?.signatureCount ? (
                <ErrorText>{signatureState.fieldErrors.signatureCount}</ErrorText>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Hiện có {signatureEligibleCount} món đủ điều kiện.
              </p>
              {Number(signatureCount) > signatureEligibleCount ? (
                <p className="text-sm text-amber-700">
                  Số chọn lớn hơn số món đủ điều kiện; trang chủ chỉ hiển thị số món hiện có.
                </p>
              ) : null}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={signaturePending}>
                {signaturePending ? "Đang lưu..." : "Lưu số món"}
              </Button>
            </div>
          </form>
        ) : null}
      </TabsContent>
      <TabsContent value="seo" className="mt-8">
        <form action={seoAction} onChange={() => setIsDirty(true)} className="grid gap-5 rounded-2xl border border-border bg-background p-5 lg:p-8">
          <div className="grid gap-2">
            <label htmlFor="seoTitle" className="text-sm font-medium">Tiêu đề trang</label>
            <Input id="seoTitle" name="seoTitle" maxLength={60} value={seoTitle} onChange={(event) => { setSeoTitle(event.target.value); setIsDirty(true); }} />
            <p className="text-xs text-muted-foreground">Gợi ý dưới 60 ký tự.</p>
            <p className="text-xs text-muted-foreground">{seoTitle.length}/60 ký tự</p>
            {seoState.fieldErrors?.seoTitle ? <ErrorText>{seoState.fieldErrors.seoTitle}</ErrorText> : null}
          </div>
          <div className="grid gap-2">
            <label htmlFor="seoDescription" className="text-sm font-medium">Mô tả</label>
            <Textarea id="seoDescription" name="seoDescription" maxLength={160} value={seoDescription} onChange={(event) => { setSeoDescription(event.target.value); setIsDirty(true); }} />
            <p className="text-xs text-muted-foreground">Gợi ý dưới 160 ký tự.</p>
            <p className="text-xs text-muted-foreground">{seoDescription.length}/160 ký tự</p>
            {seoState.fieldErrors?.seoDescription ? <ErrorText>{seoState.fieldErrors.seoDescription}</ErrorText> : null}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={seoPending}>
              {seoPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  );
}

function ImageUpload({
  id,
  label,
  value,
  uploading,
  unsaved,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  uploading: boolean;
  unsaved: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="grid gap-3">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <div className="relative aspect-[16/7] overflow-hidden rounded-xl border border-border bg-muted">
        <Image src={value} alt="" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
      </div>
      <Input id={id} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={onChange} disabled={uploading} />
      <p className="text-xs text-muted-foreground">
        {uploading ? "Đang tải ảnh..." : "JPG, PNG hoặc WebP, tối đa 3MB."}
      </p>
      {unsaved ? (
        <p className="text-sm font-medium text-amber-700">
          Chưa lưu, hãy bấm Lưu
        </p>
      ) : null}
    </div>
  );
}

function Field({
  label,
  name,
  error,
  className,
  ...props
}: ComponentProps<typeof Input> & {
  label: string;
  name: string;
  error?: string;
}) {
  return (
    <div className={`grid gap-2 ${className ?? ""}`}>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <Input id={name} name={name} {...props} />
      {error ? <ErrorText>{error}</ErrorText> : null}
    </div>
  );
}

function ErrorText({ children }: { children: ReactNode }) {
  return <p className="text-xs text-destructive">{children}</p>;
}
