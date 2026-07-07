"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LoginAnnouncementItem } from "../../infrastructure/login-announcement.repository";

interface LoginAnnouncementPopupProps {
  items: LoginAnnouncementItem[];
  previewMode?: boolean;
  onPreviewClose?: () => void;
}

export default function LoginAnnouncementPopup({
  items,
  previewMode = false,
  onPreviewClose,
}: LoginAnnouncementPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasSeen, setHasSeen] = useState(!previewMode); // If previewMode, default to false so it shows

  useEffect(() => {
    if (previewMode) {
      setHasSeen(false);
      setCurrentIndex(0);
      return;
    }
    // Only show if not seen in the current browser session
    const seen = sessionStorage.getItem("login_announcement_seen");
    if (!seen) {
      setHasSeen(false);
    }
  }, [previewMode, items]);

  // No popup when there are no items, all have been shown, or already seen
  if (items.length === 0 || currentIndex >= items.length || hasSeen) return null;

  const current = items[currentIndex];
  const isLast = currentIndex === items.length - 1;

  const handleClose = () => {
    if (previewMode) {
      onPreviewClose?.();
    } else {
      sessionStorage.setItem("login_announcement_seen", "true");
      setHasSeen(true);
    }
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= items.length) {
      handleClose();
    } else {
      setCurrentIndex(nextIndex);
    }
  };

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
