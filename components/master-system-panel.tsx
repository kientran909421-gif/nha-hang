"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateMaintenance } from "@/app/admin/master/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MasterSystemPanel({
  status,
}: {
  status: { maintenanceEnabled: boolean; maintenanceMessage: string; appVersion: string; supabase: boolean; email: boolean };
}) {
  const [enabled, setEnabled] = useState(status.maintenanceEnabled);
  const [message, setMessage] = useState(status.maintenanceMessage || "Website đang được bảo trì. Vui lòng quay lại sau.");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(() => void (async () => {
      const result = await updateMaintenance(enabled, message);
      if (!result.success) return toast.error(result.message);
      toast.success(result.message);
    })());
  }

  return <div className="grid gap-5">
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        ["Supabase", status.supabase ? "Đang kết nối" : "Lỗi kết nối"],
        ["Email", status.email ? "Đã cấu hình" : "Chưa cấu hình"],
        ["Phiên bản", status.appVersion],
      ].map(([label, value]) => <div key={label} className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-semibold">{value}</p></div>)}
    </div>
    <div className="rounded-xl border p-4">
      <h2 className="font-heading text-xl font-semibold">Chế độ bảo trì</h2>
      <label className="mt-4 flex items-center gap-3 text-sm"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} /> Hiển thị thông báo trên website công khai</label>
      <Input className="mt-3" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} />
      <Button className="mt-3" onClick={save} disabled={pending}>{pending ? "Đang lưu..." : "Lưu cấu hình"}</Button>
    </div>
  </div>;
}
