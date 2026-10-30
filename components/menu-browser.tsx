"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MenuCategory, MenuItem, MenuTag } from "@/data/menu";
import { menuItems } from "@/data/menu";

const categories: Array<"Tất cả" | MenuCategory> = [
  "Tất cả",
  "Khai vị",
  "Món chính",
  "Tráng miệng",
  "Đồ uống",
];

const filters: Array<{ label: string; tag: MenuTag }> = [
  { label: "Chay", tag: "chay" },
  { label: "Cay", tag: "cay" },
  { label: "Bán chạy", tag: "bán chạy" },
];

const tagLabels: Record<MenuTag, string> = {
  chay: "Chay",
  cay: "Cay",
  "bán chạy": "Bán chạy",
};

const formatPrice = (price: number) =>
  `${new Intl.NumberFormat("vi-VN").format(price)}đ`;

const normalizeText = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function MenuDetail({ item }: { item: MenuItem }) {
  return (
    <Dialog>
      <DialogTrigger
        className="block h-full w-full text-left"
        aria-label={`Xem chi tiết ${item.name}`}
      >
        <Card className="h-full transition-shadow hover:shadow-lg">
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover transition-transform duration-500 group-hover/card:scale-105"
            />
          </div>
          <CardHeader className="gap-1">
            <CardTitle className="line-clamp-1 text-lg">{item.name}</CardTitle>
            <CardDescription className="line-clamp-2 min-h-10 leading-5">
              {item.shortDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-2">
            <p className="font-semibold text-accent">{formatPrice(item.price)}</p>
            <div className="flex flex-wrap justify-end gap-1">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tagLabels[tag]}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="rounded-t-4xl object-cover"
          />
        </div>
        <div className="grid gap-6 p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl">{item.name}</DialogTitle>
            <DialogDescription className="text-base leading-7">
              {item.description}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <p className="text-sm font-medium">Dị ứng nguyên liệu</p>
            <p className="text-sm text-muted-foreground">
              {item.allergens.length > 0
                ? item.allergens.join(", ")
                : "Không có nguyên liệu gây dị ứng phổ biến."}
            </p>
          </div>
          <DialogFooter className="items-center justify-between sm:flex-row">
            <p className="text-lg font-semibold text-accent">
              {formatPrice(item.price)}
            </p>
            <Button render={<Link href="/dat-ban" />}>Đặt bàn</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MenuBrowser() {
  const [category, setCategory] = useState<"Tất cả" | MenuCategory>("Tất cả");
  const [activeFilters, setActiveFilters] = useState<MenuTag[]>([]);
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());

    return menuItems.filter((item) => {
      const matchesCategory =
        category === "Tất cả" || item.category === category;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        normalizeText(item.name).includes(normalizedQuery);
      const matchesFilters = activeFilters.every((filter) =>
        item.tags.includes(filter),
      );

      return matchesCategory && matchesQuery && matchesFilters;
    });
  }, [activeFilters, category, query]);

  function toggleFilter(tag: MenuTag) {
    setActiveFilters((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 lg:px-8">
      <div className="flex flex-col gap-5">
        <Tabs
          value={category}
          onValueChange={(value) => setCategory(value as "Tất cả" | MenuCategory)}
        >
          <div className="-mx-5 overflow-x-auto px-5 pb-1">
            <TabsList variant="line" className="min-w-max">
              {categories.map((item) => (
                <TabsTrigger key={item} value={item} className="px-4">
                  {item}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Button
                key={filter.tag}
                type="button"
                size="sm"
                variant={activeFilters.includes(filter.tag) ? "default" : "outline"}
                onClick={() => toggleFilter(filter.tag)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm món theo tên"
            aria-label="Tìm món theo tên"
            className="h-10 sm:max-w-xs"
          />
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <MenuDetail key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="py-24 text-center text-muted-foreground">
          Không tìm thấy món phù hợp
        </p>
      )}
    </div>
  );
}
