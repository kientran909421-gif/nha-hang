import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CustomerLoginPage } from "@/components/customer-login-page";
import { getOptionalUser } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

async function LoginContent({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/tai-khoan";
  if (await getOptionalUser()) {
    redirect(next);
  }
  return <CustomerLoginPage error={params.error === "1"} next={next} />;
}

export default function LoginPage(props: LoginPageProps) {
  return (
    <Suspense fallback={null}>
      <LoginContent {...props} />
    </Suspense>
  );
}
