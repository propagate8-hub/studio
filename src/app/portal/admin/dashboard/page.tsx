
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  FileBarChart, 
  ArrowUpRight,
  User,
  Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  Cell,
  CartesianGrid
} from "recharts";

const data = [
  { name: "Mon", total: 12 },
  { name: "Tue", total: 18 },
  { name: "Wed", total: 15 },
  { name: "Thu", total: 22 },
  { name: "Fri", total: 30 },
  { name: "Sat", total: 5 },
  { name: "Sun", total: 2 },
];

const recentActivity = [
  { id: 1, name: "Chinedu Okafor", grade: "JSS 3", test: "ACET Adaptive", time: "2 hours ago", status: "Completed" },
  { id: 2, name: "Amina Yusuf", grade: "JSS 3", test: "ACET Adaptive", time: "4 hours ago", status: "Completed" },
  { id: 3, name: "Tunde Balogun", grade: "JSS 3", test: "ACET Adaptive", time: "Yesterday", status: "Completed" },
  { id: 4, name: "Bisi Adebayo", grade: "JSS 3", test: "ACET Adaptive", time: "Yesterday", status: "Completed" },
  { id: 5, name: "Obi Nwosu", grade: "JSS 3", test: "ACET Adaptive", time: "2 days ago", status: "Completed" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Overview</h1>
          <p className="text-muted-foreground">Monitor school enrollment, assessment syncs, and report generation.</p>
        </div>
        <Button className="font-bold">
            <Activity className="mr-2 h-4 w-4" />
            Live Monitor
        </Button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-primary/10 transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrolled Students</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">120</div>
            <p className="text-xs text-muted-foreground mt-1">+4 from last week</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/10 transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">85</div>
            <p className="text-xs text-muted-foreground mt-1">71% participation rate</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-amber-200 bg-amber-50/30 transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Tests Pending Sync</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700">12</div>
            <p className="text-xs text-amber-600/80 mt-1">Tablets requiring connection</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/10 transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileBarChart className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">45</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for download</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm border-none">
          <CardHeader>
            <CardTitle className="font-headline">Test Completion Trend</CardTitle>
            <CardDescription>Daily completions recorded over the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    />
                    <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                        cursor={{fill: '#f5f5f5'}} 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 4 ? '#004AAD' : '#38BDF8'} />
                        ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-sm border-none">
            <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="font-headline">Recent Activity</CardTitle>
                <CardDescription>Latest student test completions.</CardDescription>
            </div>
            </CardHeader>
            <CardContent>
            <div className="space-y-8">
                {recentActivity.slice(0, 5).map((student) => (
                <div key={student.id} className="flex items-center">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{student.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {student.test} • {student.grade}
                    </p>
                    </div>
                    <div className="ml-auto font-medium text-xs text-muted-foreground">
                    {student.time}
                    </div>
                </div>
                ))}
            </div>
            <Button variant="outline" className="w-full mt-6" asChild>
                <Link href="/portal/admin/students">View All Activity</Link>
            </Button>
            </CardContent>
        </Card>
      </div>

      {/* Main Activity Table */}
      <Card className="shadow-lg border-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-xl">Detailed Log</CardTitle>
            <CardDescription>Comprehensive record of recent assessment data.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/portal/admin/students" className="gap-1">
                Full Roster <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Student Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Assessment</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((student) => (
                <TableRow key={student.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                        </div>
                        {student.name}
                    </div>
                  </TableCell>
                  <TableCell>{student.grade}</TableCell>
                  <TableCell>{student.test}</TableCell>
                  <TableCell className="text-muted-foreground">{student.time}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                        {student.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
