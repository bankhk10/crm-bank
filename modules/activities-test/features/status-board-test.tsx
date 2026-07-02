"use client"

import { useState, useEffect } from "react"
import { listActivitiesAction, getEmployeesAction } from "../server/actions"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { CalendarDays, Clock, CheckCircle2, XCircle } from "lucide-react"

export function StatusBoardTest() {
  const [activities, setActivities] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("all")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [acts, emps] = await Promise.all([
      listActivitiesAction(),
      getEmployeesAction()
    ])
    setActivities(acts)
    setEmployees(emps)
  }

  // Filter activities to show only those created by the selected employee (or all)
  const myActivities = activities.filter(act => 
    selectedEmployeeId === "all" || act.createdBy.id === selectedEmployeeId
  )

  const approved = myActivities.filter(a => a.status === 'APPROVED')
  const rejected = myActivities.filter(a => a.status === 'REJECTED')
  const pending = myActivities.filter(a => a.status !== 'APPROVED' && a.status !== 'REJECTED')

  function getStatusBadge(status: string) {
    if (status === 'APPROVED') return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> อนุมัติแล้ว</span>
    if (status === 'REJECTED') return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> ไม่อนุมัติ / ให้แก้ไข</span>
    return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> รออนุมัติ ({status})</span>
  }

  function ActivityList({ items, title, icon, emptyText }: { items: any[], title: string, icon: React.ReactNode, emptyText: string }) {
    return (
      <div className="mb-8">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-b pb-2">
          {icon} {title} ({items.length})
        </h3>
        {items.length === 0 ? (
          <p className="text-gray-500 italic">{emptyText}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(act => {
              const startDate = new Date(act.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
              const endDate = new Date(act.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
              
              return (
                <div key={act.id} className="border p-4 rounded-md bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-base">{act.title}</div>
                    {getStatusBadge(act.status)}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-gray-400" />
                      <span>{startDate} - {endDate}</span>
                    </div>
                    <div>📍 เขต: {act.zone}</div>
                    <div>ผู้สร้าง: {act.createdBy.name}</div>
                  </div>
                  
                  {act.status !== 'APPROVED' && act.status !== 'REJECTED' && (
                    <div className="mt-3 pt-3 border-t text-sm bg-gray-50 p-2 rounded">
                      <div className="font-semibold text-gray-700">สถานะปัจจุบัน:</div>
                      <div className="text-orange-600">
                        กำลังรอการอนุมัติในขั้น {act.status.replace('PENDING_', '')}
                      </div>
                    </div>
                  )}
                  
                  {act.status === 'REJECTED' && (
                    <div className="mt-3 pt-3 border-t text-sm bg-red-50 p-2 rounded">
                      <div className="text-red-700 font-semibold">รายการนี้ถูกปฏิเสธหรือส่งกลับให้แก้ไข</div>
                      <button 
                        onClick={() => window.location.href = `/activities/test/create?edit=${act.id}`}
                        className="mt-2 text-xs bg-white border border-red-200 text-red-600 px-3 py-1 rounded hover:bg-red-50"
                      >
                        กดที่นี่เพื่อแก้ไขกิจกรรม
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          หน้าของฉัน: ปฏิทินและสถานะกิจกรรม
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-md border flex items-center gap-4">
          <Label className="font-bold">ดูข้อมูลของพนักงาน:</Label>
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger className="w-[250px]"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">-- ดูทั้งหมด (Admin) --</SelectItem>
              {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-white p-4">
          <ActivityList 
            items={pending} 
            title="กำลังดำเนินการ (รออนุมัติ)" 
            icon={<Clock className="text-orange-500" />}
            emptyText="ไม่มีกิจกรรมที่รออนุมัติ"
          />
          
          <ActivityList 
            items={approved} 
            title="อนุมัติเรียบร้อยแล้ว (ลงปฏิทิน)" 
            icon={<CheckCircle2 className="text-green-500" />}
            emptyText="ไม่มีกิจกรรมที่อนุมัติแล้ว"
          />
          
          <ActivityList 
            items={rejected} 
            title="ถูกตีกลับ / ให้แก้ไข" 
            icon={<XCircle className="text-red-500" />}
            emptyText="ไม่มีกิจกรรมที่ถูกตีกลับ"
          />
        </div>
      </CardContent>
    </Card>
  )
}
