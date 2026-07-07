"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LoginAnnouncementItem } from "../../infrastructure/login-announcement.repository";

interface LoginAnnouncementPopupProps {
  items: LoginAnnouncementItem[];
}

export default function LoginAnnouncementPopup({
  items,
}: LoginAnnouncementPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // No popup when there are no items or all have been shown
  if (items.length === 0 || currentIndex >= items.length) return null;

  const current = items[currentIndex];
  const isLast = currentIndex === items.length - 1;

  const handleNext = () => setCurrentIndex((prev) => prev + 1);

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal
      aria-label="ประกาศจากระบบ"
    >
      {/* Modal card */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in-scale">
        {/* Close button (same as Next for UX consistency) */}
        <button
          onClick={handleNext}
          aria-label="ปิด popup"
          className="absolute top-3 right-3 z-10 rounded-full bg-black/40 text-white p-1.5 hover:bg-black/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Counter badge (only when multiple slides) */}
        {items.length > 1 && (
          <div className="absolute top-3 left-3 z-10 bg-black/40 text-white text-xs rounded-full px-2.5 py-0.5">
            {currentIndex + 1} / {items.length}
          </div>
        )}

        {/* Image area */}
        <div className="relative w-full aspect-video bg-gray-100">
          <Image
            src={current.imageUrl}
            alt={current.title ?? `ประกาศ ${currentIndex + 1}`}
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Footer */}
        <div className="p-4 flex justify-end">
          <Button
            id="announcement-popup-next-btn"
            onClick={handleNext}
            className="bg-[#c62828] hover:bg-[#b71c1c] text-white px-8"
          >
            {isLast ? "ปิด" : "ถัดไป"}
          </Button>
        </div>
      </div>
    </div>
  );
}
