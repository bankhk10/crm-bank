import { redirect } from "next/navigation";

export default function RegisterPage() {
  // Registration via public page is disabled. Redirect to login.
  redirect("/login");
}
