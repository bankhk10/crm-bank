# Dev-Only Random Fill System

ระบบสำหรับกรอกข้อมูลแบบสุ่ม ใช้สำหรับ development เท่านั้น

## 🎯 Features

- ✅ **Tree-shakable**: Code ถูกลบออกจาก production bundle โดยอัตโนมัติ
- ✅ **Zero production impact**: ไม่กระทบ performance ใน production
- ✅ **Centralized config**: ตั้งค่าจากที่เดียว
- ✅ **Reusable**: ใช้ได้กับทุก form

## 📁 File Structure

```
lib/
├── dev-only/
│   ├── config.ts     # Configuration & feature flags
│   └── index.ts      # Barrel exports
├── random-fill/
│   ├── product.ts    # Product random data generator
│   ├── employee.ts   # Employee random data generator
│   └── ...           # Other generators

components/
├── dev-only/
│   └── wrapper.tsx   # DevOnlyWrapper component
├── custom/
│   └── random-fill-button.tsx  # RandomFillButton component

hooks/
└── use-random-fill.ts  # useRandomFill hook
```

## ⚙️ Configuration

เปิดใช้งานโดยตั้ง environment variable:

```bash
# เปิดใช้งาน dev features ทั้งหมด
NEXT_PUBLIC_SHOW_DEV_FEATURES=true

# หรือใช้แบบเดิม (backward compatible)
NEXT_PUBLIC_SHOW_RANDOM_FILL=true
```

## 📖 Usage

### วิธีที่ 1: ใช้ `useRandomFill` hook (แนะนำ)

```tsx
import { useRandomFill } from "@/hooks/use-random-fill";
import { RandomFillButton } from "@/components/custom/random-fill-button";

function MyForm() {
  const [formData, setFormData] = useState({...});

  // ใช้ dynamic import เพื่อ tree-shake ใน production
  const generator = useCallback(async () => {
    const { generateRandomProduct } = await import("@/lib/random-fill/product");
    return generateRandomProduct();
  }, []);

  const { isEnabled, isGenerating, triggerRandomFill } = useRandomFill({
    generator,
    onGenerated: (data) => setFormData(data),
  });

  return (
    <form>
      {/* Form fields... */}

      {/* Random fill button - จะไม่แสดงใน production */}
      {isEnabled && (
        <RandomFillButton
          onClick={triggerRandomFill}
          isGenerating={isGenerating}
        />
      )}
    </form>
  );
}
```

### วิธีที่ 2: ใช้ `DevOnlyWrapper` component

```tsx
import { DevOnlyWrapper } from "@/components/dev-only/wrapper";
import { RandomFillButton } from "@/components/custom/random-fill-button";

function MyForm() {
  return (
    <form>
      {/* Form fields... */}

      <DevOnlyWrapper>
        <RandomFillButton onClick={handleRandomFill} />
      </DevOnlyWrapper>
    </form>
  );
}
```

### วิธีที่ 3: ใช้ `RandomFillButton` โดยตรง

```tsx
import { RandomFillButton } from "@/components/custom/random-fill-button";

function MyForm() {
  // RandomFillButton จะ return null โดยอัตโนมัติใน production
  return (
    <form>
      <RandomFillButton onClick={handleRandomFill} />
    </form>
  );
}
```

## 🔧 Creating a New Random Generator

1. สร้างไฟล์ใน `lib/random-fill/`:

```typescript
// lib/random-fill/my-entity.ts
export type MyEntityPayload = {
  name: string;
  // ... other fields
};

export function generateRandomMyEntity(): MyEntityPayload {
  return {
    name: `Random ${Date.now()}`,
    // ... generate other fields
  };
}

export default generateRandomMyEntity;
```

2. ใช้งานใน form:

```tsx
const generator = useCallback(async () => {
  const { generateRandomMyEntity } = await import(
    "@/lib/random-fill/my-entity"
  );
  return generateRandomMyEntity();
}, []);
```

## 🚀 Production Build

ใน production:

1. ไม่ตั้ง `NEXT_PUBLIC_SHOW_DEV_FEATURES` หรือตั้งเป็น `false`
2. Build ปกติ: `npm run build`
3. Code ที่ใช้ dynamic import จะถูก tree-shake ออก

## 📋 Checklist for New Forms

- [ ] Import `useRandomFill` hook
- [ ] ใช้ `useCallback` สำหรับ dynamic import generator
- [ ] Implement `onGenerated` callback
- [ ] ใช้ conditional rendering กับ `isEnabled`
- [ ] Pass `isGenerating` ไปที่ RandomFillButton
