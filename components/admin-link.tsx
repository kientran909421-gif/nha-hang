import Link from "next/link";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isAdmin } from "@/lib/auth";

export async function AdminLink() {
  if (!(await isAdmin())) {
    return null;
  }

  return (
    <Button
      nativeButton={false}
      render={<Link href="/admin" />}
      variant="ghost"
      size="sm"
    >
      <Settings aria-hidden="true" />
      Quản trị
    </Button>
  );
}
