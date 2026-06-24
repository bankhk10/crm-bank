"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { saveDynamicRouteConfigs } from "@/modules/activity-plan/application/actions";

type Employee = { id: string; name: string; positionTitle: string | null };
type ConfigStep = { stepName: string; stepOrder: number; approverId: string; budgetCondition: string };

export default function DynamicConfigForm({ employees }: { employees: Employee[] }) {
  const [requesterId, setRequesterId] = useState("");
  const [steps, setSteps] = useState<ConfigStep[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const addStep = () => {
    setSteps([...steps, { stepName: "", stepOrder: steps.length + 1, approverId: "", budgetCondition: "ALWAYS" }]);
  };

  const updateStep = (index: number, field: keyof ConfigStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  };

  const handleSave = async () => {
    if (!requesterId) return alert("กรุณาเลือกผู้ขออนุมัติ");
    if (steps.some(s => !s.stepName || !s.approverId || !s.stepOrder)) return alert("กรุณากรอกข้อมูลให้ครบถ้วนทุกขั้นตอน");
    
    setIsSaving(true);
    try {
      await saveDynamicRouteConfigs(requesterId, steps);
      alert("บันทึกข้อมูลเรียบร้อยแล้ว");
      // Optional: reload configs
    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 text-blue-600">พนักงานผู้ขออนุมัติ (Requester)</label>
        <select 
          className="w-full border-2 border-blue-200 rounded-md p-2 mb-4" 
          value={requesterId} 
          onChange={(e) => setRequesterId(e.target.value)}
        >
          <option value="">-- เลือกผู้ขออนุมัติ --</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.name} ({emp.positionTitle || 'ไม่มีตำแหน่ง'})</option>
          ))}
        </select>
      </div>
      
      {requesterId && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold">ขั้นตอนการอนุมัติ</h4>
            <Button type="button" size="sm" variant="outline" onClick={addStep}>
              <Plus className="h-4 w-4 mr-1" /> เพิ่มขั้นตอน
            </Button>
          </div>
          
          {steps.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">ยังไม่มีขั้นตอนการอนุมัติ กดปุ่ม "เพิ่มขั้นตอน" เพื่อเริ่มต้น</p>
          ) : (
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-wrap md:flex-nowrap items-end gap-2 bg-white p-3 rounded border">
                  <div className="w-full md:w-20">
                    <label className="block text-xs text-gray-500 mb-1">ลำดับ (Step)</label>
                    <input 
                      type="number" 
                      className="w-full border rounded p-1.5 text-sm" 
                      value={step.stepOrder}
                      onChange={(e) => updateStep(index, "stepOrder", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <label className="block text-xs text-gray-500 mb-1">ชื่อขั้น (เช่น ผู้จัดการ)</label>
                    <input 
                      type="text" 
                      className="w-full border rounded p-1.5 text-sm" 
                      value={step.stepName}
                      placeholder="เช่น ผจก. ฝ่ายขาย"
                      onChange={(e) => updateStep(index, "stepName", e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-1/3">
                    <label className="block text-xs text-gray-500 mb-1">ผู้อนุมัติ</label>
                    <select 
                      className="w-full border rounded p-1.5 text-sm" 
                      value={step.approverId}
                      onChange={(e) => updateStep(index, "approverId", e.target.value)}
                    >
                      <option value="">-- เลือกผู้อนุมัติ --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full md:w-1/4">
                    <label className="block text-xs text-gray-500 mb-1">เงื่อนไข</label>
                    <select 
                      className="w-full border rounded p-1.5 text-sm" 
                      value={step.budgetCondition}
                      onChange={(e) => updateStep(index, "budgetCondition", e.target.value)}
                    >
                      <option value="ALWAYS">อนุมัติเสมอ</option>
                      <option value="SALES_ONLY">เฉพาะใช้งบส่งเสริมการขาย</option>
                      <option value="MARKETING_ONLY">เฉพาะใช้งบการตลาด</option>
                      <option value="ANY_BUDGET">เมื่อมีการใช้งบ (งบใดก็ได้)</option>
                    </select>
                  </div>
                  <div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeStep(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {steps.length > 0 && (
            <Button onClick={handleSave} disabled={isSaving} className="w-full mt-4">
              {isSaving ? "กำลังบันทึก..." : "บันทึกสายการอนุมัติทั้งหมด"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
