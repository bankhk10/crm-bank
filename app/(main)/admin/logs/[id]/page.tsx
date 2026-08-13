import { Suspense } from "react";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { getLogDetailAction } from "@/modules/logs/server/actions";
import { LogDetailView } from "@/modules/logs";

export const metadata = {
  title: "Log Detail | Admin",
  description: "View detailed system audit log entry and diff comparison",
};

interface LogDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}

export default async function LogDetailPage({
  params,
  searchParams,
}: LogDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin =
    session.user.roles?.includes("administrator") ||
    session.user.roles?.includes("admin") ||
    session.user.permissionKeys?.includes("logs.view");

  if (!isAdmin) {
    redirect("/sales");
  }

  const { id } = await params;
  const { type } = await searchParams;

  const result = await getLogDetailAction(id, type);

  if (!result || !result.log) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-2xl space-y-6">
        <Link href="/admin/logs">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            กลับไปหน้า Log Viewer
          </Button>
        </Link>

        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              ไม่พบข้อมูล Log
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ไม่พบรายการ Log ที่มี ID <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-xs">{id}</code> ในระบบ หรือข้อมูลอาจถูกย้าย/ลบแล้ว
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <Suspense fallback={<LogDetailSkeleton />}>
        <LogDetailView log={result.log} type={result.type} />
      </Suspense>
    </div>
  );
}

function LogDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl" />
    </div>
  );
}
