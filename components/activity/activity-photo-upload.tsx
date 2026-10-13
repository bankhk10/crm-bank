"use client";

import React, { useMemo, useCallback, useState } from "react";
import { Camera, Eye, X, ImageIcon } from "lucide-react";
import GalleryUpload from "@/components/custom/gallery-upload";
import { cn } from "@/lib/utils";
import {
  convertToFileMetadata,
  filesWithPreviewToImageFiles,
  isImageFilesEqual,
} from "@/modules/activity-plans/features/shared/actual-view/utils/image-uploader";
import type { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type { ImageFile };

export interface ActivityPhotoUploadProps {
  /**
   * Title of the photo upload section (e.g. "รูปแปลงเกษตรกร", "รูปถ่ายสภาพชั้นวาง")
   */
  title?: string;
  /**
   * Subtitle / description / instructions
   */
  description?: string;
  /**
   * Current list of image files
   */
  images?: ImageFile[];
  /**
   * Callback when image list changes
   */
  onImagesChange?: (images: ImageFile[]) => void;
  /**
   * Maximum allowed files (default: 5)
   */
  maxFiles?: number;
  /**
   * Maximum file size in bytes (default: 20MB)
   */
  maxSize?: number;
  /**
   * Accent color theme: 'emerald' | 'blue' | 'purple' | 'amber' | 'slate' (default: 'emerald')
   */
  accentColor?: "emerald" | "blue" | "purple" | "amber" | "slate";
  /**
   * Custom icon element (default: <Camera className="w-4 h-4" />)
   */
  icon?: React.ReactNode;
  /**
   * Read-only mode
   */
  readonly?: boolean;
  disabled?: boolean;
  className?: string;
  /**
   * Target aspect ratio or size for automatic cropping (optional)
   */
  targetSize?: { width: number; height: number };
}

const COLOR_THEMES = {
  emerald: {
    container: "bg-emerald-50/20 border-emerald-200/70",
    headerBorder: "border-emerald-100",
    iconBox: "bg-emerald-100 text-emerald-700 border-emerald-200",
    title: "text-emerald-950",
    description: "text-emerald-700/80",
    badge: "bg-emerald-100/80 text-emerald-800 border-emerald-200",
  },
  blue: {
    container: "bg-blue-50/20 border-blue-200/70",
    headerBorder: "border-blue-100",
    iconBox: "bg-blue-100 text-blue-700 border-blue-200",
    title: "text-blue-950",
    description: "text-blue-700/80",
    badge: "bg-blue-100/80 text-blue-800 border-blue-200",
  },
  purple: {
    container: "bg-purple-50/20 border-purple-200/70",
    headerBorder: "border-purple-100",
    iconBox: "bg-purple-100 text-purple-700 border-purple-200",
    title: "text-purple-950",
    description: "text-purple-700/80",
    badge: "bg-purple-100/80 text-purple-800 border-purple-200",
  },
  amber: {
    container: "bg-amber-50/20 border-amber-200/70",
    headerBorder: "border-amber-100",
    iconBox: "bg-amber-100 text-amber-700 border-amber-200",
    title: "text-amber-950",
    description: "text-amber-700/80",
    badge: "bg-amber-100/80 text-amber-800 border-amber-200",
  },
  slate: {
    container: "bg-slate-50/50 border-slate-200",
    headerBorder: "border-slate-100",
    iconBox: "bg-slate-100 text-slate-700 border-slate-200",
    title: "text-slate-900",
    description: "text-slate-500",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

export function ActivityPhotoUpload({
  title = "รูปภาพประกอบกิจกรรม",
  description = "อัปโหลดรูปภาพที่เกี่ยวข้องกับการปฏิบัติงานจริง",
  images = [],
  onImagesChange,
  maxFiles = 5,
  maxSize = 20 * 1024 * 1024,
  accentColor = "emerald",
  icon,
  readonly = false,
  disabled = false,
  className,
  targetSize,
}: ActivityPhotoUploadProps) {
  const isReadonly = readonly || disabled;
  const theme = COLOR_THEMES[accentColor] || COLOR_THEMES.emerald;

  // Selected image for zoom preview dialog
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  // Memoize initial files for GalleryUpload to prevent re-instantiation loops
  const initialFiles = useMemo(() => {
    return convertToFileMetadata(images);
  }, [images]);

  const handleFilesChange = useCallback(
    (files: any[]) => {
      if (isReadonly || !onImagesChange) return;
      const converted = filesWithPreviewToImageFiles(files);
      if (!isImageFilesEqual(images, converted)) {
        onImagesChange(converted);
      }
    },
    [isReadonly, onImagesChange, images],
  );

  return (
    <div
      className={cn(
        "border rounded-2xl p-4 sm:p-5 space-y-3.5 transition-all shadow-xs",
        theme.container,
        className,
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between border-b pb-2.5",
          theme.headerBorder,
        )}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center border shadow-2xs shrink-0",
              theme.iconBox,
            )}
          >
            {icon || <Camera className="w-4 h-4" />}
          </div>
          <div>
            <h4 className={cn("text-xs sm:text-sm font-bold", theme.title)}>
              {title}
            </h4>
            {description && (
              <p className={cn("text-[11px] leading-tight mt-0.5", theme.description)}>
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Count Badge */}
        <span
          className={cn(
            "text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs shrink-0",
            theme.badge,
          )}
        >
          {images.length} / {maxFiles} รูป
        </span>
      </div>

      {/* Main Content: Readonly Gallery Grid vs Interactive GalleryUpload */}
      {isReadonly ? (
        images.length === 0 ? (
          <div className="py-8 px-4 rounded-xl border border-dashed border-slate-200 bg-white/50 text-center flex flex-col items-center justify-center gap-1.5">
            <ImageIcon className="w-8 h-8 text-slate-300" />
            <p className="text-xs text-slate-400 font-medium">ไม่มีรูปภาพประกอบ</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-1">
            {images.map((img, idx) => (
              <div
                key={img.id || idx}
                onClick={() => setSelectedPreviewImage(img.url)}
                className="group relative rounded-xl border border-slate-200/80 bg-white overflow-hidden aspect-square flex items-center justify-center shadow-xs cursor-pointer hover:border-slate-300 transition-all"
              >
                <img
                  src={img.url}
                  alt={img.name || `photo-${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Eye className="w-5 h-5 drop-shadow-md" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <GalleryUpload
          maxFiles={maxFiles}
          maxSize={maxSize}
          accept="image/*"
          multiple={true}
          initialFiles={initialFiles}
          onFilesChange={handleFilesChange}
          targetSize={targetSize}
          disabled={isReadonly}
        />
      )}

      {/* Zoom Dialog Modal */}
      <Dialog
        open={Boolean(selectedPreviewImage)}
        onOpenChange={(open) => !open && setSelectedPreviewImage(null)}
      >
        <DialogContent className="max-w-3xl p-2 bg-slate-950/95 border-slate-800 text-white rounded-2xl overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>ดูรูปภาพขยาย</DialogTitle>
          </DialogHeader>
          <div className="relative flex items-center justify-center min-h-[300px] max-h-[80vh] p-2">
            {selectedPreviewImage && (
              <img
                src={selectedPreviewImage}
                alt="Enlarged preview"
                className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
