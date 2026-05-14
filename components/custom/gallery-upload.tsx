"use client";

import { useState, useEffect } from "react";
import {
  useFileUpload,
  formatBytes,
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
  CropIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImg, compressImage } from "@/lib/canvas-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface GalleryUploadProps {
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  multiple?: boolean;
  className?: string;
  onFilesChange?: (files: FileWithPreview[]) => void;
  initialFiles?: FileMetadata[];
  disabled?: boolean;
  targetSize?: { width: number; height: number };
  quality?: number;
}

export default function GalleryUpload({
  maxFiles = 5,
  maxSize = 20 * 1024 * 1024, // 20MB
  accept = "image/*",
  multiple = true,
  className,
  onFilesChange,
  initialFiles = [],
  disabled = false,
  targetSize,
  quality = 0.8,
}: GalleryUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cropQueue, setCropQueue] = useState<FileWithPreview[]>([]);

  const handleFilesAdded = async (addedFiles: FileWithPreview[]) => {
    if (targetSize) {
      setCropQueue((prev) => [...prev, ...addedFiles]);
    } else {
      // If no target size, still compress the images
      for (const fileItem of addedFiles) {
        if (fileItem.file instanceof File && fileItem.file.type.startsWith("image/")) {
          try {
            const compressedFile = await compressImage(fileItem.file, {
              quality,
              maxWidth: 1920, // Default max width
              maxHeight: 1920, // Default max height
            });
            updateFile(fileItem.id, compressedFile);
          } catch (error) {
            console.error("Compression error:", error);
          }
        }
      }
    }
  };

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
      updateFile,
    },
  ] = useFileUpload({
    maxFiles,
    maxSize,
    accept,
    multiple,
    initialFiles,
    onFilesChange,
    onFilesAdded: handleFilesAdded,
  });

  // Cropping State
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropFile, setCropFile] = useState<{
    id: string;
    url: string;
    file: File | FileMetadata;
  } | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Process Crop Queue
  useEffect(() => {
    if (cropQueue.length > 0 && !isCropOpen) {
      const nextFile = cropQueue[0];
      // Only process if it's an image
      if (nextFile.file.type.startsWith("image/") && nextFile.preview) {
        setCropFile({
          id: nextFile.id,
          url: nextFile.preview,
          file: nextFile.file,
        });
        setIsCropOpen(true);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      }
      // Remove from queue
      setCropQueue((prev) => prev.slice(1));
    }
  }, [cropQueue, isCropOpen]);

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (!cropFile || !croppedAreaPixels) return;
    try {
      const blob = await getCroppedImg(
        cropFile.url,
        croppedAreaPixels,
        0,
        { horizontal: false, vertical: false },
        targetSize?.width,
        targetSize?.height,
        quality
      );

      const fileName =
        cropFile.file instanceof File ? cropFile.file.name : cropFile.file.name;

      const newFile = new File([blob], fileName, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      updateFile(cropFile.id, newFile);
      setCropFile(null); // Clear first to mark as success
      setIsCropOpen(false);
      setZoom(1);
    } catch (e) {
      console.error("Crop error:", e);
    }
  };

  const handleCropCancel = () => {
    if (targetSize && cropFile) {
      // If strict mode is enabled, cancelling removes the file
      removeFile(cropFile.id);
    }
    setCropFile(null);
    setIsCropOpen(false);
    setZoom(1);
  };

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
            <div key={fileItem.id} className="group relative aspect-square rounded-lg border border-gray-200 flex items-center justify-center p-1 overflow-hidden">
              {isImage(fileItem.file) && fileItem.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fileItem.preview}
                  alt={fileItem.file.name}
                  className="h-full w-full object-contain rounded-md"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg border bg-muted">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              {/* File Size Badge */}
              <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/20 text-white text-[10px] font-medium rounded backdrop-blur-[2px]">
                {formatBytes(fileItem.file.size)}
              </div>

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

                {/* Crop Button */}
                {isImage(fileItem.file) && fileItem.preview && (
                  <Button
                    type="button"
                    onClick={() => {
                      setCropFile({
                        id: fileItem.id,
                        url: fileItem.preview!,
                        file: fileItem.file,
                      });
                      setIsCropOpen(true);
                      setZoom(1);
                      setCrop({ x: 0, y: 0 });
                    }}
                    variant="secondary"
                    size="icon-sm"
                    disabled={disabled}
                    className="h-7 w-7 bg-white/90 hover:bg-white shadow-md"
                  >
                    <CropIcon className="h-3 w-3" />
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

      {/* Crop Modal */}
      <Dialog
        open={isCropOpen}
        onOpenChange={(open) => {
          if (!open) handleCropCancel();
          else setIsCropOpen(true);
        }}
      >
        <DialogContent
          className="max-w-3xl"
          onInteractOutside={() => {
            // Prevent accidental outside clicks if strictly forcing?
            // User requested "If exceeded/cancelled -> cannot upload".
            // So closing leads to deletion. That is fine.
            // We don't need to prevent closing.
          }}
        >
          <DialogHeader>
            <DialogTitle>
              ตัดแต่งรูปภาพ{" "}
              {targetSize ? `(${targetSize.width}x${targetSize.height})` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="relative h-[400px] w-full rounded-md overflow-hidden border border-gray-200" style={{ backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}>
            {cropFile && (
              <Cropper
                image={cropFile.url}
                crop={crop}
                zoom={zoom}
                aspect={targetSize ? targetSize.width / targetSize.height : 1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <DialogFooter className="gap-2">
            <div className="mr-auto text-sm text-gray-500 flex items-center">
              ซูม: {((zoom - 1) * 100).toFixed(0)}%
            </div>
            <Button variant="outline" type="button" onClick={handleCropCancel}>
              ยกเลิก
            </Button>
            <Button type="button" onClick={handleCropSave}>
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
