import { redirect } from "next/navigation";
import RegisterForm from "./register-form";
import { auth } from "@/lib/auth";
import { getDefaultRouteForRole } from "@/lib/rbac";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect(getDefaultRouteForRole(session.user.role));
  }

  return (
    <section className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 rounded-lg border p-6 shadow-sm">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="text-sm text-muted-foreground">Join the CRM and start managing your pipeline.</p>
        </header>
        <RegisterForm />
      </div>
    </section>
  );
}
