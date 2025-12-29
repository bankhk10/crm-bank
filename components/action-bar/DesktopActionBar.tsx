// components/action-bar/DesktopActionBar.tsx
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onApprove: () => void;
  onReject: () => void;
};

export function DesktopActionBar({ onApprove, onReject }: Props) {
  return (
    <div className="hidden sm:block sticky bottom-6 z-10">
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={onReject}
          className="h-12 px-8 rounded-xl border-red-300 text-red-600"
        >
          <XCircle className="h-5 w-5 mr-2" />
          ไม่อนุมัติ
        </Button>

        <Button
          onClick={onApprove}
          className="h-12 px-10 rounded-xl bg-green-600 text-white font-semibold"
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          อนุมัติ
        </Button>
      </div>
    </div>
  );
}
