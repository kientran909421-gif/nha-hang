"use client";

import { useState } from "react";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Button } from "@/components/ui/button";

type Props = {
  branchId: string;
  branchName: string;
  initialName: string;
  initialEmail: string;
};

export function BookingForm({ branchId, branchName, initialName, initialEmail }: Props) {
  const [values, setValues] = useState({
    reservationDate: "",
    startTime: "",
    partySize: "2",
    customerName: initialName,
    email: initialEmail,
    phone: "",
    note: "",
  });
  const [result, setResult] = useState<{ code: string; guest: boolean } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, branchId, partySize: Number(values.partySize) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Không thể đặt bàn.");
      setResult({ code: body.code, guest: !initialEmail });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể đặt bàn.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-2xl border p-6">
        <h2 className="font-heading text-2xl font-semibold">Đặt bàn thành công</h2>
        <p className="mt-3">Mã đặt bàn của bạn: <strong>{result.code}</strong></p>
        {result.guest && <div className="mt-6 rounded-xl bg-muted p-4"><p className="mb-3">Đăng nhập với Google để lưu lịch sử đặt bàn.</p><GoogleSignInButton next="/tai-khoan" /></div>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-4">
      <p className="text-sm text-muted-foreground">Chi nhánh: {branchName}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>Ngày<input required type="date" value={values.reservationDate} onChange={(e) => update("reservationDate", e.target.value)} className="mt-1 w-full rounded-md border bg-background p-2" /></label>
        <label>Giờ<input required type="time" value={values.startTime} onChange={(e) => update("startTime", e.target.value)} className="mt-1 w-full rounded-md border bg-background p-2" /></label>
        <label>Số khách<input required min="1" max="50" type="number" value={values.partySize} onChange={(e) => update("partySize", e.target.value)} className="mt-1 w-full rounded-md border bg-background p-2" /></label>
        <label>Họ tên<input required value={values.customerName} onChange={(e) => update("customerName", e.target.value)} className="mt-1 w-full rounded-md border bg-background p-2" /></label>
        <label>Email<input required type="email" value={values.email} onChange={(e) => update("email", e.target.value)} className="mt-1 w-full rounded-md border bg-background p-2" /></label>
        <label>Số điện thoại<input required value={values.phone} onChange={(e) => update("phone", e.target.value)} className="mt-1 w-full rounded-md border bg-background p-2" /></label>
      </div>
      <label>Ghi chú<textarea value={values.note} onChange={(e) => update("note", e.target.value)} className="mt-1 min-h-24 w-full rounded-md border bg-background p-2" /></label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>{loading ? "Đang gửi..." : "Xác nhận đặt bàn"}</Button>
    </form>
  );
}
