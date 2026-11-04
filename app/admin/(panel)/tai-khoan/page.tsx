import "server-only";

import { Suspense } from "react";
import { getCurrentStaff } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { isMasterEmail } from "@/lib/admin-email";
import { AdminForbidden } from "@/components/admin-forbidden";
import { supabaseAdmin } from "@/lib/supabase/server";
import { AdminAccountsTable, type AdminAccount, type AdminAuditLog } from "@/components/admin-accounts-table";

type Props = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

function normalized(value: string) {
  return value.trim().toLocaleLowerCase("vi");
}

async function AccountsContent({ searchParams }: Props) {
  const staff = await getCurrentStaff();
  if (!staff || !hasPermission(staff.role, "customers.view")) {
    return <AdminForbidden />;
  }
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const query = params.q?.trim() ?? "";
  const { data: userPage, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
    page,
    perPage: 50,
  });

  if (usersError) {
    throw new Error(`Không thể đọc danh sách tài khoản: ${usersError.message}`);
  }

  const { data: auditRows, error: auditError } = staff.role === "master" || staff.role === "owner" || staff.role === "manager"
    ? await supabaseAdmin
    .from("admin_audit_log")
    .select("id, created_at, actor_email, action, target_email, details")
    .order("created_at", { ascending: false })
    .limit(50)
    : { data: [], error: null };
  if (auditError) {
    throw new Error(`Không thể đọc nhật ký quản trị: ${auditError.message}`);
  }

  const users = userPage.users;
  const userIds = users.map((user) => user.id);
  const { data: reservations, error: reservationsError } = userIds.length
    ? await supabaseAdmin
        .from("reservations")
        .select("user_id, code, reservation_date, start_time, party_size, status")
        .in("user_id", userIds)
        .order("reservation_date", { ascending: false })
        .order("start_time", { ascending: false })
    : { data: [], error: null };

  if (reservationsError) {
    throw new Error(`Không thể đọc thống kê đặt bàn: ${reservationsError.message}`);
  }

  const reservationsByUser = new Map<string, AdminAccount["reservations"]>();
  for (const reservation of reservations ?? []) {
    if (!reservation.user_id) continue;
    const current = reservationsByUser.get(reservation.user_id) ?? [];
    current.push({
      code: String(reservation.code),
      reservationDate: String(reservation.reservation_date),
      startTime: String(reservation.start_time),
      partySize: Number(reservation.party_size),
      status: String(reservation.status),
    });
    reservationsByUser.set(reservation.user_id, current);
  }

  const accounts = users
    .filter((user) => {
      if (!query) return true;
      const name = String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "");
      return normalized(user.email ?? "").includes(normalized(query)) ||
        normalized(name).includes(normalized(query));
    })
    .map<AdminAccount>((user) => {
      const accountReservations = reservationsByUser.get(user.id) ?? [];
      const provider = user.app_metadata?.provider === "google" ||
        user.identities?.some((identity) => identity.provider === "google")
        ? "Google"
        : "Email";
      return {
        id: user.id,
        name: String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "Chưa cập nhật"),
        email: user.email ?? "Không có email",
        avatarUrl: String(user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? ""),
        provider,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
        bookingCount: accountReservations.length,
        noShowCount: accountReservations.filter((item) => item.status === "no_show").length,
        banned: Boolean(user.banned_until && new Date(user.banned_until).getTime() > Date.now()),
        isAdmin: isMasterEmail(user.email ?? ""),
        reservations: accountReservations.slice(0, 10),
      };
    });

  return (
    <section>
      <p className="text-sm text-muted-foreground">Quản trị</p>
      <h1 className="mt-2 font-heading text-4xl font-semibold">Tài khoản</h1>
      <p className="mt-3 text-muted-foreground">Quản lý tài khoản khách hàng và lịch sử đặt bàn.</p>
      <AdminAccountsTable
        accounts={accounts}
        page={page}
        hasNextPage={userPage.nextPage != null}
        query={query}
        auditLogs={(auditRows ?? []).map((row) => ({
          id: String(row.id),
          createdAt: String(row.created_at),
          actorEmail: String(row.actor_email),
          action: String(row.action),
          targetEmail: String(row.target_email),
          details: row.details ? String(row.details) : null,
        }))}
      />
    </section>
  );
}

export default function AdminAccountsPage(props: Props) {
  return (
    <Suspense fallback={<div className="min-h-96" />}>
      <AccountsContent {...props} />
    </Suspense>
  );
}
