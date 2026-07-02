"use client"

import { useState, useEffect } from "react"
import { assignZoneRoleAction, getEmployeesAction, getZoneRolesAction, deleteZoneRoleAction } from "../server/actions"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const ROLE_LABELS: Record<string, string> = {
  PROMOTER: "ส่งเสริมการขาย",
  SALES: "เซลส์",
  REGIONAL_MANAGER: "ผู้จัดการภาค",
  SALES_ADMIN_MANAGER: "ผู้จัดการแผนกบริหารงานขาย",
  SALES_DIRECTOR: "ผู้จัดการขายฝ่าย",
  MARKETING: "พนักงานการตลาด",
  MARKETING_MANAGER: "ผู้จัดผแนกการตลาด",
}

export function RoleAssignmentTest() {
  const [employees, setEmployees] = useState<any[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")
  const [selectedRole, setSelectedRole] = useState("PROMOTER")
  const [zone, setZone] = useState("Zone 1")
  const [supervisorId, setSupervisorId] = useState("none")
  const [assignedRoles, setAssignedRoles] = useState<any[]>([])

  useEffect(() => {
    getEmployeesAction().then(emps => {
      setEmployees(emps)
      if (emps.length > 0) setSelectedEmployeeId(emps[0].id)
    })
    loadRoles()
  }, [])

  function loadRoles() {
    getZoneRolesAction().then(setAssignedRoles)
  }

  async function handleAssignRole() {
    if (!selectedEmployeeId) return
    const supId = supervisorId === "none" ? null : supervisorId
    await assignZoneRoleAction(selectedEmployeeId, selectedRole as any, zone, supId)
    loadRoles()
  }

  async function handleDeleteRole(role: any) {
    await deleteZoneRoleAction(role.employeeId, role.role as any, role.zone)
    loadRoles()
  }

  return (
    <Card>
      <CardHeader><CardTitle>1. จำลองสิทธิ์พนักงาน (Role & Zone Assignment)</CardTitle></CardHeader>
      <CardContent className="flex gap-4 items-end flex-wrap">
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
              ].map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r] || r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>เขต (Zone)</Label>
          <Input value={zone} onChange={e => setZone(e.target.value)} className="w-[150px]" />
        </div>
        <div className="space-y-2">
          <Label>หัวหน้าสายตรง (Supervisor)</Label>
          <Select value={supervisorId} onValueChange={setSupervisorId}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="เลือกหัวหน้า" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">-- ไม่มีหัวหน้า --</SelectItem>
              {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAssignRole}>มอบสิทธิ์</Button>
      </CardContent>
      <div className="border-t p-6 mt-4">
        <h3 className="font-bold mb-4">สิทธิ์ปัจจุบัน</h3>
        <ul className="space-y-2">
          {assignedRoles.map(r => (
            <li key={`${r.employeeId}-${r.role}-${r.zone}`} className="flex items-center justify-between border p-3 rounded-md text-sm">
              <div>
                <strong>{r.employee.name}</strong> เป็น <strong>{ROLE_LABELS[r.role] || r.role}</strong> ใน <strong>{r.zone}</strong>
                {r.supervisor && <span> (หัวหน้าคือ: <strong>{r.supervisor.name}</strong>)</span>}
              </div>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteRole(r)}>ลบ</Button>
            </li>
          ))}
          {assignedRoles.length === 0 && <li className="text-gray-500">ไม่มีสิทธิ์ถูกกำหนดไว้</li>}
        </ul>
      </div>
    </Card>
  )
}
