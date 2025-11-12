"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LoginFormProps {
  callbackUrl?: string;
}

export default function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);

      if (!email.trim() || !password) {
        setError("กรุณากรอกอีเมลและรหัสผ่าน");
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await signIn("credentials", {
          redirect: false,
          email: email.trim().toLowerCase(),
          password,
          remember: remember ? "on" : "off",
          callbackUrl: callbackUrl ?? "/dashboard/aggregateReport",
        });

        if (result?.error) {
          setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
          return;
        }

        router.push(result?.url ?? callbackUrl ?? "/dashboard/aggregateReport");
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, remember, router, callbackUrl]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative overflow-hidden">
      {/* SVG background top-right */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 800 600"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M250,0 C300,100 600,100 700,200 C800,300 450,500 800,600 L800,0 Z" fill="#b92626" />
      </svg>

      {/* Bottom-left circles */}
      <div className="absolute -left-40 -bottom-40 w-96 h-96 rounded-full bg-[#b92626] flex items-center justify-center">
        <div className="w-72 h-72 rounded-full bg-white flex items-center justify-center">
          <div className="w-40 h-40 rounded-full bg-gray-400"></div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-36 h-36 relative rounded-md overflow-hidden bg-gray-100 shadow-md">
                <Image src="/images/logo.png" alt="logo" fill sizes="(max-width: 800px) 140px, 180px" style={{ objectFit: "contain" }} />
              </div>
              <h2 className="mt-3 text-2xl font-extrabold tracking-wide uppercase">
                ระบบ <span className="text-[#c62828]">CS ONE</span>
              </h2>
              <p className="text-sm text-slate-600">Smart Crop Smart Solutions</p>
            </div>

            <h3 className="text-center text-lg font-semibold mt-2">เข้าสู่ระบบ</h3>

            {error ? <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded px-3 py-2">{error}</div> : null}

            <div>
              <label className="text-xs font-medium text-slate-600">USERNAME</label>
              <Input
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                name="email"
                type="email"
                required
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">PASSWORD</label>
              <div className="relative mt-1">
                <Input
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 text-sm px-2 py-1 rounded focus:outline-none"
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4" />
                <span>บันทึกรหัส</span>
              </label>
            </div>

            <div className="flex justify-center pt-2">
              <Button type="submit" className="w-full md:w-1/2" disabled={isSubmitting}>
                {isSubmitting ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
