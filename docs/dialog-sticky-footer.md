# Dialog Sticky Footer Pattern

## Overview

Dialog component ได้รับการอัปเดตให้รองรับ Sticky Footer pattern ซึ่งเหมาะสำหรับเนื้อหาที่ยาวและต้องการให้ footer อยู่ด้านล่างตลอดเวลา

## Key Features

- ✅ Scrollable content area with ScrollArea component
- ✅ Sticky footer that stays at the bottom
- ✅ Maximum height control with responsive design
- ✅ Clean separation between content and actions

## Usage Example

### Basic Sticky Footer Dialog

```tsx
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>

  <DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md">
    <DialogHeader className="contents space-y-0 text-left">
      <ScrollArea className="flex max-h-full flex-col overflow-hidden">
        <DialogTitle className="px-6 pt-6">Title Here</DialogTitle>
        <DialogDescription asChild>
          <div className="p-6">{/* Your scrollable content here */}</div>
        </DialogDescription>
      </ScrollArea>
    </DialogHeader>

    <DialogFooter
      sticky
      className="flex-row items-center justify-end px-6 py-4"
    >
      <DialogClose asChild>
        <Button variant="outline">Cancel</Button>
      </DialogClose>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

## Important Classes

### DialogContent

- `flex flex-col` - Enable flex layout for sticky footer
- `max-h-[min(600px,80vh)]` - Set maximum height (responsive)
- `gap-0` - Remove default gap
- `p-0` - Remove default padding (we'll add it to inner elements)

### DialogHeader

- `contents` - Make header transparent in flex layout
- `space-y-0` - Remove default spacing
- `text-left` - Align text to left

### ScrollArea

- `flex max-h-full flex-col` - Allow content to scroll
- `overflow-hidden` - Prevent overflow issues

### DialogTitle

- `px-6 pt-6` - Add padding to title

### DialogDescription

- Use `asChild` prop to wrap custom content
- Add `p-6` to the inner div for consistent padding

### DialogFooter

- `sticky` prop - Enables sticky footer styling (adds border-top and background)
- `flex-row items-center justify-end` - Horizontal layout with proper alignment
- `px-6 py-4` - Consistent padding with content area

## Props

### DialogFooter

- `sticky?: boolean` - Enable sticky footer styling (default: false)

## Full Example

See `components/examples/dialog-sticky-footer-demo.tsx` for a complete working example.

## Tips

1. Always use `ScrollArea` for scrollable content
2. Set appropriate `max-h-` on `DialogContent` to control dialog height
3. Use `sticky` prop on `DialogFooter` for visual separation
4. Remember to use `p-0` on `DialogContent` and add padding to inner elements
5. Use `contents` class on `DialogHeader` to make it work with flex layout
