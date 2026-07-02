"use client"

import { useState, useEffect } from "react"
import { listActivitiesAction, getActivityDetailsAction, getEmployeesAction, getZoneRolesAction, approveTaskAction, deleteActivityAction } from "../server/actions"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ROLE_LABELS } from "./role-assignment-test"

export function ApprovalBoardTest() {
  const [activities, setActivities] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [zoneRoles, setZoneRoles] = useState<any[]>([])
  const [simulatedEmployeeId, setSimulatedEmployeeId] = useState("all")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [acts, emps, roles] = await Promise.all([
      listActivitiesAction(),
      getEmployeesAction(),
      getZoneRolesAction()
    ])
    setActivities(acts)
    setEmployees(emps)
    setZoneRoles(roles)
  }

  // Filter activities based on the simulated employee
  const filteredActivities = activities.filter(act => {
    if (simulatedEmployeeId === "all") return true
    
    // 1. Can see if they are the creator
    if (act.createdBy.id === simulatedEmployeeId) return true

    // 2. Can see if they are explicitly assigned to approve
    const pendingTasks = act.approvalTasks.filter((t: any) => t.status === "PENDING")
    const isAssigned = pendingTasks.some((task: any) => task.assignedApproverId === simulatedEmployeeId)
    if (isAssigned) return true

    // 3. Fallback: If no explicit assignedApproverId, fall back to matching roles in the zone
    const employeeRoles = zoneRoles.filter(r => r.employeeId === simulatedEmployeeId)
    return pendingTasks.some((task: any) => {
      if (task.assignedApproverId) return false // Only fallback if null
      return employeeRoles.some(er => 
        er.role === task.approverRole && 
        (er.zone === act.zone || er.zone === "All")
      )
    })
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          3. กระดานอนุมัติ (Approval Board)
          <Button variant="outline" onClick={loadData}>Refresh</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-md border flex items-center gap-4">
          <Label className="font-bold">จำลองมุมมองเป็น (Simulate As):</Label>
          <Select value={simulatedEmployeeId} onValueChange={setSimulatedEmployeeId}>
            <SelectTrigger className="w-[250px]"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">-- ดูทั้งหมด (Admin) --</SelectItem>
              {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {filteredActivities.length === 0 && <div className="text-gray-500">No activities found for this user.</div>}
          {filteredActivities.map(act => (
            <ActivityDetailCard 
              key={act.id} 
              activityId={act.id} 
              simulatedEmployeeId={simulatedEmployeeId}
              onRefresh={loadData}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityDetailCard({ activityId, simulatedEmployeeId, onRefresh }: { activityId: string, simulatedEmployeeId: string, onRefresh: () => void }) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    getActivityDetailsAction(activityId).then(setData)
  }, [activityId])

  async function handleApprove(taskId: string, isApproved: boolean) {
    if (simulatedEmployeeId === "all") return alert("กรุณาเลือกชื่อพนักงานเพื่อจำลองการกดอนุมัติ")
    await approveTaskAction(activityId, taskId, simulatedEmployeeId, isApproved)
    const newData = await getActivityDetailsAction(activityId)
    setData(newData)
    onRefresh()
  }

  async function handleDelete() {
    if (confirm("คุณต้องการลบกิจกรรมนี้ใช่หรือไม่?")) {
      await deleteActivityAction(activityId)
      onRefresh()
    }
  }

  function handleEdit() {
    window.location.href = `/activities/test/create?edit=${activityId}`
  }

  if (!data) return <div className="border p-4 rounded-md">Loading...</div>

  // Find first pending task to show action buttons
  const pendingTasks = data.approvalTasks.filter((t: any) => t.status === 'PENDING')
  const nextPendingTask = pendingTasks.length > 0 ? pendingTasks[0] : null
  const canApprove = nextPendingTask && (nextPendingTask.assignedApproverId === simulatedEmployeeId || (simulatedEmployeeId !== "all" && !nextPendingTask.assignedApproverId))
  const isCreator = simulatedEmployeeId === "all" || simulatedEmployeeId === data.createdBy.id

  return (
    <div className="border p-4 rounded-md bg-white">
      <div className="flex justify-between items-start mb-2">
        <div className="font-bold text-lg">{data.title} - <span className="text-gray-600 font-normal">สถานะ (Status): {data.status}</span></div>
        {isCreator && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleEdit}>แก้ไข (Edit)</Button>
            <Button size="sm" variant="destructive" onClick={handleDelete}>ลบ (Delete)</Button>
          </div>
        )}
      </div>
      <div className="text-sm text-gray-500 mb-4 bg-gray-50 p-2 rounded">
        ผู้สร้าง (Created by): {data.createdBy.name} | เขต (Zone): {data.zone}
      </div>
      <div className="mt-2">
        <div className="font-semibold text-sm mb-2 border-b pb-1">ขั้นตอนการอนุมัติ (Approval Flow Log):</div>
        <ul className="text-sm list-disc pl-5 space-y-2">
          {data.approvalTasks.map((t: any) => (
            <li key={t.id} className={t.status === 'APPROVED' ? 'text-green-600' : (t.status === 'REJECTED' ? 'text-red-600' : 'text-orange-600')}>
              <strong>ขั้นที่ {t.step}:</strong> รอการอนุมัติจาก {t.assignedApprover ? t.assignedApprover.name : (ROLE_LABELS[t.approverRole] || t.approverRole)} 
              {t.status === 'APPROVED' && ` (✅ อนุมัติโดย: ${t.approvedBy?.name || 'อัตโนมัติ'}${t.notes ? `, หมายเหตุ: ${t.notes}` : ''})`}
              {t.status === 'REJECTED' && ` (❌ ไม่อนุมัติโดย: ${t.approvedBy?.name || 'อัตโนมัติ'})`}
              
              {t.status === 'PENDING' && nextPendingTask?.id === t.id && canApprove && (
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(t.id, true)}>อนุมัติ (Approve)</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleApprove(t.id, false)}>ไม่อนุมัติ (Reject)</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
