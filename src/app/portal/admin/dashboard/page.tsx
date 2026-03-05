
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
  User
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const recentActivity = [
  { id: 1, name: "Chinedu Okafor", grade: "JSS 3", test: "ACET", time: "2 hours ago", status: "Completed" },
  { id: 2, name: "Amina Yusuf", grade: "JSS 3", test: "ACET", time: "4 hours ago", status: "Completed" },
  { id: 3, name: "Tunde Balogun", grade: "JSS 3", test: "ACET", time: "Yesterday", status: "Completed" },
  { id: 4, name: "Bisi Adebayo", grade: "JSS 3", test: "ACET", time: "Yesterday", status: "Completed" },
  { id: 5, name: "Obi Nwosu", grade: "JSS 3", test: "ACET", time: "2 days ago", status: "Completed" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline text-primary">Dashboard Overview</h1>
        <p className="text-muted-foreground">Monitor school enrollment, assessment syncs, and report generation.</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrolled Students</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">120</div>
            <p className="text-xs text-muted-foreground mt-1">+4 from last week</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">85</div>
            <p className="text-xs text-muted-foreground mt-1">71% participation rate</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-amber-200 bg-amber-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Tests Pending Sync</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700">12</div>
            <p className="text-xs text-amber-600/80 mt-1">Tablets requiring connection</p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-primary/10">
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

      {/* Recent Activity Table */}
      <Card className="shadow-lg border-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline">Recent Activity</CardTitle>
            <CardDescription>Latest student completions across all test categories.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/portal/admin/students" className="gap-1">
                View All <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
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
