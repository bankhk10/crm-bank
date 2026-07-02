"use client"

import { useState, useEffect } from "react"
import { assignZoneRoleAction, createActivityAction, getEmployeesAction, listActivitiesAction, getActivityDetailsAction } from "../server/actions"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function TestDashboard() {
  const [employees, setEmployees] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")
  const [selectedRole, setSelectedRole] = useState("PROMOTER")
  const [zone, setZone] = useState("Zone 1")

  // Activity Form State
  const [creatorId, setCreatorId] = useState("")
  const [activityZone, setActivityZone] = useState("Zone 1")
  const [useSalesPromo, setUseSalesPromo] = useState(false)
  const [useMarketingPromo, setUseMarketingPromo] = useState(false)
  const [helperId, setHelperId] = useState("none")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const emps = await getEmployeesAction()
    setEmployees(emps)
    if (emps.length > 0) {
      setSelectedEmployeeId(emps[0].id)
      setCreatorId(emps[0].id)
    }
    const acts = await listActivitiesAction()
    setActivities(acts)
  }

  async function handleAssignRole() {
    if (!selectedEmployeeId) return
    await assignZoneRoleAction(selectedEmployeeId, selectedRole as any, zone)
    alert("Assigned successfully")
  }

  async function handleCreateActivity() {
    if (!creatorId) return
    const budgets = []
    if (useSalesPromo) budgets.push({ budgetType: "SALES_PROMOTION", amount: 1000 })
    if (useMarketingPromo) budgets.push({ budgetType: "MARKETING", amount: 2000 })

    const helpers = []
    if (helperId && helperId !== "none") helpers.push({ employeeId: helperId, helperRole: "SALES" })

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

    await createActivityAction(data)
    alert("Created activity")
    loadData()
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Activity Flow Test Dashboard</h1>

      {/* Part 1: Role Assignment */}
      <Card>
        <CardHeader><CardTitle>1. จำลองสิทธิ์พนักงาน (Role & Zone Assignment)</CardTitle></CardHeader>
        <CardContent className="flex gap-4 items-end">
          <div className="space-y-2">
            <Label>พนักงาน</Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="เลือกพนักงาน" /></SelectTrigger>
              <SelectContent>
                {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>ตำแหน่ง</Label>
            <Select value={selectedRole} onValueChange={(v: any) => setSelectedRole(v)}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[
                  "PROMOTER",
                  "SALES",
                  "REGIONAL_MANAGER",
                  "MARKETING",
                  "MARKETING_MANAGER",
                  "SALES_ADMIN_MANAGER",
                  "SALES_DIRECTOR"
                ].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>เขต (Zone)</Label>
            <Input value={zone} onChange={e => setZone(e.target.value)} className="w-[150px]" />
          </div>
          <Button onClick={handleAssignRole}>มอบสิทธิ์</Button>
        </CardContent>
      </Card>

      {/* Part 2: Create Activity */}
      <Card>
        <CardHeader><CardTitle>2. สร้างกิจกรรม (Activity Creator)</CardTitle></CardHeader>
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
            <Label>มีคนช่วยงานไหม?</Label>
            <Select value={helperId} onValueChange={setHelperId}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="ไม่มี" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">(ไม่มีคนช่วย)</SelectItem>
                {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreateActivity}>จำลองสร้างกิจกรรม</Button>
        </CardContent>
      </Card>

      {/* Part 3: Approval Board */}
      <Card>
        <CardHeader><CardTitle>3. กระดานอนุมัติ (Approval Board)</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map(act => (
              <ActivityDetailCard key={act.id} activityId={act.id} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ActivityDetailCard({ activityId }: { activityId: string }) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    getActivityDetailsAction(activityId).then(setData)
  }, [activityId])

  if (!data) return <div>Loading...</div>

  return (
    <div className="border p-4 rounded-md">
      <div className="font-bold">{data.title} - Status: {data.status}</div>
      <div className="text-sm text-gray-500">
        Created by: {data.createdBy.name} | Zone: {data.zone}
      </div>
      <div className="mt-2">
        <div className="font-semibold text-sm">Approval Flow Log:</div>
        <ul className="text-sm list-disc pl-5">
          {data.approvalTasks.map((t: any) => (
            <li key={t.id} className={t.status === 'APPROVED' ? 'text-green-600' : 'text-orange-600'}>
              Step {t.step} - Waiting for {t.approverRole} 
              {t.status === 'APPROVED' && ` (Approved: ${t.notes || ''})`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
