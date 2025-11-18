"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";

type Company = {
  id: string;
  name: string;
  shortName?: string | null;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
  addressLine?: string | null;
  province?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  postalCode?: string | null;
  industry?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

export default function CompanyDetailPage() {
  const { companyId } = useParams() as { companyId: string };
  const router = useRouter();
  const { hasPermission, allowed, isLoading } = usePermission("menu.companies");
  const canView = !isLoading && allowed;

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/companies/${companyId}`);
        if (!res.ok) throw new Error("Failed to load company");
        const json = await res.json();
        if (mounted) setCompany(json || null);
      } catch (e: any) {
        setError(String(e?.message ?? e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [companyId]);

  if (!canView) {
    return (
      <Alert variant="destructive">
        <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลบริษัท</AlertDescription>
      </Alert>
    );
  }

  return (
    <section className="space-y-6">
      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 w-2/5 bg-slate-200 rounded" />
              <div className="mt-4 h-4 w-3/5 bg-slate-200 rounded" />
            </div>
          ) : company ? (
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-semibold">{company.name}</h1>
                  {company.shortName ? <div className="text-sm text-muted-foreground">{company.shortName}</div> : null}
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/companies/${company.id}/edit`}>
                    <Button>แก้ไข</Button>
                  </Link>
                  {hasPermission("company.delete") ? (
                    <Button
                      variant="destructive"
                      disabled={deleting}
                      onClick={async () => {
                        if (!confirm("คุณต้องการลบบริษัทนี้หรือไม่?")) return;
                        setDeleting(true);
                        try {
                          const res = await fetch(`/api/companies/${company.id}`, { method: "DELETE" });
                          if (!res.ok) throw new Error("Delete failed");
                          router.push("/companies");
                        } catch (e: any) {
                          setError(String(e?.message ?? e));
                        } finally {
                          setDeleting(false);
                        }
                      }}
                    >
                      {deleting ? "กำลังลบ..." : "ลบบริษัท"}
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">อีเมล</h4>
                  <div className="mt-1 text-sm">{company.email ?? "-"}</div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">โทรศัพท์</h4>
                  <div className="mt-1 text-sm">{company.phone ?? "-"}</div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">เลขประจำตัวผู้เสียภาษี</h4>
                  <div className="mt-1 text-sm">{company.taxId ?? "-"}</div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">สถานะ</h4>
                  <div className="mt-1 text-sm">{company.status ?? "-"}</div>
                </div>

                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">ที่อยู่</h4>
                  <div className="mt-1 text-sm">
                    {company.addressLine ? <div>{company.addressLine}</div> : null}
                    {(company.subdistrict || company.district || company.province) ? (
                      <div className="text-sm text-muted-foreground mt-1">{[company.subdistrict, company.district, company.province].filter(Boolean).join(", ")}{company.postalCode ? ` ${company.postalCode}` : ""}</div>
                    ) : null}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">สร้างเมื่อ</h4>
                  <div className="mt-1 text-sm">{company.createdAt ? new Date(company.createdAt).toLocaleString() : "-"}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">ไม่พบข้อมูลบริษัท</div>
          )}
        </div>
      </div>
    </section>
  );
}

