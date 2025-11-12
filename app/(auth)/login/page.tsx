import { redirect } from "next/navigation";
import LoginForm from "./login-form";
import { auth } from "@/lib/auth";
import { getDefaultRouteForRole } from "@/lib/rbac";

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
  const callbackUrl = typeof rawCallback === "string" ? rawCallback : undefined;

  if (session?.user) {
    redirect(callbackUrl ?? getDefaultRouteForRole(session.user.role));
  }

  return (
    <section className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 rounded-lg border p-6 shadow-sm">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">Access your CRM workspace.</p>
        </header>
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </section>
  );
}
