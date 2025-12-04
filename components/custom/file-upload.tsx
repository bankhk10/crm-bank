"use client";

import React, { useState, useRef } from "react";
import { Upload, X, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ExistingImage {
  id?: string;
  url: string;
  name?: string;
  size?: number;
}

export interface FileUploadProps {
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

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  value = [],
  onChange,
  accept = "image/jpeg,image/png,image/webp,image/avif,image/svg+xml",
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
      const acceptedTypes = accept.split(",").map((t) => t.trim());
      const fileType = file.type;
      const isValidType = acceptedTypes.some((type) => {
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

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
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
      {/* Header Label + Upload Button + Counter */}
      <div className="flex items-center justify-start mb-2">
        <label className="text-lg font-semibold text-gray-800">{label}</label>
      </div>
      <div className="flex items-center gap-2 mt-4 mb-4">
        <Button
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            openFileDialog();
          }}
          disabled={disabled}
          className="border-blue-600 text-blue-600 hover:bg-blue-50 flex items-center gap-2 rounded-full px-4 py-1.5"
        >
          <Upload className="w-4 h-4" />
          เลือกรูปภาพ
        </Button>

        <span className="text-xs bg-gray-100 px-2.5 py-1 rounded-full text-gray-600">
          {value.length}/{maxFiles} รูป
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        อนุญาตเฉพาะไฟล์: JPG, PNG, WebP, AVIF, SVG ขนาดไม่เกิน {maxSizeMB}
        MB/ไฟล์
      </p>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />

      {/* Preview uploaded files */}
      {value.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {value.map((file, index) => {
            const isFile = file instanceof File;
            const isImage = isFile ? file.type.startsWith("image/") : true;
            const preview = isFile
              ? URL.createObjectURL(file)
              : (file as ExistingImage).url;

            return (
              <div
                key={index}
                className="relative rounded-lg overflow-hidden bg-white shadow-sm border"
              >
                <div className="relative group">
                  {preview ? (
                    <img
                      src={preview}
                      alt={
                        isFile
                          ? file.name
                          : (file as ExistingImage).name || "image"
                      }
                      className="w-full h-36 object-cover transition-transform duration-200 group-hover:scale-105"
                      onLoad={() => {
                        if (isFile) URL.revokeObjectURL(preview as string);
                      }}
                    />
                  ) : (
                    <div className="w-full h-36 flex items-center justify-center bg-gray-100">
                      <FileImage className="h-12 w-12 text-gray-400" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCoverIndex(index);
                          onSetCover?.(index);
                        }}
                        className={`inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2 py-1 text-xs text-white backdrop-blur-sm hover:bg-white/20 ${
                          coverIndex === index ? "ring-2 ring-yellow-400" : ""
                        }`}
                        title="ตั้งภาพเป็นหน้าปก"
                        disabled={disabled}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 2l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z"
                          />
                        </svg>
                        <span className="ml-1">ปก</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-red-600/80 px-2 py-1 text-xs text-white hover:bg-red-600"
                        title="ลบ"
                        disabled={disabled}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-2 text-xs text-gray-600 truncate">
                    <div className="font-medium text-sm text-gray-800 truncate">
                      {isFile
                        ? (file as File).name
                        : (file as ExistingImage).name ||
                          (file as ExistingImage).url.split("/").pop()}
                    </div>
                    <div className="text-xxs text-gray-500 mt-1">
                      {isFile
                        ? `${((file as File).size / 1024 / 1024).toFixed(2)} MB`
                        : (file as ExistingImage).size
                        ? `${(
                            (file as ExistingImage).size! /
                            1024 /
                            1024
                          ).toFixed(2)} MB`
                        : ""}
                      {coverIndex === index && (
                        <span className="ml-2 inline-block rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 text-[10px]">
                          หน้าปก
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasError && (
        <div
          className="mt-2 flex items-center rounded-lg bg-red-50 p-3 text-sm text-red-700"
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
    </div>
  );
};

export default FileUpload;
