"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ValidationAlertState {
  isOpen: boolean;
  title: string;
  description?: string;
  messages?: string[];
}

export interface ValidationAlertDialogProps {
  alert: ValidationAlertState;
  onClose: () => void;
}

export function ValidationAlertDialog({
  alert,
  onClose,
}: ValidationAlertDialogProps) {
  return (
    <AlertDialog open={alert.isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md rounded-2xl p-6 bg-white shadow-xl border border-slate-200">
        <AlertDialogHeader className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-2xs">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <AlertDialogTitle className="text-base sm:text-lg font-bold text-slate-900">
              {alert.title}
            </AlertDialogTitle>
            {alert.description && (
              <AlertDialogDescription className="text-xs sm:text-sm text-slate-600 mt-1">
                {alert.description}
              </AlertDialogDescription>
            )}
          </div>
        </AlertDialogHeader>

        {alert.messages && alert.messages.length > 0 && (
          <div className="py-2">
            <ul className="space-y-2 bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 text-xs sm:text-sm text-amber-900 font-medium">
              {alert.messages.map((msg, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>{msg}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <AlertDialogFooter className="pt-2">
          <AlertDialogAction
            onClick={onClose}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-5 h-10 cursor-pointer shadow-xs transition-colors"
          >
            ตกลง
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

