"use client";

import React, { useState, useRef } from "react";
import { Upload, X, FileImage, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export interface ExistingImage {
  id?: string;
  url: string;
  name?: string;
  size?: number;
}

export interface ImageUploadProps {
  label: string;
  // value can be newly selected File objects or existing uploaded images
  value: Array<File | ExistingImage>;
  onChange: (files: Array<File | ExistingImage>) => void;
  accept?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  error?: string;
  disabled?: boolean;
  /** Optional callback when a file is marked as the primary/cover image */
  onSetCover?: (index: number) => void;
}

const ImagePreviewItem = ({
  file,
  index,
  isCover,
  disabled,
  onSetCover,
  onRemove,
  onPreview,
}: {
  file: File | ExistingImage;
  index: number;
  isCover: boolean;
  disabled: boolean;
  onSetCover?: (index: number) => void;
  onRemove: (index: number) => void;
  onPreview: (url: string) => void;
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  React.useEffect(() => {
    let url: string | null = null;
    if (file instanceof File) {
      url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(file.url);
    }

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!previewUrl) return null;

  const isFile = file instanceof File;

  return (
    <div
      className={`relative group w-32 h-32 shrink-0 bg-white p-1 rounded-md border-2 transition-all ${isCover ? "border-yellow-400 shadow-sm" : "border-gray-200"
        }`}
    >
      <div
        className="w-full h-full relative cursor-pointer overflow-hidden rounded-sm"
        onClick={() => onPreview(previewUrl)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt={isFile ? file.name : (file as ExistingImage).name || "image"}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                const newIndex = isCover ? null : index;
                if (newIndex !== null) onSetCover?.(newIndex);
              }}
              className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${isCover
                ? "bg-yellow-400 text-white"
                : "bg-white/20 text-white hover:bg-yellow-400 hover:border-transparent"
                }`}
              title={isCover ? "ยกเลิกหน้าปก" : "ตั้งเป็นหน้าปก"}
              disabled={disabled}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="p-1.5 rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-red-500 transition-colors"
              title="ลบรูปภาพ"
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute bottom-1 right-1 text-white/80">
            <ZoomIn className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  value = [],
  onChange,
  accept = ".jpg,.jpeg,.png,.webp,.heic,.heif",
  maxFiles = 5,
  maxSizeMB = 2,
  error,
  disabled = false,
  onSetCover,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [coverIndex, setCoverIndex] = useState<number | null>(
    value.length > 0 ? 0 : null
  );
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const hasError = !!error;

  const handleFiles = (files: FileList | null) => {
    if (!files || disabled) return;

    const newFiles = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Check max files (count both new and existing)
    if (value.length + newFiles.length > maxFiles) {
      errors.push(`สามารถอัพโหลดได้ไม่เกิน ${maxFiles} ไฟล์`);
      return;
    }

    // Validate each file
    newFiles.forEach((file) => {
      // Check file type
      const acceptedTypes = accept.split(",").map((t) => t.trim().toLowerCase());
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();

      const isValidType = acceptedTypes.some((type) => {
        if (type.startsWith(".")) {
          return fileName.endsWith(type);
        }
        if (type.endsWith("/*")) {
          const baseType = type.split("/")[0];
          return fileType.startsWith(baseType + "/");
        }
        return fileType === type;
      });

      if (!isValidType) {
        errors.push(`${file.name}: ประเภทไฟล์ไม่รองรับ`);
        return;
      }

      // Check file size
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        errors.push(
          `${file.name}: ขนาดไฟล์เกิน ${maxSizeMB}MB (${sizeMB.toFixed(2)}MB)`
        );
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      // Resize/compress images before passing up
      Promise.all(validFiles.map((f) => resizeAndCompressImage(f))).then(
        (processed) => {
          onChange([...value, ...processed]);
          // if no cover set yet, set first new image as cover
          if (coverIndex === null && processed.length > 0) {
            setCoverIndex(value.length);
            onSetCover?.(value.length);
          }
        }
      );
    }

    if (errors.length > 0) {
      alert(errors.join("\n"));
    }
  };

  // Resize and compress images using canvas (no extra deps)
  const resizeAndCompressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) return resolve(file);

      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const maxDim = 1200; // max width/height
        let { width, height } = img as unknown as {
          width: number;
          height: number;
        };
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const newFile = new File([blob], file.name, {
                  type: blob.type || file.type,
                });
                resolve(newFile);
              } else {
                resolve(file);
              }
            },
            file.type === "image/png" ? "image/png" : "image/jpeg",
            0.85
          );
        } else {
          resolve(file);
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onChange(newFiles);
  };

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  return (
    <div className="mb-4">
      {/* Header Label */}
      <div className="flex flex-col mb-3">
        <div className="flex items-center justify-between">
          <label className="text-lg font-semibold text-gray-800">{label}</label>
          <span className="text-xs text-gray-500">
            {value.length}/{maxFiles} รูป
          </span>
        </div>
        <span className="text-xs text-gray-500 mt-1">
          รองรับไฟล์ {accept.split(",").join(", ")}
        </span>
      </div>

      {hasError && (
        <div
          className="mb-4 flex items-center rounded-lg bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          <svg
            className="h-5 w-5 shrink-0 text-red-600"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 112 0v2a1 1 0 11-2 0v-2zm1-8a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="ml-2">{error}</span>
        </div>
      )}

      {/* Gallery Layout */}
      <div className="flex flex-wrap gap-4">
        {/* Existing Images */}
        {value.map((file, index) => (
          <ImagePreviewItem
            key={index}
            file={file}
            index={index}
            isCover={coverIndex === index}
            disabled={disabled}
            onSetCover={(idx) => {
              const newIndex = idx === coverIndex ? null : idx;
              setCoverIndex(newIndex === coverIndex ? null : idx);
              onSetCover?.(idx);
            }}
            onRemove={removeFile}
            onPreview={setPreviewImage}
          />
        ))}

        {/* Upload Button Tile */}
        {value.length < maxFiles && !disabled && (
          <button
            type="button"
            onClick={openFileDialog}
            className="w-32 h-32 shrink-0 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-md text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Upload className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium">Upload</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />

      {/* Lightbox Dialog */}
      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => !open && setPreviewImage(null)}
      >
        <DialogContent className="max-w-4xl w-full p-0 bg-transparent border-none shadow-none text-white flex flex-col items-center justify-center">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <div className="relative w-auto h-[80vh] flex items-center justify-center">
            {previewImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewImage}
                alt="Full preview"
                className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
              />
            )}
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 md:bg-white/10 md:hover:bg-white/20 text-white rounded-full p-2 transition-colors focus:outline-none"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageUpload;
