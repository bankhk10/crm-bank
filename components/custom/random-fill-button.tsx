"use client";

import React from "react";
import { Button } from "@/components/ui/button";

const SHOW_RANDOM_FILL = process.env.NEXT_PUBLIC_SHOW_RANDOM_FILL === "true";

export default function RandomFillButton({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Button>) {
  if (!SHOW_RANDOM_FILL) return null;

  return (
    <Button type="button" {...props}>
      {children || "สุ่มข้อมูล"}
    </Button>
  );
}
