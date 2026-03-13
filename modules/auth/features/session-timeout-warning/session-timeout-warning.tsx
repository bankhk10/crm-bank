"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * SessionTimeoutWarning
 * 
 * Component สำหรับแจ้งเตือนเมื่อเซสชันกำลังจะหมดอายุ
 * จะแสดง Modal เมื่อเวลาเหลือประมาณ 5 นาที
 */
export function SessionTimeoutWarning() {
  const { data: session, update } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    // ถ้าไม่มี session หรือไม่มีวันหมดอายุ ไม่ต้องทำงาน
    if (!session?.expires) {
      return;
    }

    const interval = setInterval(() => {
      const expiryTime = new Date(session.expires).getTime();
      const now = Date.now();
      const diff = expiryTime - now;

      // แจ้งเตือนเมื่อเหลือเวลา 5 นาที (300,000 ms)
      const warningThreshold = 5 * 60 * 1000;

      if (diff <= warningThreshold && diff > 0) {
        if (!showModal) setShowModal(true);
        setTimeLeft(Math.floor(diff / 1000));
      } else if (diff <= 0) {
        // ถ้าหมดเวลาแล้ว ให้ logout ทันที
        setShowModal(false);
        signOut({ callbackUrl: "/login" });
      } else {
        // ถ้าเวลายังเหลือมากกว่า 5 นาที (เช่น หลังกดต่ออายุ) ให้ปิด modal
        if (showModal) setShowModal(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.expires, showModal]);

  const handleContinue = async () => {
    try {
      // เรียก update เพื่อต่ออายุ session (JWT)
      await update();
      setShowModal(false);
    } catch (error) {
      console.error("Failed to update session:", error);
      // ถ้าต่ออายุไม่สำเร็จ อาจจะหมดอายุไปแล้ว ให้ logout
      signOut({ callbackUrl: "/login" });
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AlertDialog open={showModal} onOpenChange={setShowModal}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">เซสชันกำลังจะหมดอายุ</AlertDialogTitle>
          <AlertDialogDescription>
            ดูเหมือนว่าคุณจะไม่ได้ใช้งานระบบนานเกินไป เซสชันของคุณกำลังจะหมดอายุในอีก{" "}
            <span className="font-bold text-foreground">
              {timeLeft !== null ? formatTime(timeLeft) : "5:00"}
            </span>{" "}
            นาที คุณต้องการใช้งานต่อหรือไม่?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleLogout} className="border-red-200 text-red-600 hover:bg-red-50">
            ออกจากระบบ
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleContinue} className="bg-[#b92626] hover:bg-[#a02020]">
            ใช้งานต่อ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
