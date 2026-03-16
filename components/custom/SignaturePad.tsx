"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Trash2, CheckCircle2, Upload, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
    value?: string;
    onChange: (value: string | "") => void;
    label?: string;
    error?: string;
    containerClassName?: string;
    maxWidth?: number;
    maxHeight?: number;
}

export default function SignaturePad({
    value,
    onChange,
    label = "ลงลายมือชื่อ",
    error: externalError,
    containerClassName,
    maxWidth = 600,
    maxHeight = 200,
}: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(!value);
    const [localError, setLocalError] = useState<string | null>(null);

    const error = externalError || localError;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set high resolution for retina displays
        const ratio = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
        ctx.scale(ratio, ratio);

        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#1a1a1a";

        // Draw initial value if exists
        if (value) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, rect.width, rect.height);
            };
            img.src = value;
        }
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { offsetX, offsetY } = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        setIsDrawing(true);
        setIsEmpty(false);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { offsetX, offsetY } = getCoordinates(e);
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        saveSignature();
    };

    const getTrimmedBounds = (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        const { width, height } = canvas;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        let minX = width, minY = height, maxX = 0, maxY = 0;
        let found = false;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const alpha = data[(y * width + x) * 4 + 3];
                if (alpha > 0) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    found = true;
                }
            }
        }

        if (!found) return null;

        // Add some padding (e.g., 10px in original coordinates)
        const ratio = window.devicePixelRatio || 1;
        const padding = 10 * ratio;

        return {
            x: Math.max(0, minX - padding),
            y: Math.max(0, minY - padding),
            w: Math.min(width, (maxX - minX + 1) + padding * 2),
            h: Math.min(height, (maxY - minY + 1) + padding * 2)
        };
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { offsetX: 0, offsetY: 0 };

        const rect = canvas.getBoundingClientRect();
        if ("touches" in e) {
            return {
                offsetX: e.touches[0].clientX - rect.left,
                offsetY: e.touches[0].clientY - rect.top,
            };
        } else {
            return {
                offsetX: (e as React.MouseEvent).clientX - rect.left,
                offsetY: (e as React.MouseEvent).clientY - rect.top,
            };
        }
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
        setLocalError(null);
        onChange("");
    };

    const saveSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Calculate trimmed bounds to remove empty space
        const bounds = getTrimmedBounds(canvas);
        if (!bounds) {
            onChange("");
            return;
        }

        const targetWidth = 450;
        const scaleFactor = targetWidth / (bounds.w / (window.devicePixelRatio || 1));
        const targetHeight = (bounds.h / (window.devicePixelRatio || 1)) * scaleFactor;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = targetWidth;
        tempCanvas.height = targetHeight;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return;

        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = "high";
        
        // Draw only the trimmed area
        tempCtx.drawImage(
            canvas, 
            bounds.x, bounds.y, bounds.w, bounds.h, 
            0, 0, targetWidth, targetHeight
        );

        const dataUrl = tempCanvas.toDataURL("image/png");
        
        // Approximate size in KB (Base64 is ~1.33x larger than binary)
        const sizeInKB = (dataUrl.length * 0.75) / 1024;
        
        if (sizeInKB > 200) {
            setLocalError("ขนาดไฟล์เกิน 200KB กรุณาลายเส้นให้เรียบง่ายขึ้น");
            return;
        }

        setLocalError(null);
        onChange(dataUrl);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 200 * 1024) {
            setLocalError("ขนาดไฟล์ห้ามเกิน 200KB");
            return;
        }

        if (file.type !== "image/png" && file.type !== "image/jpeg") {
            setLocalError("รองรับเฉพาะไฟล์ PNG หรือ JPEG เท่านั้น");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (!dataUrl) return;

            const img = new Image();
            img.onload = () => {
                // Check dimensions
                if (img.width > maxWidth || img.height > maxHeight) {
                    setLocalError(`ขนาดรูปภาพต้องไม่เกิน ${maxWidth}x${maxHeight} px (รูปที่อัปโหลด: ${img.width}x${img.height} px)`);
                    return;
                }

                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                const rect = canvas.getBoundingClientRect();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Draw at center or fit? Let's fit it within the canvas bounds
                const canvasAspect = rect.width / rect.height;
                const imgAspect = img.width / img.height;
                
                let drawW = rect.width;
                let drawH = rect.height;
                
                if (imgAspect > canvasAspect) {
                    drawH = rect.width / imgAspect;
                } else {
                    drawW = rect.height * imgAspect;
                }

                const x = (rect.width - drawW) / 2;
                const y = (rect.height - drawH) / 2;

                ctx.drawImage(img, x, y, drawW, drawH);
                setIsEmpty(false);
                setLocalError(null);
                saveSignature();
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={cn("space-y-2", containerClassName)}>
            {label && (
                <label className="text-sm font-medium text-gray-700 block">
                    {label}
                </label>
            )}
            
            <div className={cn(
                "relative bg-white border-2 border-dashed rounded-xl overflow-hidden transition-all duration-200",
                isDrawing ? "border-primary shadow-lg scale-[1.01]" : "border-gray-300",
                error ? "border-destructive" : "hover:border-gray-400"
            )}>
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-40 cursor-crosshair touch-none"
                    style={{ maxHeight: `${maxHeight}px` }}
                    title="วาดลายเซ็นที่นี่"
                />
                
                {isEmpty && !isDrawing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 select-none">
                        <div className="text-center">
                            <Eraser className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">วาดลายเซ็นของคุณที่นี่</p>
                        </div>
                    </div>
                )}

                <div className="absolute bottom-3 right-3 flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={triggerUpload}
                        className="bg-white/80 backdrop-blur hover:bg-white text-primary border-primary/20 hover:border-primary"
                    >
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        อัพโหลดรูป
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clear}
                        className="bg-white/80 backdrop-blur hover:bg-white text-destructive border-destructive/20 hover:border-destructive"
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        ล้างข้อมูล
                    </Button>
                </div>
            </div>

            {error && (
                <p className="text-xs font-medium text-destructive">{error}</p>
            )}
            
            {!isEmpty && !isDrawing && (
                <div className="flex items-center gap-2 text-[10px] text-green-600 font-medium animate-in fade-in slide-in-from-left-1">
                    <CheckCircle2 className="w-3 h-3" />
                    บันทึกข้อมูลลายเซ็นแล้ว
                </div>
            )}
        </div>
    );
}
