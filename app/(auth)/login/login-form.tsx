"use client";

import Image from "next/image";
import { useCallback, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const email = String(formData.get("email") ?? "")
        .trim()
        .toLowerCase();
      const password = String(formData.get("password") ?? "");

      if (!email || !password) {
        setError("กรุณากรอกอีเมลและรหัสผ่าน");
        return;
      }

      setError(null);
      setIsSubmitting(true);

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        remember: remember ? "on" : "off",
        callbackUrl: "/dashboard",
      });

      setIsSubmitting(false);

      if (result?.error) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        return;
      }

      router.push(result?.url ?? "/dashboard");
    },
    [router, remember]
  );

  return (
    <main className="relative flex items-center justify-center w-full min-h-screen overflow-auto bg-[#f7f9fb] py-8">
      {/* 🔴 Background Top-Right (project-wide style: full inset background, subtle) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 600"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <path
          d="M250,0 C300,100 600,100 700,200 C800,300 450,500 800,600 L800,0 Z"
          fill="#b92626"
          opacity="0.3"
        />
      </svg>

      {/* 🔴 Background Bottom-Left */}
      {/* Bottom-left decorative SVG (smaller on mobile, subtle) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 300 300"
        className="pointer-events-none absolute bottom-0 left-0 w-[60vw] h-[60vw] md:w-[40vw] md:h-[40vw] z-0 opacity-80"
      >
        <circle cx="50" cy="250" r="150" fill="#b92626" />
        <circle cx="50" cy="250" r="120" fill="#f7f9fb" />
        <circle cx="50" cy="250" r="100" fill="#98a0ad" />
      </svg>

      {/* 🧭 Login Card */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full px-4 sm:px-6">
        <Card className="p-6 sm:p-8 md:p-10 w-full max-w-md sm:max-w-lg md:max-w-xl rounded-2xl shadow-xl bg-white/95 backdrop-blur-md border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 🧩 Logo + Title */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 relative rounded-lg overflow-hidden bg-gray-100 shadow-md">
                <Image
                  src="/images/logo.png"
                  alt="CS ONE"
                  fill
                  priority
                  sizes="(max-width: 768px) 120px, (max-width: 1024px) 160px, 200px"
                  style={{ objectFit: "contain" }}
                />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide">
                ระบบ <span className="text-[#c62828]">CS ONE</span>
              </h2>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                Smart Crop Smart Solutions
              </p>
            </div>

            <h3 className="text-center text-base sm:text-lg font-semibold mt-4">
              เข้าสู่ระบบ
            </h3>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 👤 Email */}
            <div>
              <label htmlFor="email" className="text-xs font-medium text-gray-700">
                USERNAME
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                aria-label="email"
                required
                className="mt-1 rounded-full h-11 text-[15px] bg-white border-gray-300 focus-visible:ring-[#c62828] w-full"
              />
            </div>

            {/* 🔒 Password */}
            <div>
              <label htmlFor="password" className="text-xs font-medium text-gray-700">
                PASSWORD
              </label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  aria-label="password"
                  required
                  className="rounded-full h-11 pr-12 text-[15px] bg-white border-gray-300 focus-visible:ring-[#c62828] w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-600 transition-all duration-200 hover:text-gray-800"
                >
                  <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                    className="h-5 w-5"
                  />
                </button>
              </div>
            </div>

            {/* Remember */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <Checkbox
                  checked={remember}
                  onCheckedChange={(val) => setRemember(Boolean(val))}
                  className="rounded border-gray-400 data-[state=checked]:bg-[#c62828] data-[state=checked]:border-[#c62828]"
                />
                <span>บันทึกรหัส</span>
              </label>
            </div>

            {/* Submit */}
            <div className="flex justify-center pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-gray-600 hover:bg-gray-800 text-white font-semibold w-full sm:w-3/5 h-11 shadow-md transition-all"
              >
                {isSubmitting ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
