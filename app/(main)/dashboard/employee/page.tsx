"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  Clock,
  Bell,
  Target,
  TrendingUp,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

const myTasks = [
  {
    id: 1,
    title: "เตรียมการนำเสนอการขาย",
    deadline: "วันนี้",
    status: "pending",
    priority: "สูง",
  },
  {
    id: 2,
    title: "ติดตามลูกค้าบริษัท X",
    deadline: "พรุ่งนี้",
    status: "pending",
    priority: "ปานกลาง",
  },
  {
    id: 3,
    title: "ส่งรายงานค่าใช้จ่าย",
    deadline: "25 ธ.ค.",
    status: "done",
    priority: "ต่ำ",
  },
  {
    id: 4,
    title: "ทบทวนเป้าหมายไตรมาส 4",
    deadline: "28 ธ.ค.",
    status: "pending",
    priority: "สูง",
  },
];

const announcements = [
  {
    title: "ขอเชิญร่วมงานปาร์ตี้ประจำปี",
    date: "30 ธ.ค.",
    content: "มาร่วมเฉลิมฉลองประจำปีกับเรา!",
  },
  {
    title: "ปิดปรับปรุงระบบ",
    date: "05 ม.ค.",
    content: "เซิร์ฟเวอร์จะปิดให้บริการเป็นเวลา 2 ชั่วโมง",
  },
];

const priorityStyle: Record<string, string> = {
  สูง: "bg-red-100 text-red-700",
  ปานกลาง: "bg-amber-100 text-amber-700",
  ต่ำ: "bg-emerald-100 text-emerald-700",
};

export default function EmployeeDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-8 space-y-8">
      {/* Header */}
 {/* Promotion Placeholder */}
<Card className="border-2 border-dashed border-primary/40 bg-muted/20">
  <CardContent className="flex h-[120px] items-center justify-center">
    <div className="text-center">
      <p className="text-lg font-semibold text-primary">
        พื้นที่สำหรับโปรโมทสินค้าใหม่
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        (สามารถใส่แบนเนอร์ / ข้อความโปรโมชั่น / CTA ได้ในอนาคต)
      </p>
    </div>
  </CardContent>
</Card>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* My Tasks */}
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              งานของฉัน
            </CardTitle>
            <CardDescription>
              คุณมีงานที่รอดำเนินการ{" "}
              {myTasks.filter((t) => t.status !== "done").length} งาน
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {myTasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-center justify-between rounded-xl border bg-card p-4 transition hover:shadow-md hover:-translate-y-[1px]"
              >
                <div className="flex items-start gap-4">
                  {task.status === "done" ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 mt-0.5" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground mt-0.5" />
                  )}

                  <div>
                    <p
                      className={`font-medium leading-tight ${
                        task.status === "done"
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {task.deadline}
                    </div>
                  </div>
                </div>

                <Badge
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    priorityStyle[task.priority]
                  }`}
                >
                  {task.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Performance */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                ประสิทธิภาพการทำงาน
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>การประเมินประจำเดือน</span>
                  <span className="text-muted-foreground">75%</span>
                </div>
                <Progress value={75} className="h-2 rounded-full" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>ความสำเร็จของโครงการ</span>
                  <span className="text-muted-foreground">90%</span>
                </div>
                <Progress value={90} className="h-2 rounded-full" />
              </div>
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>ประกาศ</CardTitle>
            </CardHeader>

            <CardContent>
              <ScrollArea className="h-[220px] pr-4">
                <div className="space-y-4">
                  {announcements.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-lg border p-3 hover:bg-muted/40 transition"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {item.date}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.content}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
