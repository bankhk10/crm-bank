"use client";

import React, { useState, useRef } from "react";
import { Upload, X, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FileUploadProps {
  label: string;
  value: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  error?: string;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  value = [],
  onChange,
  accept = "image/jpeg,image/png",
  maxFiles = 5,
  maxSizeMB = 2,
  error,
  disabled = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasError = !!error;

  const handleFiles = (files: FileList | null) => {
    if (!files || disabled) return;

    const newFiles = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Check max files
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
      onChange([...value, ...validFiles]);
    }

    if (errors.length > 0) {
      alert(errors.join("\n"));
    }
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
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : hasError
            ? "border-red-500 bg-red-50"
            : "border-gray-300 bg-gray-50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />

        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-1">
          คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
        </p>
        <p className="text-xs text-gray-500">
          รองรับไฟล์: {accept.split(",").join(", ")} | ขนาดไม่เกิน {maxSizeMB}MB
          | สูงสุด {maxFiles} ไฟล์
        </p>
      </div>

      {/* Preview uploaded files */}
      {value.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {value.map((file, index) => {
            const isImage = file.type.startsWith("image/");
            const preview = isImage ? URL.createObjectURL(file) : null;

            return (
              <div
                key={index}
                className="relative border rounded-lg overflow-hidden bg-white shadow-sm"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt={file.name}
                    className="w-full h-32 object-cover"
                    onLoad={() => URL.revokeObjectURL(preview)}
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center bg-gray-100">
                    <FileImage className="h-12 w-12 text-gray-400" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="p-2 text-xs text-gray-600 truncate">
                  {file.name}
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
