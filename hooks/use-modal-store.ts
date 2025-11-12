"use client";

import { useCallback, useState } from "react";

export function useModalStore(modalKey: string) {
  const [open, setOpen] = useState(false);

  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  return {
    key: modalKey,
    open,
    show,
    hide,
    toggle
  };
}
