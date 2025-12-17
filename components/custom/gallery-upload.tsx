"use client";

import { useState } from "react";
import {
  formatBytes,
  useFileUpload,
  type FileMetadata,
  type FileWithPreview,
} from "@/hooks/use-file-upload";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  ImageIcon,
  TriangleAlert,
  Upload,
  XIcon,
  ZoomInIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryUploadProps {
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  multiple?: boolean;
  className?: string;
  onFilesChange?: (files: FileWithPreview[]) => void;
  initialFiles?: FileMetadata[];
  disabled?: boolean;
}

export default function GalleryUpload({
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = "image/*",
  multiple = true,
  className,
  onFilesChange,
  initialFiles = [],
  disabled = false,
}: GalleryUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [
    { files, isDragging, errors },
    {
      removeFile,
      clearFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles,
    maxSize,
    accept,
    multiple,
    initialFiles,
    onFilesChange,
  });

  const isImage = (file: File | FileMetadata) => {
    const type = file instanceof File ? file.type : file.type;
    return type.startsWith("image/");
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-base font-semibold text-gray-800 mb-1">
          อัพโหลดรูปภาพ (สูงสุด {maxFiles} รูป)
        </h3>
        <p className="text-sm text-gray-500">
          รองรับไฟล์ .jpg, .jpeg, .png, .webp, .heic, .heif
        </p>
      </div>

      {/* Gallery Stats */}
      {files.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h4 className="text-sm font-medium">
              แกลเลอรี ({files.length}/{maxFiles})
            </h4>
          </div>
          <Button
            type="button"
            onClick={clearFiles}
            variant="outline"
            size="sm"
            disabled={disabled}
          >
            ลบทั้งหมด
          </Button>
        </div>
      )}

      {/* Image Grid */}
      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {files.map((fileItem) => (
            <div key={fileItem.id} className="group relative aspect-square">
              {isImage(fileItem.file) && fileItem.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fileItem.preview}
                  alt={fileItem.file.name}
                  className="h-full w-full rounded-lg border object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg border bg-muted">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              {/* Action Buttons - Always Visible */}
              <div className="absolute top-2 right-2 flex gap-1">
                {/* View Button */}
                {fileItem.preview && (
                  <Button
                    type="button"
                    onClick={() => setSelectedImage(fileItem.preview!)}
                    variant="secondary"
                    size="icon-sm"
                    disabled={disabled}
                    className="h-7 w-7 bg-white/90 hover:bg-white shadow-md"
                  >
                    <ZoomInIcon className="h-4 w-4" />
                  </Button>
                )}

                {/* Remove Button */}
                <Button
                  type="button"
                  onClick={() => removeFile(fileItem.id)}
                  variant="destructive"
                  size="icon-sm"
                  disabled={disabled}
                  className="h-7 w-7 shadow-md"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area - Below Images */}
      <div
        className={cn(
          "mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gray-900 hover:bg-gray-800 text-white transition-colors cursor-pointer shadow-lg",
          isDragging && "bg-primary hover:bg-primary/90",
          disabled && "opacity-50 pointer-events-none"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input {...getInputProps()} className="sr-only" disabled={disabled} />
        <Upload className="h-5 w-5" />
        <span className="font-medium">เลือกรูป</span>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive" className="mt-5">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>เกิดข้อผิดพลาดในการอัพโหลดไฟล์</AlertTitle>
          <AlertDescription>
            {errors.map((error, index) => (
              <p key={index} className="last:mb-0">
                {error}
              </p>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-300 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-full max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage}
              alt="Preview"
              className="max-h-full max-w-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              type="button"
              onClick={() => setSelectedImage(null)}
              variant="secondary"
              size="icon-sm"
              className="absolute end-2 top-2"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
