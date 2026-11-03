export function AdminForbidden() {
  return (
    <section className="rounded-2xl border border-border bg-background p-8 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-destructive">403</p>
      <h1 className="mt-3 font-heading text-3xl font-semibold">Bạn không có quyền truy cập</h1>
      <p className="mt-3 text-muted-foreground">Vui lòng liên hệ chủ nhà hàng nếu bạn cần quyền này.</p>
    </section>
  );
}
