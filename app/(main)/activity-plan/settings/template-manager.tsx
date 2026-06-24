"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { saveRouteTemplate, deleteRouteTemplate } from "@/modules/activity-plan/application/actions";

type Employee = { id: string; name: string };
type ConfigStep = { id?: string; stepName: string; stepOrder: number; approverId: string; budgetCondition: string };
type Template = { id: string; name: string; description: string | null; steps: ConfigStep[] };

export default function TemplateManager({ employees, templates }: { employees: Employee[], templates: Template[] }) {
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const startNew = () => {
    setEditingTemplate({ id: "", name: "", description: "", steps: [] });
  };

  const addStep = () => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      steps: [...editingTemplate.steps, { stepName: "", stepOrder: editingTemplate.steps.length + 1, approverId: "", budgetCondition: "ALWAYS" }]
    });
  };

  const updateStep = (index: number, field: keyof ConfigStep, value: any) => {
    if (!editingTemplate) return;
    const newSteps = [...editingTemplate.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setEditingTemplate({ ...editingTemplate, steps: newSteps });
  };

  const removeStep = (index: number) => {
    if (!editingTemplate) return;
    const newSteps = [...editingTemplate.steps];
    newSteps.splice(index, 1);
    setEditingTemplate({ ...editingTemplate, steps: newSteps });
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    if (!editingTemplate.name) return alert("กรุณาตั้งชื่อเทมเพลต");
    if (editingTemplate.steps.some(s => !s.stepName || !s.approverId || !s.stepOrder)) return alert("กรุณากรอกข้อมูลขั้นตอนให้ครบถ้วน");
    
    setIsSaving(true);
    try {
      await saveRouteTemplate(editingTemplate.id || null, editingTemplate.name, editingTemplate.description || "", editingTemplate.steps);
      alert("บันทึกเทมเพลตเรียบร้อย");
      setEditingTemplate(null);
    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("ยืนยันการลบเทมเพลตนี้? (พนักงานที่ใช้เทมเพลตนี้จะไม่มีสายอนุมัติ)")) {
      try {
        await deleteRouteTemplate(id);
      } catch (error: any) {
        alert("เกิดข้อผิดพลาด: " + error.message);
      }
    }
  };

  if (editingTemplate) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{editingTemplate.id ? "แก้ไขเทมเพลต" : "สร้างเทมเพลตใหม่"}</h3>
          <Button variant="outline" size="sm" onClick={() => setEditingTemplate(null)}>ยกเลิก</Button>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">ชื่อเทมเพลต</label>
          <input 
            type="text" 
            className="w-full border rounded p-2" 
            value={editingTemplate.name}
            placeholder="เช่น สายอนุมัติ ผจก.ภาค"
            onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">รายละเอียด (ไม่บังคับ)</label>
          <input 
            type="text" 
            className="w-full border rounded p-2 text-sm" 
            value={editingTemplate.description || ""}
            onChange={(e) => setEditingTemplate({...editingTemplate, description: e.target.value})}
          />
        </div>

        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border mt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold">ขั้นตอนการอนุมัติ</h4>
            <Button type="button" size="sm" variant="outline" onClick={addStep}>
              <Plus className="h-4 w-4 mr-1" /> เพิ่มขั้นตอน
            </Button>
          </div>
          
          {editingTemplate.steps.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">กดปุ่ม "เพิ่มขั้นตอน" เพื่อเริ่มต้น</p>
          ) : (
            <div className="space-y-3">
              {editingTemplate.steps.map((step, index) => (
                <div key={index} className="flex flex-wrap md:flex-nowrap items-end gap-2 bg-white p-3 rounded border">
                  <div className="w-full md:w-20">
                    <label className="block text-xs text-gray-500 mb-1">ลำดับ</label>
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
                      <option value="">-- เลือก --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full md:w-1/4">
                    <label className="block text-xs text-gray-500 mb-1">เงื่อนไขงบ</label>
                    <select 
                      className="w-full border rounded p-1.5 text-sm" 
                      value={step.budgetCondition}
                      onChange={(e) => updateStep(index, "budgetCondition", e.target.value)}
                    >
                      <option value="ALWAYS">เสมอ</option>
                      <option value="SALES_ONLY">เฉพาะงบขาย</option>
                      <option value="MARKETING_ONLY">เฉพาะงบการตลาด</option>
                      <option value="ANY_BUDGET">เมื่อมีการใช้งบ</option>
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

          <Button onClick={handleSave} disabled={isSaving} className="w-full mt-4">
            {isSaving ? "กำลังบันทึก..." : "บันทึกเทมเพลต"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">รายการเทมเพลตทั้งหมด</h3>
        <Button size="sm" onClick={startNew}>
          <Plus className="h-4 w-4 mr-1" /> สร้างเทมเพลตใหม่
        </Button>
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">ยังไม่มีเทมเพลตสายอนุมัติ</p>
      ) : (
        <div className="grid gap-3">
          {templates.map(t => (
            <div key={t.id} className="p-4 border rounded-lg hover:border-blue-300 transition-colors bg-white shadow-sm flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-lg text-blue-900">{t.name}</h4>
                {t.description && <p className="text-sm text-gray-500">{t.description}</p>}
                <div className="mt-2 text-sm">
                  <span className="font-medium text-gray-700">จำนวน {t.steps.length} ขั้นตอน:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {t.steps.map(s => (
                      <span key={s.id} className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
                        ขั้น {s.stepOrder}: {s.stepName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setEditingTemplate(t)} className="text-blue-600">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
