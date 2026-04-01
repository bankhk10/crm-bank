"use client";

import Image from "next/image";
import { useCallback, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import FloatingLabelInput from "@/components/custom/LoginInput";

interface LoginFormProps {
  callbackUrl?: string | null;
}

export default function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSubmitting) return; // Prevent double submission

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

      try {
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
          remember: remember ? "on" : "off",
          callbackUrl: callbackUrl ?? "/dashboard",
        });

        if (result?.error) {
          if (result.error === "InactiveAccount" || result.error?.includes("InactiveAccount")) {
            setError("บัญชีของคุณไม่ได้อยู่ในสถานะใช้งาน");
          } else {
            setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
          }
          setIsSubmitting(false); // Only stop loading on error
          return;
        }

        router.push(result?.url ?? "/dashboard");
        // Keep loading=true during navigation
      } catch {
        setIsSubmitting(false);
        setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      }
    },
    [router, remember, callbackUrl, isSubmitting]
  );

  const handleAdminLogin = async () => {
    if (process.env.NODE_ENV !== "development") return;
    if (isSubmitting) return; // Prevent double submission

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: "atthapol@gmail.com",
        password: "atthapol@gmail.com",
        remember: "on",
        callbackUrl: callbackUrl ?? "/dashboard",
      });

      if (result?.error) {
        setError("Admin dev login ล้มเหลว");
        setIsSubmitting(false); // Only stop loading on error
        return;
      }

      router.push(result?.url ?? "/dashboard");
      // Keep loading=true during navigation
    } catch {
      setIsSubmitting(false);
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ Admin");
    }
  };

  return (
    <main className="relative flex items-center justify-center w-full min-h-screen overflow-auto bg-[#e0e0e0] py-8">
      {/* ... (Background SVGs) ... */}
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
        />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 300 300"
        className="pointer-events-none absolute bottom-0 left-0 w-[60vw] h-[60vw] md:w-[40vw] md:h-[40vw] z-0 "
      >
        <circle cx="30" cy="250" r="115" fill="#b92626" />
        <circle cx="30" cy="250" r="90" fill="#f7f9fb" />
        <circle cx="30" cy="250" r="70" fill="#98a0ad" />
      </svg>

      {/* 🧭 Login Card */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full px-4 sm:px-6">
        <Card className="p-6 sm:p-8 md:p-10 w-full max-w-md sm:max-w-lg md:max-w-xl rounded-2xl shadow-xl bg-white/95 backdrop-blur-md border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 🧩 Logo + Title */}
            <div className="flex flex-col items-center text-center space-y-3">
              {/* ... (Image and Titles) ... */}
              <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44 xl:w-52 xl:h-52 relative rounded-lg overflow-hidden bg-gray-100 shadow-md">
                <Image
                  src="/images/logo.png"
                  alt="CS ONE"
                  fill
                  priority
                  sizes="(max-width: 768px) 120px, (max-width: 1024px) 160px, 200px"
                  style={{ objectFit: "contain" }}
                />
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-wide">
                ระบบ <span className="text-[#c62828]">CS ONE</span>
              </h2>
            </div>

            <h2 className="text-center font-extrabold tracking-wide text-gray-800 sm:text-2xl mt-4">
              เข้าสู่ระบบ
            </h2>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div>
              <FloatingLabelInput
                id="email"
                name="email"
                type="email"
                label="USERNAME"
                autoComplete="email"
                aria-label="email"
                required
              />
            </div>
            <div>
              <FloatingLabelInput
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                label="PASSWORD"
                autoComplete="current-password"
                aria-label="password"
                required
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-pressed={showPassword}
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                    className="text-gray-600 transition-all duration-200 hover:text-gray-800"
                  >
                    {showPassword ? (
                      <EyeOff className="w-6 h-6 mx-3 mt-1" />
                    ) : (
                      <Eye className="w-6 h-6 mx-3 mt-1" />
                    )}
                  </button>
                }
              />
            </div>

            {/* Remember */}
            <div className="flex items-center justify-between px-4">
              <label className="flex items-center gap-2 text-gray-700">
                <Checkbox
                  checked={remember}
                  onCheckedChange={(val) => setRemember(Boolean(val))}
                  className="rounded border-gray-400 data-[state=checked]:bg-[#c62828] data-[state=checked]:border-[#c62828]"
                />
                <span>บันทึกรหัส</span>
              </label>
            </div>

            {process.env.NODE_ENV === "development" && (
              <div className="flex justify-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={handleAdminLogin}
                  className="w-4/5 sm:w-1/2 h-10 text-sm border-dashed border-red-400 text-red-600 hover:bg-red-50"
                >
                  🔧 Admin Login (DEV)
                </Button>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-center pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-gray-600 hover:bg-gray-800 text-white font-semibold w-4/5 sm:w-1/2 h-11 shadow-md transition-all flex items-center justify-center mt-2"
              >
                {isSubmitting ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
              </Button>
            </div>
          </form>
        </Card>
        <div className="mt-8 text-center text-sm text-gray-500">
          Copyright 2025 รุ่น 1.0.0
        </div>
      </div>
    </main>
  );
}
