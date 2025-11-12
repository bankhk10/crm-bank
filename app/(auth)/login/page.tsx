import { redirect } from "next/navigation";
import LoginForm from "./login-form";
import { auth } from "@/lib/auth";
import { getDefaultRouteForRole } from "@/lib/rbac";
import { safeRedirect } from "@/lib/safe-redirect";

interface LoginPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  // In Next.js app router `searchParams` can be a Promise. Await it when necessary
  // before accessing its properties to avoid the sync dynamic APIs error.
  const resolvedSearchParams =
    // if it's a thenable (Promise-like), await it; otherwise use as-is
    typeof (searchParams as any)?.then === "function"
      ? await (searchParams as any)
      : searchParams;

  const rawCallback = resolvedSearchParams?.callbackUrl;
  const callbackUrl = safeRedirect(typeof rawCallback === "string" ? rawCallback : undefined, undefined);

  if (session?.user) {
    redirect(callbackUrl ?? getDefaultRouteForRole(session.user.role));
  }

  // Render the LoginForm directly so it can control full-viewport layout
  return <LoginForm callbackUrl={callbackUrl} />;
}
