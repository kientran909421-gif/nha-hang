"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { banUser, deleteUser, unbanUser } from "@/app/admin/tai-khoan/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
export type AdminReservation = {
  code: string;
  reservationDate: string;
  startTime: string;
  partySize: number;
  status: string;
};

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  provider: string;
  createdAt: string;
  lastSignInAt: string | null;
  bookingCount: number;
  noShowCount: number;
  banned: boolean;
  isAdmin: boolean;
  reservations: AdminReservation[];
};

export type AdminAuditLog = {
  id: string;
  createdAt: string;
  actorEmail: string;
  action: string;
  targetEmail: string;
  details: string | null;
};

type Filter = "all" | "banned" | "no-show";

const dateTime = (value: string | null) =>
  value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value)) : "Chưa đăng nhập";

const reservationStatus: Record<string, string> = {
  held: "Đang giữ chỗ",
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  completed: "Đã hoàn tất",
  cancelled: "Đã hủy",
  no_show: "Không đến",
  expired: "Đã hết hạn",
};

const auditActions: Record<string, string> = {
  ban_user: "Khóa tài khoản",
  unban_user: "Mở khóa tài khoản",
  delete_user: "Xóa tài khoản",
};

function AccountAvatar({ account }: { account: AdminAccount }) {
  return account.avatarUrl ? (
    <img src={account.avatarUrl} alt="" className="size-9 rounded-full object-cover" />
  ) : (
    <span className="flex size-9 items-center justify-center rounded-full bg-muted font-medium">
      {account.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function AccountDetails({ account, onAction }: { account: AdminAccount; onAction: (action: "ban" | "unban" | "delete") => void }) {
  return (
    <div className="grid gap-4 text-sm">
      <div className="flex items-center gap-3">
        <AccountAvatar account={account} />
        <div><p className="font-medium">{account.name}</p><p className="text-muted-foreground">{account.email}</p></div>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <div><dt className="text-muted-foreground">Nhà cung cấp</dt><dd>{account.provider}</dd></div>
        <div><dt className="text-muted-foreground">Trạng thái</dt><dd>{account.banned ? "Đã khóa" : "Hoạt động"}</dd></div>
        <div><dt className="text-muted-foreground">Ngày tạo</dt><dd>{dateTime(account.createdAt)}</dd></div>
        <div><dt className="text-muted-foreground">Đăng nhập gần nhất</dt><dd>{dateTime(account.lastSignInAt)}</dd></div>
        <div><dt className="text-muted-foreground">Số lần đặt bàn</dt><dd>{account.bookingCount}</dd></div>
        <div><dt className="text-muted-foreground">Số lần no-show</dt><dd>{account.noShowCount}</dd></div>
      </dl>
      <div>
        <h3 className="font-medium">10 đặt bàn gần nhất</h3>
        {account.reservations.length === 0 ? <p className="mt-2 text-muted-foreground">Chưa có đặt bàn.</p> : (
          <div className="mt-2 grid gap-2">
            {account.reservations.map((reservation) => (
              <div key={`${reservation.code}-${reservation.reservationDate}`} className="rounded-lg border p-3">
                <p>{reservation.reservationDate} · {reservation.startTime} · {reservation.partySize} khách</p>
                <p className="mt-1 text-xs text-muted-foreground">Mã {reservation.code} · {reservationStatus[reservation.status] ?? reservation.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {!account.isAdmin && (
        <div className="flex flex-wrap gap-2 border-t pt-4">
          {account.banned ? <Button variant="outline" onClick={() => onAction("unban")}>Mở khóa</Button> : <Button variant="outline" onClick={() => onAction("ban")}>Khóa tài khoản</Button>}
          <Button variant="destructive" onClick={() => onAction("delete")}>Xóa tài khoản</Button>
        </div>
      )}
    </div>
  );
}

function AuditLogTable({ logs }: { logs: AdminAuditLog[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border">
      {logs.length === 0 ? <p className="p-8 text-center text-muted-foreground">Chưa có nhật ký.</p> : (
        <Table>
          <TableHeader><TableRow><TableHead>Thời gian</TableHead><TableHead>Người thực hiện</TableHead><TableHead>Thao tác</TableHead><TableHead>Tài khoản</TableHead><TableHead>Chi tiết</TableHead></TableRow></TableHeader>
          <TableBody>{logs.map((log) => <TableRow key={log.id}><TableCell>{dateTime(log.createdAt)}</TableCell><TableCell>{log.actorEmail}</TableCell><TableCell>{auditActions[log.action] ?? log.action}</TableCell><TableCell>{log.targetEmail}</TableCell><TableCell>{log.details ?? "—"}</TableCell></TableRow>)}</TableBody>
        </Table>
      )}
    </div>
  );
}

export function AdminAccountsTable({
  accounts,
  page,
  hasNextPage,
  query,
  auditLogs,
}: {
  accounts: AdminAccount[];
  page: number;
  hasNextPage: boolean;
  query: string;
  auditLogs: AdminAuditLog[];
}) {
  const [tab, setTab] = useState<"accounts" | "audit">("accounts");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<AdminAccount | null>(null);
  const [confirmation, setConfirmation] = useState<"ban" | "unban" | "delete" | null>(null);
  const [reason, setReason] = useState("");
  const [emailConfirmation, setEmailConfirmation] = useState("");
  const [pending, startTransition] = useTransition();
  const filtered = useMemo(() => accounts.filter((account) => filter === "all" || (filter === "banned" ? account.banned : account.noShowCount > 0)), [accounts, filter]);
  const queryString = query ? `&q=${encodeURIComponent(query)}` : "";

  function runAction() {
    if (!selected || !confirmation) return;
    startTransition(async () => {
      const result = confirmation === "ban"
        ? await banUser(selected.id, reason)
        : confirmation === "unban"
          ? await unbanUser(selected.id)
          : await deleteUser(selected.id);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      if (result.warning) toast.warning(result.message);
      else toast.success(result.message);
      setConfirmation(null);
      setSelected(null);
      window.location.reload();
    });
  }

  return (
    <div className="mt-8">
      <div className="flex gap-2 border-b">
        <Button type="button" variant={tab === "accounts" ? "default" : "ghost"} onClick={() => setTab("accounts")}>Tài khoản</Button>
        <Button type="button" variant={tab === "audit" ? "default" : "ghost"} onClick={() => setTab("audit")}>Nhật ký</Button>
      </div>
      {tab === "audit" ? <AuditLogTable logs={auditLogs} /> : (
        <>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form className="flex gap-2"><Input name="q" defaultValue={query} placeholder="Tìm email hoặc tên" className="w-full sm:w-72" /><Button type="submit" variant="outline">Tìm</Button></form>
            <div className="flex flex-wrap gap-2">{([["all", "Tất cả"], ["banned", "Đã khóa"], ["no-show", "Có no-show"]] as const).map(([value, label]) => <Button key={value} type="button" size="sm" variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)}>{label}</Button>)}</div>
          </div>
          {filtered.length === 0 ? <p className="mt-6 rounded-xl border p-8 text-center text-muted-foreground">Chưa có tài khoản nào</p> : (
            <>
              <div className="mt-4 hidden overflow-hidden rounded-xl border md:block"><Table><TableHeader><TableRow><TableHead>Tài khoản</TableHead><TableHead>Nhà cung cấp</TableHead><TableHead>Ngày tạo</TableHead><TableHead>Đăng nhập gần nhất</TableHead><TableHead>Đặt bàn</TableHead><TableHead>No-show</TableHead><TableHead>Trạng thái</TableHead></TableRow></TableHeader><TableBody>{filtered.map((account) => <TableRow key={account.id} className="cursor-pointer" onClick={() => setSelected(account)}><TableCell><div className="flex items-center gap-3"><AccountAvatar account={account} /><div><p className="font-medium">{account.name}</p><p className="text-xs text-muted-foreground">{account.email}</p></div>{account.isAdmin && <Badge variant="outline">Admin</Badge>}</div></TableCell><TableCell>{account.provider}</TableCell><TableCell>{dateTime(account.createdAt)}</TableCell><TableCell>{dateTime(account.lastSignInAt)}</TableCell><TableCell>{account.bookingCount}</TableCell><TableCell>{account.noShowCount}</TableCell><TableCell><Badge variant={account.banned ? "destructive" : "secondary"}>{account.banned ? "Đã khóa" : "Hoạt động"}</Badge></TableCell></TableRow>)}</TableBody></Table></div>
              <div className="mt-4 grid gap-3 md:hidden">{filtered.map((account) => <button type="button" key={account.id} className="rounded-xl border p-4 text-left" onClick={() => setSelected(account)}><div className="flex items-start gap-3"><AccountAvatar account={account} /><div className="min-w-0"><div className="flex flex-wrap gap-2"><p className="font-medium">{account.name}</p>{account.isAdmin && <Badge variant="outline">Admin</Badge>}</div><p className="truncate text-sm text-muted-foreground">{account.email}</p></div></div><div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{account.provider}</span><span>{account.bookingCount} đặt bàn</span><span>{account.noShowCount} no-show</span><Badge variant={account.banned ? "destructive" : "secondary"}>{account.banned ? "Đã khóa" : "Hoạt động"}</Badge></div></button>)}</div>
            </>
          )}
          <div className="mt-5 flex justify-between">{page > 1 ? <Button nativeButton={false} render={<a href={`/admin/tai-khoan?page=${page - 1}${queryString}`} />} variant="outline">Trang trước</Button> : <span />}{hasNextPage && <Button nativeButton={false} render={<a href={`/admin/tai-khoan?page=${page + 1}${queryString}`} />} variant="outline">Trang sau</Button>}</div>
        </>
      )}
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Chi tiết tài khoản</DialogTitle><DialogDescription>Thông tin tài khoản và lịch sử đặt bàn gần đây.</DialogDescription></DialogHeader>{selected && <AccountDetails account={selected} onAction={(action) => { setConfirmation(action); setReason(""); setEmailConfirmation(""); }} />}</DialogContent>
      </Dialog>
      <AlertDialog open={confirmation === "ban" || confirmation === "unban"} onOpenChange={(open) => { if (!open) setConfirmation(null); }}>
        <AlertDialogContent><AlertDialogTitle>{confirmation === "ban" ? "Khóa tài khoản?" : "Mở khóa tài khoản?"}</AlertDialogTitle><AlertDialogDescription>{confirmation === "ban" ? "Tài khoản sẽ không thể đăng nhập trong thời gian bị khóa." : "Tài khoản sẽ có thể đăng nhập lại."}</AlertDialogDescription>{confirmation === "ban" && <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Lý do (không bắt buộc)" />}<div className="flex justify-end gap-2"><AlertDialogCancel render={<Button variant="outline" />}>Hủy</AlertDialogCancel><AlertDialogAction render={<Button variant={confirmation === "ban" ? "destructive" : "default"} disabled={pending} />} onClick={runAction}>{pending ? "Đang xử lý..." : "Xác nhận"}</AlertDialogAction></div></AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmation === "delete"} onOpenChange={(open) => { if (!open) setConfirmation(null); }}>
        <AlertDialogContent><AlertDialogTitle>Xóa tài khoản vĩnh viễn?</AlertDialogTitle><AlertDialogDescription>Các đặt bàn của khách này vẫn được giữ (user_id chuyển thành trống) để phục vụ thống kê và đối soát. Nhập đúng email để xác nhận.</AlertDialogDescription><Input value={emailConfirmation} onChange={(event) => setEmailConfirmation(event.target.value)} placeholder={selected?.email} /><div className="flex justify-end gap-2"><AlertDialogCancel render={<Button variant="outline" />}>Hủy</AlertDialogCancel><AlertDialogAction render={<Button variant="destructive" disabled={emailConfirmation !== selected?.email || pending} />} onClick={runAction}>Xóa</AlertDialogAction></div></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
