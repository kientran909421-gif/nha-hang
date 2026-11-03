"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addStaff, setStaffActive, updateStaffRole } from "@/app/admin/nhan-vien/actions";
import type { StaffRole } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type AdminStaff = {
  id: string;
  email: string;
  role: StaffRole;
  branchName: string;
  active: boolean;
  lastSignInAt: string | null;
};

const roles: Array<{ value: StaffRole; label: string }> = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "host", label: "Host" },
  { value: "marketing", label: "Marketing" },
];

const roleDescriptions: Record<StaffRole, string> = {
  owner: "Toàn quyền quản trị, bao gồm nhân viên và tài khoản khách.",
  manager: "Quản lý nội dung, thực đơn, đặt bàn và khách; không quản lý nhân viên hoặc xóa khách.",
  host: "Xem số đặt bàn hôm nay, quản lý đặt bàn, trạng thái món và tra cứu tên/số điện thoại.",
  marketing: "Xem lưu lượng truy cập, chỉnh sửa nội dung và chương trình ưu đãi.",
};

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value)) : "Chưa đăng nhập";
}

function RoleLabel({ role }: { role: StaffRole }) {
  return <Badge variant="outline">{roles.find((item) => item.value === role)?.label ?? role}</Badge>;
}

export function AdminStaffTable({ staff }: { staff: AdminStaff[] }) {
  const [rows, setRows] = useState(staff);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("host");
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<{ type: "role" | "active"; row: AdminStaff; nextRole?: StaffRole; nextActive?: boolean } | null>(null);

  function refreshRow(rowId: string, update: Partial<AdminStaff>) {
    setRows((current) => current.map((row) => row.id === rowId ? { ...row, ...update } : row));
  }

  function submitAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => { void (async () => {
      const result = await addStaff(email, role);
      if (!result.success) return toast.error(result.message);
      toast.success(result.message);
      setOpen(false);
      setEmail("");
      window.location.reload();
    })(); });
  }

  function submitChange() {
    if (!confirm) return;
    startTransition(() => { void (async () => {
      const result = confirm.type === "role"
        ? await updateStaffRole(confirm.row.id, confirm.nextRole ?? confirm.row.role)
        : await setStaffActive(confirm.row.id, confirm.nextActive ?? confirm.row.active);
      if (!result.success) return toast.error(result.message);
      toast.success(result.message);
      if (confirm.type === "role") refreshRow(confirm.row.id, { role: confirm.nextRole });
      else refreshRow(confirm.row.id, { active: confirm.nextActive });
      setConfirm(null);
    })(); });
  }

  return (
    <section>
      <p className="text-sm text-muted-foreground">Quản trị</p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="font-heading text-4xl font-semibold">Nhân viên</h1><p className="mt-2 text-muted-foreground">Phân quyền nhân viên theo vai trò.</p></div>
        <Button onClick={() => setOpen(true)}>Thêm nhân viên</Button>
      </div>
      <div className="mt-8 rounded-xl border p-4"><h2 className="font-heading text-xl font-semibold">Vai trò này làm được gì</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{roles.map((item) => <div key={item.value} className="rounded-lg bg-muted/50 p-3"><RoleLabel role={item.value} /><p className="mt-2 text-sm text-muted-foreground">{roleDescriptions[item.value]}</p></div>)}</div></div>
      {rows.length === 0 ? <p className="mt-6 rounded-xl border p-8 text-center text-muted-foreground">Chưa có nhân viên nào</p> : (
        <>
          <div className="mt-6 hidden overflow-hidden rounded-xl border md:block"><Table><TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Vai trò</TableHead><TableHead>Chi nhánh</TableHead><TableHead>Trạng thái</TableHead><TableHead>Đăng nhập gần nhất</TableHead><TableHead>Thao tác</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell className="font-medium">{row.email}</TableCell><TableCell><RoleLabel role={row.role} /></TableCell><TableCell>{row.branchName}</TableCell><TableCell><Badge variant={row.active ? "secondary" : "destructive"}>{row.active ? "Đang hoạt động" : "Đã tắt"}</Badge></TableCell><TableCell>{formatDate(row.lastSignInAt)}</TableCell><TableCell><StaffActions row={row} onChange={setConfirm} /></TableCell></TableRow>)}</TableBody></Table></div>
          <div className="mt-6 grid gap-3 md:hidden">{rows.map((row) => <article key={row.id} className="rounded-xl border p-4"><p className="font-medium break-all">{row.email}</p><div className="mt-3 flex flex-wrap gap-2"><RoleLabel role={row.role} /><Badge variant={row.active ? "secondary" : "destructive"}>{row.active ? "Đang hoạt động" : "Đã tắt"}</Badge></div><dl className="mt-3 grid gap-1 text-sm text-muted-foreground"><div>Chi nhánh: {row.branchName}</div><div>Đăng nhập: {formatDate(row.lastSignInAt)}</div></dl><div className="mt-3"><StaffActions row={row} onChange={setConfirm} /></div></article>)}</div>
        </>
      )}
      <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Thêm nhân viên</DialogTitle><DialogDescription>Nhân viên cần đăng nhập Google bằng đúng email này để được cấp quyền.</DialogDescription></DialogHeader><form onSubmit={submitAdd} className="grid gap-4"><Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@nhahang.vn" /><Select value={role} onValueChange={(value) => setRole(value as StaffRole)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{roles.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select><p className="text-sm text-muted-foreground">Hệ thống chưa có dịch vụ gửi email mời. Hãy báo nhân viên đăng nhập bằng Google với email này.</p><Button type="submit" disabled={pending}>{pending ? "Đang thêm..." : "Thêm nhân viên"}</Button></form></DialogContent></Dialog>
      <Dialog open={confirm !== null} onOpenChange={(value) => { if (!value) setConfirm(null); }}><DialogContent><DialogHeader><DialogTitle>Xác nhận thay đổi</DialogTitle><DialogDescription>{confirm?.type === "role" ? `Đổi vai trò của ${confirm.row.email} thành ${roles.find((item) => item.value === confirm.nextRole)?.label}.` : `${confirm?.nextActive ? "Bật" : "Tắt"} quyền truy cập của ${confirm?.row.email}.`}</DialogDescription></DialogHeader><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setConfirm(null)}>Hủy</Button><Button variant={confirm?.nextActive === false ? "destructive" : "default"} disabled={pending} onClick={submitChange}>{pending ? "Đang lưu..." : "Xác nhận"}</Button></div></DialogContent></Dialog>
    </section>
  );
}

function StaffActions({ row, onChange }: { row: AdminStaff; onChange: (value: { type: "role" | "active"; row: AdminStaff; nextRole?: StaffRole; nextActive?: boolean }) => void }) {
  const [role, setRole] = useState(row.role);
  return <div className="flex flex-wrap gap-2"><Select value={role} onValueChange={(value) => { const nextRole = value as StaffRole; setRole(nextRole); if (nextRole !== row.role) onChange({ type: "role", row, nextRole }); }}><SelectTrigger size="sm"><SelectValue /></SelectTrigger><SelectContent>{roles.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select><Button size="sm" variant="outline" onClick={() => onChange({ type: "active", row, nextActive: !row.active })}>{row.active ? "Tắt quyền" : "Bật quyền"}</Button></div>;
}
