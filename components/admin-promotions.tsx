"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { Promotion } from "@/lib/content";
import {
  deletePromotion,
  movePromotion,
  createPromotion,
  updatePromotion,
  togglePromotion,
  uploadSiteImage,
} from "@/app/admin/noi-dung/actions";
import { prepareImage } from "@/lib/image-client";

function localDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

export function AdminPromotions({ initialItems }: { initialItems: Promotion[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  async function handleToggle(item: Promotion, active: boolean) {
    const result = await togglePromotion(item.id, active);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    setItems((current) =>
      current.map((entry) => (entry.id === item.id ? { ...entry, active } : entry)),
    );
  }

  async function handleDelete(item: Promotion) {
    const result = await deletePromotion(item.id, item.imageUrl);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    toast.success(result.message);
  }

  async function handleMove(item: Promotion, direction: "up" | "down") {
    const index = items.findIndex((entry) => entry.id === item.id);
    const target = direction === "up" ? index - 1 : index + 1;
    const result = await movePromotion(item.id, direction);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    if (target >= 0 && target < items.length) {
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      setItems(next);
    }
  }

  return (
    <div className="mt-8 grid gap-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{items.length} ưu đãi</p>
        <Button onClick={() => setIsAdding(true)}>Thêm ưu đãi</Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-4 py-3 font-medium">Ảnh</th>
              <th className="px-4 py-3 font-medium">Tiêu đề</th>
              <th className="px-4 py-3 font-medium">Thời gian</th>
              <th className="px-4 py-3 font-medium">Hiển thị</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="relative size-16 overflow-hidden rounded-lg bg-muted">
                    <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="64px" />
                  </div>
                </td>
                <td className="max-w-xs px-4 py-3">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                  {item.startsOn ? new Date(item.startsOn).toLocaleDateString("vi-VN") : "—"} –{" "}
                  {item.endsOn ? new Date(item.endsOn).toLocaleDateString("vi-VN") : "—"}
                </td>
                <td className="px-4 py-3">
                  <Switch checked={item.active} onCheckedChange={(checked) => handleToggle(item, checked)} aria-label={`Hiển thị ${item.title}`} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1">
                    <Button size="icon-sm" variant="ghost" disabled={index === 0} onClick={() => handleMove(item, "up")} aria-label="Đưa lên">↑</Button>
                    <Button size="icon-sm" variant="ghost" disabled={index === items.length - 1} onClick={() => handleMove(item, "down")} aria-label="Đưa xuống">↓</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(item)}>Sửa</Button>
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button size="sm" variant="destructive" />}>Xóa</AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogTitle>Xóa ưu đãi?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Ưu đãi “{item.title}” sẽ bị xóa vĩnh viễn.
                        </AlertDialogDescription>
                        <div className="flex justify-end gap-2">
                          <AlertDialogCancel render={<Button variant="outline" />}>Hủy</AlertDialogCancel>
                          <AlertDialogAction render={<Button variant="destructive" />} onClick={() => handleDelete(item)}>Xóa</AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? <p className="p-8 text-center text-muted-foreground">Chưa có ưu đãi.</p> : null}
      </div>
      {isAdding || editing ? (
        <PromotionForm
          item={editing}
          onClose={() => {
            setIsAdding(false);
            setEditing(null);
          }}
          onSaved={(item) => {
            setItems((current) =>
              editing
                ? current.map((entry) => (entry.id === item.id ? item : entry))
                : [...current, item],
            );
            setIsAdding(false);
            setEditing(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function PromotionForm({
  item,
  onClose,
  onSaved,
}: {
  item: Promotion | null;
  onClose: () => void;
  onSaved: (item: Promotion) => void;
}) {
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [active, setActive] = useState(item?.active ?? true);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    let preparedFile: File;
    try {
      preparedFile = await prepareImage(file);
    } catch (error) {
      setUploading(false);
      event.target.value = "";
      toast.error(error instanceof Error ? error.message : "Không thể xử lý ảnh.");
      return;
    }
    const data = new FormData();
    data.set("file", preparedFile);
    data.set("oldImageUrl", imageUrl);
    const result = await uploadSiteImage(data);
    setUploading(false);
    event.target.value = "";
    if (!result.success || !result.url) toast.error(result.message ?? "Không thể tải ảnh.");
    else {
      setImageUrl(result.url);
      toast.success("Đã tải ảnh");
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const formData = new FormData(event.currentTarget);
    const result = item
      ? await updatePromotion(formData)
      : await createPromotion(formData);
    setPending(false);
    if (!result.success) {
      toast.error(result.message ?? Object.values(result.fieldErrors ?? {})[0] ?? "Dữ liệu chưa hợp lệ.");
      return;
    }
    onSaved({
      id: item?.id ?? crypto.randomUUID(),
      title: String(new FormData(event.currentTarget).get("title")),
      description: String(new FormData(event.currentTarget).get("description")),
      imageUrl,
      startsOn: String(new FormData(event.currentTarget).get("startsOn")),
      endsOn: String(new FormData(event.currentTarget).get("endsOn")),
      active,
      sortOrder: item?.sortOrder ?? 0,
    });
    toast.success(result.message);
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-border bg-background p-5">
      <h2 className="font-heading text-2xl font-semibold">{item ? "Sửa ưu đãi" : "Thêm ưu đãi"}</h2>
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <input type="hidden" name="imageUrl" value={imageUrl} />
      <input type="hidden" name="active" value={active ? "true" : "false"} />
      <Input name="title" placeholder="Tiêu đề" defaultValue={item?.title} required />
      <textarea name="description" placeholder="Mô tả" defaultValue={item?.description} required className="min-h-24 rounded-2xl border border-input bg-input/30 p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="startsOn" type="datetime-local" defaultValue={localDateTime(item?.startsOn)} required />
        <Input name="endsOn" type="datetime-local" defaultValue={localDateTime(item?.endsOn)} required />
      </div>
      <Input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={upload} disabled={uploading} />
      <label className="flex items-center gap-3 text-sm font-medium">
        <Switch checked={active} onCheckedChange={setActive} />
        Hiển thị ưu đãi
      </label>
      {imageUrl ? <div className="relative aspect-[16/7] overflow-hidden rounded-xl"><Image src={imageUrl} alt="" fill className="object-cover" sizes="100vw" /></div> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
        <Button type="submit" disabled={pending || uploading || !imageUrl}>{pending ? "Đang lưu..." : "Lưu"}</Button>
      </div>
    </form>
  );
}
