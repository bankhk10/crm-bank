"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

interface DeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: React.ReactNode;
    description?: React.ReactNode;
    cancelText?: string;
    confirmText?: string;
    isDeleting?: boolean;
}

export function DeleteDialog({
    open,
    onOpenChange,
    onConfirm,
    title = "ลบรายการ",
    description = "คุณต้องการลบรายการนี้ใช่หรือไม่ ?",
    cancelText = "ยกเลิก",
    confirmText = "ยืนยันการลบ",
    isDeleting = false,
}: DeleteDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] rounded-lg border-0 shadow-2xl">
                <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                    <Trash2 className="h-5 w-5" /> {title}
                </DialogTitle>
                <DialogDescription className="text-base text-slate-600">
                    {description}
                </DialogDescription>
                <DialogFooter className="mt-6 gap-2 sm:gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="rounded-full"
                        disabled={isDeleting}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        className="rounded-full bg-red-600 hover:bg-red-700"
                        disabled={isDeleting}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
