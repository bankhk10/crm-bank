"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {}

export function Divider({ className, ...props }: DividerProps) {
  return <hr className={cn("border-t border-white/20", className)} {...props} />;
}

export default Divider;
