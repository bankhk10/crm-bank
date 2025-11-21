"use client";

import { Button } from "@/components/ui/button";
import Can from "@/components/rbac/Can";

interface EmployeeFormButtonsProps {
  canEdit: boolean;
  loading: boolean;
  employeeId?: string;
  permissionHint: string;
  onCancel: () => void;
  onRandomFill?: () => void;
  hideBorder?: boolean;
}

export default function EmployeeFormButtons({
  canEdit,
  loading,
  employeeId,
  permissionHint,
  onCancel,
  onRandomFill,
  hideBorder,
}: EmployeeFormButtonsProps) {
  return (
    <div className={`md:col-span-2 pt-6 ${hideBorder ? "my-2" : "border-t my-2"}`}>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          size="lg"
          className="w-36 bg-gray-500 hover:bg-gray-600 text-white rounded-3xl"
          type="button"
          onClick={onCancel}
          disabled={!canEdit}
          title={!canEdit ? permissionHint : undefined}
        >
          ยกเลิก
        </Button>

        <Button
          size="lg"
          className="w-36 bg-green-700 hover:bg-green-800 text-white rounded-3xl"
          type="submit"
          disabled={!canEdit || loading}
          title={!canEdit ? permissionHint : undefined}
        >
          {loading
            ? "กำลังบันทึก..."
            : employeeId
            ? "บันทึกการเปลี่ยนแปลง"
            : "บันทึก"}
        </Button>
      </div>

      <Can permission="randomize">
        <Button
          size="lg"
          className="w-36 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl"
          type="button"
          onClick={onRandomFill}
          disabled={!canEdit}
          title={!canEdit ? permissionHint : undefined}
        >
          สุ่มกรอก
        </Button>
      </Can>
    </div>
  );
}
