"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ImageOff,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface LightboxImage {
  id?: string;
  url: string;
  name?: string;
}

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  images: LightboxImage[];
  initialIndex?: number;
}

export function ImageLightboxModal({
  isOpen,
  onClose,
  title,
  images = [],
  initialIndex = 0,
}: ImageLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Adjust state during render when isOpen or initialIndex changes
  const [prevProps, setPrevProps] = useState({ isOpen, initialIndex });

  if (prevProps.isOpen !== isOpen || prevProps.initialIndex !== initialIndex) {
    setPrevProps({ isOpen, initialIndex });
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)));
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }

  // Reset zoom & pan when switching images
  const resetZoomAndPan = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
    resetZoomAndPan();
  }, [images.length, resetZoomAndPan]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    resetZoomAndPan();
  }, [images.length, resetZoomAndPan]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleDoubleClick = () => {
    if (zoom > 1) {
      resetZoomAndPan();
    } else {
      setZoom(2.5);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "0") {
        resetZoomAndPan();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose, resetZoomAndPan]);

  // Mouse pan/drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      e.preventDefault();
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    setZoom((prev) => {
      const next = Math.min(Math.max(1, prev + delta), 5);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  // Touch pan handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom > 1 && e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && zoom > 1 && e.touches.length === 1) {
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];
  const hasError = currentImage ? imageErrors[currentImage.url] : false;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[98vw] md:max-w-[94vw] w-full h-[95vh] p-0 bg-slate-950/95 backdrop-blur-xl border-slate-800/80 shadow-2xl flex flex-col items-center justify-between outline-none overflow-hidden [&>button]:hidden select-none"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">
          {title || "Image Lightbox Viewer"}
        </DialogTitle>

        {/* ─── Top Header Bar ─── */}
        <div className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 bg-black/40 border-b border-white/10 z-50 shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <h3 className="text-white text-xs sm:text-sm md:text-base font-bold truncate">
              {title || currentImage.name || "ดูรูปภาพ"}
            </h3>
            {images.length > 1 && (
              <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[11px] font-semibold border border-white/20">
                รูปที่ {currentIndex + 1} จาก {images.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white/10 text-white hover:bg-white/25 hover:text-white transition-all border border-white/20"
              aria-label="ปิดหน้าต่างดูรูปภาพ"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>

        {/* ─── Main Image Stage ─── */}
        <div
          className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden p-2 sm:p-4"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
          style={{
            cursor:
              zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
          }}
        >
          {/* Navigation Button: Previous */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-3 sm:left-6 z-40 p-2.5 sm:p-3.5 rounded-2xl bg-black/50 text-white hover:bg-black/80 transition-all backdrop-blur-md border border-white/20 hover:scale-105 shadow-xl"
              aria-label="รูปก่อนหน้า"
            >
              <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
          )}

          {/* Navigation Button: Next */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-3 sm:right-6 z-40 p-2.5 sm:p-3.5 rounded-2xl bg-black/50 text-white hover:bg-black/80 transition-all backdrop-blur-md border border-white/20 hover:scale-105 shadow-xl"
              aria-label="รูปถัดไป"
            >
              <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
          )}

          {/* Image Display / Fallback */}
          {hasError ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 max-w-md bg-white/5 rounded-2xl border border-white/10">
              <ImageOff className="w-12 h-12 mb-3 text-slate-500" />
              <p className="text-sm font-semibold text-slate-200 mb-1">
                ไม่สามารถโหลดรูปภาพได้
              </p>
              <p className="text-xs text-slate-400 break-all">
                {currentImage.url}
              </p>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentImage.url}
              alt={currentImage.name || "รูปถ่าย"}
              className="max-w-full max-h-[72vh] sm:max-h-[75vh] object-contain select-none transition-transform duration-150 ease-out"
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transformOrigin: "center center",
              }}
              draggable={false}
              onError={() =>
                setImageErrors((prev) => ({
                  ...prev,
                  [currentImage.url]: true,
                }))
              }
            />
          )}

          {/* Zoom Level Indicator */}
          {zoom > 1 && (
            <div className="absolute top-4 left-4 z-40 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-lg">
              🔍 {Math.round(zoom * 100)}%
            </div>
          )}
        </div>

        {/* ─── Bottom Floating Toolbar ─── */}
        <div className="w-full flex flex-col items-center gap-2 pb-3 pt-2 bg-black/40 border-t border-white/10 z-50 shrink-0">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="h-7 w-7 text-white hover:bg-white/20 hover:text-white disabled:opacity-30"
              title="ย่อรูป (-)"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>

            <span className="text-[11px] sm:text-xs font-bold text-white min-w-[48px] text-center">
              {Math.round(zoom * 100)}%
            </span>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleZoomIn}
              disabled={zoom >= 5}
              className="h-7 w-7 text-white hover:bg-white/20 hover:text-white disabled:opacity-30"
              title="ขยายรูป (+)"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>

            {zoom > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetZoomAndPan}
                className="h-7 px-2 text-[11px] font-medium text-white hover:bg-white/20 hover:text-white gap-1 ml-1"
                title="รีเซ็ตขนาด (0)"
              >
                <RotateCcw className="h-3 w-3" />
                รีเซ็ต
              </Button>
            )}
          </div>

          {/* Desktop Hint */}
          <p className="hidden md:block text-[11px] text-white/60 font-medium">
            🖱️ ล้อเมาส์เพื่อซูม • ลากเมาส์เพื่อเลื่อนรูป • ดับเบิลคลิกเพื่อรีเซ็ต
          </p>

          {/* Thumbnail Navigation Strip (If multiple images) */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 max-w-full overflow-x-auto px-4 py-1">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    resetZoomAndPan();
                  }}
                  className={`relative shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    currentIndex === idx
                      ? "border-amber-400 scale-105 shadow-md"
                      : "border-white/20 opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.name || `รูปที่ ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
