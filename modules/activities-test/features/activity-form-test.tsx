"use client"

import { useState, useEffect } from "react"
import { createActivityAction, getEmployeesAction, getActivityDetailsAction, deleteActivityAction } from "../server/actions"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ActivityFormTest() {
  const [employees, setEmployees] = useState<any[]>([])
  const [creatorId, setCreatorId] = useState("")
  const [activityZone, setActivityZone] = useState("Zone 1")
  const [useSalesPromo, setUseSalesPromo] = useState(false)
  const [useMarketingPromo, setUseMarketingPromo] = useState(false)
  const [helperIds, setHelperIds] = useState<string[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  useEffect(() => {
    getEmployeesAction().then(emps => {
      setEmployees(emps)
      if (emps.length > 0) setCreatorId(emps[0].id)
    })

    const searchParams = new URLSearchParams(window.location.search)
    const id = searchParams.get('edit')
    if (id) {
      setEditId(id)
      getActivityDetailsAction(id).then(data => {
        if (data) {
          setCreatorId(data.createdById)
          setActivityZone(data.zone)
          setUseSalesPromo(data.budgets.some((b: any) => b.budgetType === "SALES_PROMOTION"))
          setUseMarketingPromo(data.budgets.some((b: any) => b.budgetType === "MARKETING"))
          if (data.helpers && data.helpers.length > 0) {
            setHelperIds(data.helpers.map((h: any) => h.employeeId))
          }
        }
      })
    }
  }, [])

  async function handleCreateActivity() {
    if (!creatorId) return
    const budgets = []
    if (useSalesPromo) budgets.push({ budgetType: "SALES_PROMOTION", amount: 1000 })
    if (useMarketingPromo) budgets.push({ budgetType: "MARKETING", amount: 2000 })

    const helpers = helperIds.map(id => ({ employeeId: id, helperRole: "SALES" }))

    const data = {
      title: "Test Activity " + Date.now(),
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      activityType: "Demo",
      locationDetails: "Office",
      target: "Test Target",
      details: "Auto generated test",
      zone: activityZone,
      createdById: creatorId,
      budgets,
      helpers
    }

    if (editId) {
      await deleteActivityAction(editId)
    }
    await createActivityAction(data)
    alert(editId ? "อัปเดตกิจกรรมเรียบร้อยแล้ว (ระบบจะคำนวณสายอนุมัติใหม่)" : "จำลองสร้างกิจกรรมเรียบร้อยแล้ว")
    window.location.href = "/activities/test/approvals"
  }

  return (
    <Card>
      <CardHeader><CardTitle>2. {editId ? "แก้ไขกิจกรรม (Edit Activity)" : "สร้างกิจกรรม (Activity Creator)"}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="space-y-2">
            <Label>คนสร้างกิจกรรม</Label>
            <Select value={creatorId} onValueChange={setCreatorId}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>ทำในเขตไหน?</Label>
            <Input value={activityZone} onChange={e => setActivityZone(e.target.value)} className="w-[150px]" />
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={useSalesPromo} onChange={e => setUseSalesPromo(e.target.checked)} />
            ใช้งบส่งเสริมการขาย
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={useMarketingPromo} onChange={e => setUseMarketingPromo(e.target.checked)} />
            ใช้งบการตลาด
          </label>
        </div>
        <div className="space-y-2">
          <Label>มีคนช่วยงานไหม? (เลือกได้หลายคน)</Label>
          <div className="border p-3 rounded-md max-h-40 overflow-y-auto space-y-2 bg-white">
            {employees.length === 0 && <div className="text-gray-500 text-sm">ไม่มีพนักงานให้เลือก</div>}
            {employees.map(e => (
              <label key={e.id} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4"
                  checked={helperIds.includes(e.id)} 
                  onChange={(evt) => {
                    if (evt.target.checked) setHelperIds([...helperIds, e.id])
                    else setHelperIds(helperIds.filter(id => id !== e.id))
                  }} 
                />
                <span className={e.id === creatorId ? "text-gray-400" : ""}>
                  {e.name} {e.id === creatorId && "(คนสร้าง)"}
                </span>
              </label>
            ))}
          </div>
        </div>
        <Button onClick={handleCreateActivity}>{editId ? "บันทึกการแก้ไข (เริ่มสายอนุมัติใหม่)" : "จำลองสร้างกิจกรรม"}</Button>
      </CardContent>
    </Card>
  )
}
