"use client";

import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path fill="#4285F4" d="M21.35 12.27c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.22Z" />
      <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.29v2.53A9.74 9.74 0 0 0 12 21.75Z" />
      <path fill="#FBBC05" d="M6.53 13.83a5.85 5.85 0 0 1 0-3.66V7.64H3.29a9.75 9.75 0 0 0 0 8.72l3.24-2.53Z" />
      <path fill="#EA4335" d="M12 6.14c1.43 0 2.72.49 3.73 1.46l2.8-2.8C16.84 3.2 14.63 2.25 12 2.25a9.74 9.74 0 0 0-8.71 5.39l3.24 2.53c.77-2.31 2.93-4.03 5.47-4.03Z" />
    </svg>
  );
}

export function GoogleSignInButton({ next = "/" }: { next?: string }) {
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);
    try {
      const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) toast.error("Không thể đăng nhập bằng Google. Vui lòng thử lại.");
    } catch {
      toast.error("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" variant="outline" className="w-full" disabled={pending} onClick={signIn}>
      <GoogleLogo />
      {pending ? "Đang chuyển tới Google..." : "Đăng nhập với Google"}
    </Button>
  );
}
