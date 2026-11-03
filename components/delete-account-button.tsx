"use client";

import { deleteAccount } from "@/app/tai-khoan/actions";
import { Button } from "@/components/ui/button";

export function DeleteAccountButton() {
  return (
    <form action={deleteAccount} className="mt-4">
      <Button type="submit" variant="destructive" onClick={(event) => {
        if (!window.confirm("Bạn có chắc muốn xóa tài khoản? Hành động này không thể hoàn tác.")) {
          event.preventDefault();
        }
      }}>
        Yêu cầu xóa tài khoản
      </Button>
    </form>
  );
}
