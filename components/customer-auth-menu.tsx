"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SheetClose } from "@/components/ui/sheet";

type CustomerAuthMenuProps = {
  user: { email?: string; user_metadata?: Record<string, unknown> };
  isAdmin: boolean;
  mobile?: boolean;
};

function initials(user: CustomerAuthMenuProps["user"]) {
  const name = String(user.user_metadata?.full_name ?? user.email ?? "?").trim();
  return name.slice(0, 1).toUpperCase();
}

function Avatar({ user }: { user: CustomerAuthMenuProps["user"] }) {
  const avatar = String(user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? "");
  return avatar ? (
    <img src={avatar} alt="" className="size-8 rounded-full object-cover" />
  ) : (
    <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
      {initials(user)}
    </span>
  );
}

export function CustomerAuthMenu({ user, isAdmin, mobile = false }: CustomerAuthMenuProps) {
  const router = useRouter();

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Không thể đăng xuất. Vui lòng thử lại.");
      return;
    }
    router.refresh();
  }

  if (mobile) {
    return (
      <>
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <Avatar user={user} />
          <span className="truncate text-sm">{user.email}</span>
        </div>
        <SheetClose render={<Link href="/tai-khoan" />} className="flex items-center gap-2 text-left">
          <UserRound className="size-4" /> Tài khoản
        </SheetClose>
        <SheetClose render={<Link href="/tai-khoan/dat-ban" />} className="text-left">
          Đặt bàn của tôi
        </SheetClose>
        {isAdmin ? (
          <SheetClose render={<Link href="/admin" />} className="text-left">
            Quản trị
          </SheetClose>
        ) : null}
        <button type="button" onClick={signOut} className="text-left text-destructive">
          Đăng xuất
        </button>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label="Mở menu tài khoản" />}
      >
        <Avatar user={user} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<Link href="/tai-khoan" />}>Tài khoản</DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/tai-khoan/dat-ban" />}>Đặt bàn của tôi</DropdownMenuItem>
        {isAdmin ? <DropdownMenuItem render={<Link href="/admin" />}>Quản trị</DropdownMenuItem> : null}
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="size-4" /> Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
