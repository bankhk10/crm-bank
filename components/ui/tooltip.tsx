"use client"

import * as React from "react"

type Side = "top" | "right" | "bottom" | "left"

export function Tooltip({
  children,
  content,
  side = "top",
}: {
  children: React.ReactNode
  content: React.ReactNode
  side?: Side
}) {
  const posClass = React.useMemo(() => {
    switch (side) {
      case "top":
        return "-top-2 left-1/2 -translate-x-1/2 translate-y-[-100%] mb-2"
      case "bottom":
        return "top-full left-1/2 -translate-x-1/2 mt-2"
      case "left":
        return "left-0 top-1/2 -translate-x-full -translate-y-1/2 mr-2"
      case "right":
        return "left-full top-1/2 translate-x-2 -translate-y-1/2"
    }
  }, [side])

  return (
    <div className="relative inline-block">
      <div className="group inline-flex items-center">{children}</div>

      <div
        role="tooltip"
        className={`pointer-events-none absolute z-50 ${posClass} hidden group-hover:block group-focus:block`}
      >
        <div className="whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-md">
          {content}
        </div>
      </div>
    </div>
  )
}

export default Tooltip
