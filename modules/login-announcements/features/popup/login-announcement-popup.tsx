"use client";

import { useState, useEffect } from "react";
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
      {/* Content wrapper without background frame */}
      <div className="relative flex flex-col items-center w-full max-w-3xl animate-in zoom-in-95 duration-300">
        

        {/* Counter badge (only when multiple slides) */}
        {items.length > 1 && (
          <div className="absolute top-3 left-3 z-20 bg-black/60 border border-white/20 backdrop-blur-md text-white text-sm rounded-full px-3 py-1 shadow-lg">
            {currentIndex + 1} / {items.length}
          </div>
        )}

        {/* Image (Responsive, no fixed aspect ratio wrapper) */}
        <img
          src={current.imageUrl}
          alt={current.title ?? `ประกาศ ${currentIndex + 1}`}
          className="max-w-full max-h-[75vh] w-auto h-auto rounded-xl shadow-2xl object-contain cursor-pointer"
          onClick={handleNext}
        />

        {/* Next / Close Button */}
        <div className="mt-6 w-full flex justify-center">
          <Button
            id="announcement-popup-next-btn"
            onClick={handleNext}
            className="bg-[#c62828] hover:bg-[#b71c1c] text-white px-10 py-6 text-lg rounded-full shadow-xl shadow-red-900/30 transition-transform active:scale-95"
          >
            {isLast ? "รับทราบ" : "ถัดไป"}
          </Button>
        </div>
      </div>
    </div>
  );
}
