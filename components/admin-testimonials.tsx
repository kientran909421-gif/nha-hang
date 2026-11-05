"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import type { Testimonial } from "@/lib/content";
import {
  deleteTestimonial,
  moveTestimonial,
  createTestimonial,
  updateTestimonial,
  toggleTestimonial,
} from "@/app/admin/noi-dung/actions";

export function AdminTestimonials({ initialItems }: { initialItems: Testimonial[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [adding, setAdding] = useState(false);

  async function toggle(item: Testimonial, active: boolean) {
    const result = await toggleTestimonial(item.id, active);
    if (!result.success) return toast.error(result.message);
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, active } : entry));
  }

  async function remove(item: Testimonial) {
    const result = await deleteTestimonial(item.id);
    if (!result.success) return toast.error(result.message);
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    toast.success(result.message);
  }

  async function move(item: Testimonial, direction: "up" | "down") {
    const index = items.findIndex((entry) => entry.id === item.id);
    const target = direction === "up" ? index - 1 : index + 1;
    const result = await moveTestimonial(item.id, direction);
    if (!result.success) return toast.error(result.message);
    if (target >= 0 && target < items.length) {
      const next = [...items];
      [next[index], next[target]] = [next[target], next[index]];
      setItems(next);
    }
  }

  return (
    <div className="mt-8 grid gap-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{items.length} đánh giá</p>
        <Button onClick={() => setAdding(true)}>Thêm đánh giá</Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-4 py-3 font-medium">Tên khách</th>
              <th className="px-4 py-3 font-medium">Nội dung</th>
              <th className="px-4 py-3 font-medium">Sao</th>
              <th className="px-4 py-3 font-medium">Nguồn</th>
              <th className="px-4 py-3 font-medium">Hiển thị</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="max-w-sm px-4 py-3 text-muted-foreground">
                  <span className="line-clamp-2">{item.quote}</span>
                </td>
                <td className="px-4 py-3 text-accent">{"★".repeat(item.stars)}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.source}</td>
                <td className="px-4 py-3">
                  <Switch checked={item.active} onCheckedChange={(checked) => toggle(item, checked)} aria-label={`Hiển thị ${item.name}`} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Button size="icon-sm" variant="ghost" disabled={index === 0} onClick={() => move(item, "up")} aria-label="Đưa lên">↑</Button>
                    <Button size="icon-sm" variant="ghost" disabled={index === items.length - 1} onClick={() => move(item, "down")} aria-label="Đưa xuống">↓</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(item)}>Sửa</Button>
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button size="sm" variant="destructive" />}>Xóa</AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogTitle>Xóa đánh giá?</AlertDialogTitle>
                        <AlertDialogDescription>Đánh giá của “{item.name}” sẽ bị xóa vĩnh viễn.</AlertDialogDescription>
                        <div className="flex justify-end gap-2">
                          <AlertDialogCancel render={<Button variant="outline" />}>Hủy</AlertDialogCancel>
                          <AlertDialogAction render={<Button variant="destructive" />} onClick={() => remove(item)}>Xóa</AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? <p className="p-8 text-center text-muted-foreground">Chưa có đánh giá.</p> : null}
      </div>
      {adding || editing ? (
        <TestimonialForm
          item={editing}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSaved={(item) => {
            setItems((current) => editing ? current.map((entry) => entry.id === item.id ? item : entry) : [...current, item]);
            setAdding(false);
            setEditing(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function TestimonialForm({
  item,
  onClose,
  onSaved,
}: {
  item: Testimonial | null;
  onClose: () => void;
  onSaved: (item: Testimonial) => void;
}) {
  const [pending, setPending] = useState(false);
  const [active, setActive] = useState(item?.active ?? true);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const result = item
      ? await updateTestimonial(form)
      : await createTestimonial(form);
    setPending(false);
    if (!result.success) {
      return toast.error(result.message ?? "Dữ liệu chưa hợp lệ.");
    }
    onSaved({
      id: item?.id ?? ("id" in result ? result.id : undefined) ?? crypto.randomUUID(),
      name: String(form.get("name")),
      quote: String(form.get("quote")),
      stars: Number(form.get("stars")),
      source: String(form.get("source")),
      active,
      sortOrder: item?.sortOrder ?? 0,
    });
    toast.success(result.message);
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-border bg-background p-5">
      <h2 className="font-heading text-2xl font-semibold">{item ? "Sửa đánh giá" : "Thêm đánh giá"}</h2>
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <input type="hidden" name="active" value={active ? "true" : "false"} />
      <Input name="name" placeholder="Tên khách" defaultValue={item?.name} required />
      <textarea name="quote" placeholder="Nội dung đánh giá" defaultValue={item?.quote} required className="min-h-28 rounded-2xl border border-input bg-input/30 p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
      <div className="grid gap-3 sm:grid-cols-2">
        <select name="stars" defaultValue={item?.stars ?? 5} className="h-9 rounded-4xl border border-input bg-input/30 px-3 text-sm">
          {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} sao</option>)}
        </select>
        <select name="source" defaultValue={item?.source ?? "Khác"} className="h-9 rounded-4xl border border-input bg-input/30 px-3 text-sm">
          {["Google", "Facebook", "Khác"].map((value) => <option key={value}>{value}</option>)}
        </select>
      </div>
      <label className="flex items-center gap-3 text-sm font-medium">
        <Switch checked={active} onCheckedChange={setActive} />
        Hiển thị đánh giá
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
        <Button type="submit" disabled={pending}>{pending ? "Đang lưu..." : "Lưu"}</Button>
      </div>
    </form>
  );
}
