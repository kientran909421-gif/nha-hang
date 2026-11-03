import { CustomerAuthMenu } from "@/components/customer-auth-menu";
import { getOptionalUser, isAdmin } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export async function HeaderAuth({ mobile = false }: { mobile?: boolean }) {
  const user = await getOptionalUser();
  if (!user) {
    return (
      <Button
        nativeButton={false}
        render={<Link href="/dang-nhap" />}
        variant="outline"
        size="sm"
      >
        Đăng nhập
      </Button>
    );
  }
  return <CustomerAuthMenu user={user} isAdmin={await isAdmin()} mobile={mobile} />;
}
