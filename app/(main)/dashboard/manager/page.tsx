"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Target, Briefcase, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const teamPerformanceData = [
  { name: "Team A", sales: 4000, target: 2400 },
  { name: "Team B", sales: 3000, target: 1398 },
  { name: "Team C", sales: 2000, target: 9800 },
  { name: "Team D", sales: 2780, target: 3908 },
  { name: "Team E", sales: 1890, target: 4800 },
];

const weeklyTrendData = [
  { day: "Mon", tasks: 12 },
  { day: "Tue", tasks: 19 },
  { day: "Wed", tasks: 15 },
  { day: "Thu", tasks: 22 },
  { day: "Fri", tasks: 28 },
  { day: "Sat", tasks: 10 },
  { day: "Sun", tasks: 5 },
];

const recentActivities = [
  {
    user: "Alice Smith",
    action: "Closed deal with TechCorp",
    time: "2 hours ago",
    amount: "฿50,000",
  },
  {
    user: "Bob Jones",
    action: "Updated client proposal",
    time: "4 hours ago",
    amount: "",
  },
  {
    user: "Charlie Brown",
    action: "Meeting with New Client",
    time: "Yesterday",
    amount: "",
  },
];

export default function ManagerDashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-8 bg-muted/10 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Manager Dashboard
          </h1>
          <p className="text-muted-foreground">
            ภาพรวมประสิทธิภาพทีมและการจัดการงาน
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow bg-linear-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-950 border-blue-100 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Team Target Achievement
            </CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              Of monthly goal reached
            </p>
            <div className="mt-4 h-2 w-full bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 w-[85%] rounded-full" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 nearing deadline</p>
            <div className="flex -space-x-2 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <Avatar key={i} className="h-8 w-8 border-2 border-background">
                  <AvatarFallback>U{i}</AvatarFallback>
                </Avatar>
              ))}
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs ml-2 border-2 border-background">
                +5
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Team Productivity
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">High</div>
            <p className="text-xs text-muted-foreground">+12% vs last week</p>
            <div className="h-[60px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrendData}>
                  <Area
                    type="monotone"
                    dataKey="tasks"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.2}
                  />
                  <Tooltip cursor={false} content={<></>} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Team Performance Overview</CardTitle>
            <CardDescription>Sales vs Targets by Team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamPerformanceData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="name"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                    }}
                  />
                  <Bar
                    dataKey="sales"
                    name="Sales"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="target"
                    name="Target"
                    fill="hsl(var(--muted))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activites</CardTitle>
            <CardDescription>Latest updates from your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {activity.user.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.user}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.action}
                    </p>
                    {activity.amount && (
                      <Badge variant="secondary" className="mt-1">
                        {activity.amount}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t text-center text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              View all activities
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
