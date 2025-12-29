// components/action-bar/MobileActionBar.tsx
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onApprove: () => void;
  onReject: () => void;
};

export function MobileActionBar({ onApprove, onReject }: Props) {
  return (
    <div
      className="
        fixed bottom-0 left-0 right-0 z-50
        bg-white/90 backdrop-blur
        border-t
        px-4 pt-3
        pb-[calc(1rem+env(safe-area-inset-bottom))]
        sm:hidden
      "
    >
      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          onClick={onReject}
          className="h-12 rounded-xl border-red-300 text-red-600"
        >
          <XCircle className="h-5 w-5 mr-2" />
          ไม่อนุมัติ
        </Button>

        <Button
          onClick={onApprove}
          className="h-14 rounded-xl bg-green-600 text-white font-semibold"
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          อนุมัติ
        </Button>
      </div>
    </div>
  );
}
