"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addStaff, setStaffActive, updateStaffRole } from "@/app/admin/nhan-vien/actions";
import type { StaffRole } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type MasterAccount = {
  id: string;
  email: string;
  role: Exclude<StaffRole, "master">;
  active: boolean;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  actions7d: number;
  actions30d: number;
};

const roles: Array<{ value: Exclude<StaffRole, "master">; label: string }> = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "host", label: "Host" },
  { value: "marketing", label: "Marketing" },
];

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value))
    : "Chưa có";
}

export function MasterAccountsTable({ accounts }: { accounts: MasterAccount[] }) {
  const [rows, setRows] = useState(accounts);
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  function confirmChange(message: string) {
    return window.confirm(message);
  }

  function addOwner() {
    if (!email.trim() || !confirmChange(`Thêm ${email.trim()} với vai trò Owner?`)) return;
    startTransition(() => void (async () => {
      const result = await addStaff(email, "owner");
      if (!result.success) return toast.error(result.message);
      toast.success(result.message);
      setEmail("");
      window.location.reload();
    })());
  }

  function changeRole(row: MasterAccount, role: string) {
    if (role === row.role || !confirmChange(`Đổi vai trò ${row.email} thành ${role}?`)) return;
    startTransition(() => void (async () => {
      const result = await updateStaffRole(row.id, role);
      if (!result.success) return toast.error(result.message);
      toast.success(result.message);
      setRows((current) => current.map((item) => item.id === row.id ? { ...item, role: role as MasterAccount["role"] } : item));
    })());
  }

  function toggleActive(row: MasterAccount) {
    const next = !row.active;
    if (!confirmChange(`${next ? "Bật" : "Tắt"} quyền truy cập của ${row.email}?`)) return;
    startTransition(() => void (async () => {
      const result = await setStaffActive(row.id, next);
      if (!result.success) return toast.error(result.message);
      toast.success(result.message);
      setRows((current) => current.map((item) => item.id === row.id ? { ...item, active: next } : item));
    })());
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row">
        <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email-owner@example.com" type="email" />
        <Button onClick={addOwner} disabled={pending} className="sm:w-auto">Thêm owner</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Email</TableHead><TableHead>Vai trò</TableHead><TableHead>Trạng thái</TableHead>
            <TableHead>Đăng nhập gần nhất</TableHead><TableHead>Hoạt động gần nhất</TableHead><TableHead>7 ngày</TableHead><TableHead>30 ngày</TableHead><TableHead />
          </TableRow></TableHeader>
          <TableBody>{rows.map((row) => <TableRow key={row.id}>
            <TableCell className="font-medium"><Link className="text-primary hover:underline" href={`/admin/master/nhan-vien/${row.id}`}>{row.email}</Link></TableCell>
            <TableCell><Select value={row.role} onValueChange={(value) => { if (value) changeRole(row, value); }}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent>{roles.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></TableCell>
            <TableCell><Badge variant={row.active ? "secondary" : "destructive"}>{row.active ? "Hoạt động" : "Đã tắt"}</Badge></TableCell>
            <TableCell>{formatDate(row.lastLoginAt)}</TableCell><TableCell>{formatDate(row.lastSeenAt)}</TableCell>
            <TableCell>{row.actions7d}</TableCell><TableCell>{row.actions30d}</TableCell>
            <TableCell><Button size="sm" variant="outline" disabled={pending} onClick={() => toggleActive(row)}>{row.active ? "Tắt" : "Bật"}</Button></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </div>
    </div>
  );
}
