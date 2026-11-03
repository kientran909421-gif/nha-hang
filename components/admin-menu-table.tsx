"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MenuCategory, MenuItem } from "@/data/menu";
import {
  deleteMenuItem,
  deleteUploadedMenuImage,
  saveMenuItem,
  uploadMenuImage,
  updateMenuAvailability,
  reorderMenuItem,
  deleteMenuCategory,
  reorderMenuCategory,
  saveMenuCategory,
  updateMenuCategoryActive,
  type MenuFormValues,
} from "@/app/admin/(panel)/thuc-don/actions";
import type { AdminMenuCategory } from "@/lib/content";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const normalizeText = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const formatPrice = (price: number) =>
  `${new Intl.NumberFormat("vi-VN").format(price)}đ`;

function AvailabilitySwitch({ item }: { item: MenuItem }) {
  const [available, setAvailable] = useState(item.available);
  const [pending, startTransition] = useTransition();

  function handleChange(nextAvailable: boolean) {
    const previous = available;
    setAvailable(nextAvailable);
    startTransition(async () => {
      const result = await updateMenuAvailability(item.id, nextAvailable);
      if (!result.success) {
        setAvailable(previous);
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={available}
        onCheckedChange={handleChange}
        disabled={pending}
        aria-label={`Còn món ${item.name}`}
      />
      <Badge variant={available ? "default" : "secondary"}>
        {available ? "Còn món" : "Tạm hết"}
      </Badge>
    </div>
  );
}

function ItemOrderButtons({
  item,
  canMoveUp,
  canMoveDown,
}: {
  item: MenuItem;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(async () => {
      const result = await reorderMenuItem(item.id, direction);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      window.location.reload();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={pending || !canMoveUp}
        onClick={() => move("up")}
        aria-label={`Đưa ${item.name} lên`}
      >
        Lên
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={pending || !canMoveDown}
        onClick={() => move("down")}
        aria-label={`Đưa ${item.name} xuống`}
      >
        Xuống
      </Button>
    </div>
  );
}

function MenuImage({ item }: { item: MenuItem }) {
  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
      <Image
        src={item.image || "/images/mon-1.jpg"}
        alt=""
        fill
        sizes="48px"
        className="object-cover"
      />
    </div>
  );
}

const emptyForm: MenuFormValues = {
  name: "",
  description: "",
  price: "",
  categorySlug: "khai-vi",
  tags: [],
  allergens: "",
  available: true,
};

function MenuFormDialog({
  item,
  categoryOptions,
  open,
  onOpenChange,
}: {
  item?: MenuItem;
  categoryOptions: AdminMenuCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<MenuFormValues>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [pending, startTransition] = useTransition();

  function openForm(nextOpen: boolean) {
    if (nextOpen) {
      setValues(
        item
          ? {
              id: item.id,
              name: item.name,
              description: item.description,
              price: String(item.price),
              categorySlug:
                categoryOptions.find((category) => category.name === item.category)
                  ?.slug ?? "",
              tags: [...item.tags],
              allergens: item.allergens.join(", "),
              available: item.available,
              imageUrl: item.image,
            }
          : {
              ...emptyForm,
              categorySlug:
                categoryOptions.find((category) => category.active)?.slug ?? "",
            },
      );
      setImageFile(null);
      setImagePreview(item?.image ?? "");
      setErrors({});
    }
    onOpenChange(nextOpen);
  }

  function updateField<K extends keyof MenuFormValues>(
    field: K,
    value: MenuFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  function submit() {
    startTransition(async () => {
      let nextValues = values;
      let uploadedUrl = "";

      if (imageFile) {
        const formData = new FormData();
        formData.set("file", imageFile);
        const uploadResult = await uploadMenuImage(formData);
        if (!uploadResult.success || !uploadResult.url) {
          setErrors((current) => ({
            ...current,
            image: uploadResult.message,
          }));
          toast.error(uploadResult.message);
          return;
        }
        uploadedUrl = uploadResult.url;
        nextValues = { ...values, imageUrl: uploadedUrl };
      }

      const result = await saveMenuItem(nextValues);
      if (!result.success) {
        setErrors(result.errors ?? {});
        toast.error(result.message);
        if (uploadedUrl && !result.imagePersisted) {
          await deleteUploadedMenuImage(uploadedUrl);
        }
        return;
      }
      toast.success(result.message);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={openForm}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Sửa món" : "Thêm món"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <label className="grid gap-1.5 text-sm font-medium">
            Tên món
            <Input value={values.name} onChange={(event) => updateField("name", event.target.value)} />
            {errors.name ? <span className="text-xs text-destructive">{errors.name}</span> : null}
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Mô tả
            <textarea
              value={values.description}
              onChange={(event) => updateField("description", event.target.value)}
              className="min-h-24 rounded-2xl border border-input bg-input/30 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.description ? <span className="text-xs text-destructive">{errors.description}</span> : null}
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Ảnh món
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setImageFile(file);
                setImagePreview(file ? URL.createObjectURL(file) : values.imageUrl ?? "");
                setErrors((current) => ({ ...current, image: "" }));
              }}
            />
            {imagePreview ? (
              <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                <Image
                  src={imagePreview}
                  alt="Xem trước ảnh món"
                  fill
                  sizes="(max-width: 640px) 100vw, 448px"
                  className="object-cover"
                />
              </div>
            ) : null}
            <span className="text-xs text-muted-foreground">
              JPG, PNG hoặc WebP, tối đa 3MB.
            </span>
            {errors.image ? <span className="text-xs text-destructive">{errors.image}</span> : null}
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Giá
            <Input
              type="number"
              min="0"
              step="1"
              value={values.price}
              onChange={(event) => updateField("price", event.target.value)}
              placeholder="185000"
            />
            {values.price && /^\d+$/.test(values.price) ? (
              <span className="text-xs text-muted-foreground">{formatPrice(Number(values.price))}</span>
            ) : null}
            {errors.price ? <span className="text-xs text-destructive">{errors.price}</span> : null}
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Danh mục
            <Select
              value={values.categorySlug}
              onValueChange={(value) => {
                if (value) updateField("categorySlug", value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions
                  .filter(
                    (category) =>
                      category.active || category.slug === values.categorySlug,
                  )
                  .map((category) => (
                  <SelectItem key={category.slug} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categorySlug ? <span className="text-xs text-destructive">{errors.categorySlug}</span> : null}
          </label>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">Tags</legend>
            <div className="flex flex-wrap gap-3">
              {(["chay", "cay", "ban-chay"] as const).map((tag) => (
                <label key={tag} className="flex items-center gap-2 text-sm font-normal">
                  <input
                    type="checkbox"
                    checked={values.tags.includes(tag)}
                    onChange={(event) =>
                      updateField(
                        "tags",
                        event.target.checked
                          ? [...values.tags, tag]
                          : values.tags.filter((value) => value !== tag),
                      )
                    }
                  />
                  {tag === "ban-chay" ? "Bán chạy" : tag === "chay" ? "Chay" : "Cay"}
                </label>
              ))}
            </div>
            {errors.tags ? <span className="text-xs text-destructive">{errors.tags}</span> : null}
          </fieldset>
          <label className="grid gap-1.5 text-sm font-medium">
            Dị ứng nguyên liệu
            <Input
              value={values.allergens}
              onChange={(event) => updateField("allergens", event.target.value)}
              placeholder="Tôm, Đậu phộng"
            />
            {errors.allergens ? <span className="text-xs text-destructive">{errors.allergens}</span> : null}
          </label>
          <label className="flex items-center gap-3 text-sm font-medium">
            <Switch
              checked={values.available}
              onCheckedChange={(checked) => updateField("available", checked)}
            />
            Còn món
          </label>
        </div>
        {errors.form ? <p className="text-sm text-destructive">{errors.form}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="button" disabled={pending} onClick={submit}>
            {pending && imageFile ? "Đang tải ảnh..." : pending ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MenuActions({
  item,
  categoryOptions,
  onChanged,
}: {
  item: MenuItem;
  categoryOptions: AdminMenuCategory[];
  onChanged: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteMenuItem(item.id);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setDeleteOpen(false);
      onChanged();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" size="sm" variant="outline" onClick={() => setEditOpen(true)}>Sửa</Button>
      <Button type="button" size="sm" variant="destructive" onClick={() => setDeleteOpen(true)}>Xóa</Button>
      <MenuFormDialog item={item} categoryOptions={categoryOptions} open={editOpen} onOpenChange={setEditOpen} />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Xóa món này?</AlertDialogTitle>
          <AlertDialogDescription>
            Món “{item.name}” sẽ bị xóa vĩnh viễn.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel render={<Button variant="outline" />}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              render={<Button variant="destructive" disabled={pending} />}
              onClick={remove}
            >
              {pending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CategoryDialog({
  category,
  open,
  onOpenChange,
}: {
  category?: AdminMenuCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setName(category?.name ?? "");
      setActive(category?.active ?? true);
      setError("");
    }
    onOpenChange(nextOpen);
  }

  function submit() {
    startTransition(async () => {
      const result = await saveMenuCategory({
        id: category?.id,
        name,
        active,
      });
      if (!result.success) {
        setError(result.errors?.name ?? result.message);
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Sửa danh mục" : "Thêm danh mục"}</DialogTitle>
        </DialogHeader>
        <label className="grid gap-1.5 text-sm font-medium">
          Tên danh mục
          <Input value={name} onChange={(event) => {
            setName(event.target.value);
            setError("");
          }} />
          {error ? <span className="text-xs text-destructive">{error}</span> : null}
        </label>
        <label className="flex items-center gap-3 text-sm font-medium">
          <Switch checked={active} onCheckedChange={setActive} />
          Hiển thị danh mục
        </label>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="button" disabled={pending} onClick={submit}>
            {pending ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryManager({ categories }: { categories: AdminMenuCategory[] }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<AdminMenuCategory>();
  const [deleteTarget, setDeleteTarget] = useState<AdminMenuCategory>();
  const [pendingId, setPendingId] = useState("");

  function runCategoryAction(
    action: () => Promise<{ success: boolean; message: string }>,
  ) {
    setPendingId("pending");
    void action().then((result) => {
      setPendingId("");
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Button type="button" onClick={() => setAddOpen(true)}>Thêm danh mục</Button>
      <CategoryDialog open={addOpen} onOpenChange={setAddOpen} />
      <div className="grid gap-3">
        {categories.map((category, index) => (
          <div key={category.id} className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{category.name}</p>
              <p className="text-sm text-muted-foreground">
                {category.slug} · {category.active ? "Đang hiện" : "Đang ẩn"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={index === 0 || pendingId !== ""}
                onClick={() => runCategoryAction(() => reorderMenuCategory(category.id, "up"))}
              >
                Lên
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={index === categories.length - 1 || pendingId !== ""}
                onClick={() => runCategoryAction(() => reorderMenuCategory(category.id, "down"))}
              >
                Xuống
              </Button>
              <Switch
                checked={category.active}
                disabled={pendingId !== ""}
                onCheckedChange={(active) =>
                  runCategoryAction(() => updateMenuCategoryActive(category.id, active))
                }
                aria-label={`Hiển thị ${category.name}`}
              />
              <Button type="button" size="sm" variant="outline" onClick={() => setEditing(category)}>Sửa</Button>
              <Button type="button" size="sm" variant="destructive" onClick={() => setDeleteTarget(category)}>Xóa</Button>
              <CategoryDialog
                category={category}
                open={editing?.id === category.id}
                onOpenChange={(open) => {
                  if (!open) setEditing(undefined);
                }}
              />
              <AlertDialog
                open={deleteTarget?.id === category.id}
                onOpenChange={(open) => {
                  if (!open) setDeleteTarget(undefined);
                }}
              >
                <AlertDialogContent>
                  <AlertDialogTitle>Xóa danh mục?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Nếu danh mục còn món, hệ thống sẽ từ chối và báo rõ lý do.
                  </AlertDialogDescription>
                  <div className="flex justify-end gap-2">
                    <AlertDialogCancel render={<Button variant="outline" />}>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      render={<Button variant="destructive" disabled={pendingId !== ""} />}
                      onClick={() => runCategoryAction(() => deleteMenuCategory(category.id))}
                    >
                      Xóa
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminMenuTable({
  items,
  categories,
}: {
  items: MenuItem[];
  categories: AdminMenuCategory[];
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [category, setCategory] = useState("Tất cả");
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());
    return items.filter((item) => {
      const matchesCategory =
        category === "Tất cả" || item.category === category;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        normalizeText(item.name).includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, items, query]);

  function itemPosition(item: MenuItem) {
    const sameCategory = items.filter((candidate) => candidate.category === item.category);
    const index = sameCategory.findIndex((candidate) => candidate.id === item.id);
    return {
      canMoveUp: index > 0,
      canMoveDown: index >= 0 && index < sameCategory.length - 1,
    };
  }

  return (
    <div className="mt-8 space-y-5">
      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Món ăn</TabsTrigger>
          <TabsTrigger value="categories">Danh mục</TabsTrigger>
        </TabsList>
        <TabsContent value="categories" className="pt-5">
          <CategoryManager categories={categories} />
        </TabsContent>
        <TabsContent value="items" className="space-y-5 pt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" onClick={() => setAddOpen(true)}>Thêm món</Button>
        <div className="flex flex-col gap-3 sm:flex-row">
        <Select
          value={category}
          onValueChange={(value) => {
          if (value) setCategory(value);
          }}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Tất cả">Tất cả</SelectItem>
            {categories.filter((item) => item.active).map((item) => (
              <SelectItem key={item.id} value={item.name}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm món theo tên"
          aria-label="Tìm món theo tên"
          className="sm:max-w-sm"
        />
        </div>
      </div>
      <MenuFormDialog categoryOptions={categories} open={addOpen} onOpenChange={setAddOpen} />

      <div className="hidden overflow-hidden rounded-2xl border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Món</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <MenuImage item={item} />
                    <span className="font-medium">{item.name}</span>
                  </div>
                </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{formatPrice(item.price)}</TableCell>
                <TableCell><AvailabilitySwitch item={item} /></TableCell>
                <TableCell className="text-right">
                  <ItemOrderButtons item={item} {...itemPosition(item)} />
                  <MenuActions item={item} categoryOptions={categories} onChanged={() => router.refresh()} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {filteredItems.map((item) => (
          <article key={item.id} className="rounded-2xl border p-4">
            <div className="flex items-center gap-3">
              <MenuImage item={item} />
              <div className="min-w-0">
                <h2 className="truncate font-medium">{item.name}</h2>
                <p className="text-sm text-muted-foreground">{item.category}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="font-medium text-accent">
                {formatPrice(item.price)}
              </span>
              <AvailabilitySwitch item={item} />
            </div>
            <div className="mt-4">
              <ItemOrderButtons item={item} {...itemPosition(item)} />
              <MenuActions item={item} categoryOptions={categories} onChanged={() => router.refresh()} />
            </div>
          </article>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          Không tìm thấy món phù hợp.
        </p>
      ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
