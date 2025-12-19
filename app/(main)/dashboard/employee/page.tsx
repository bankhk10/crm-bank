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
  FolderKanban,
  MessageSquare,
  Bell,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

const myTasks = [
  {
    id: 1,
    title: "Prepare Sales Presentation",
    deadline: "Today",
    status: "pending",
    priority: "High",
  },
  {
    id: 2,
    title: "Follow up with Client X",
    deadline: "Tomorrow",
    status: "pending",
    priority: "Medium",
  },
  {
    id: 3,
    title: "Submit Expense Report",
    deadline: "Dec 25",
    status: "done",
    priority: "Low",
  },
  {
    id: 4,
    title: "Review Q4 Goals",
    deadline: "Dec 28",
    status: "pending",
    priority: "High",
  },
];

const announcements = [
  {
    title: "Annual Party Invitation",
    date: "Dec 30",
    content: "Join us for the annual celebration!",
  },
  {
    title: "System Maintenance",
    date: "Jan 05",
    content: "Server will be down for 2 hours.",
  },
];

export default function EmployeeDashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-8 bg-muted/10 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back, User!
          </h1>
          <p className="text-muted-foreground">
            Here is what's happening today.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-full bg-background border hover:bg-muted relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-background" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
            <CardDescription>You have 3 tasks pending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {task.status === "done" ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                    <div className="space-y-1">
                      <p
                        className={`font-medium ${
                          task.status === "done"
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {task.deadline}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      task.priority === "High"
                        ? "destructive"
                        : task.priority === "Medium"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Monthly Assessment</span>
                  <span className="text-muted-foreground">75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Project Completion</span>
                  <span className="text-muted-foreground">90%</span>
                </div>
                <Progress value={90} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-4">
                  {announcements.map((item, i) => (
                    <div
                      key={i}
                      className="space-y-1 pb-4 mb-4 border-b last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{item.title}</p>
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
