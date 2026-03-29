"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  Activity,
  Loader2,
  Filter
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

// 🔥 FIREBASE IMPORTS
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  
  // RAW DATA STATE
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [schoolList, setSchoolList] = useState<string[]>([]);
  
  // FILTER STATE ('ALL', 'B2C', or specific school name)
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const q = query(collection(db, 'Students'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        setAllStudents(students);

        // Extract unique B2B School Names for the dropdown
        const schools = Array.from(
          new Set(
            students
              .filter(s => s.clientType === 'B2B' && s.organizationId)
              .map(s => s.organizationId)
          )
        ) as string[];
        
        setSchoolList(schools);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 🧠 THE BI ENGINE: Recalculates instantly when the filter changes
  const { metrics, recentActivity, chartData } = useMemo(() => {
    // 1. Apply Filter
    let filtered = allStudents;
    if (activeFilter === 'B2C') {
      filtered = allStudents.filter(s => s.clientType !== 'B2B');
    } else if (activeFilter !== 'ALL') {
      filtered = allStudents.filter(s => s.organizationId === activeFilter);
    }

    // 2. Calculate Metrics
    const total = filtered.length;
    const completedTests = filtered.filter(s => s.isTestCompleted);
    const completed = completedTests.length;
    const pending = total - completed;

    // 3. Format Recent Activity
    const recent = completedTests.slice(0, 5).map(s => {
      const date = s.completedAt?.toDate() || new Date();
      return {
        id: s.id,
        name: s.name || 'Unknown Candidate',
        grade: s.classLevel || 'N/A',
        test: "ACET Adaptive",
        time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: "Completed",
        org: s.organizationId || 'B2C Direct',
      };
    });

    // 4. Build Chart Data
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyData = days.map(day => ({ name: day, total: 0 }));
    
    completedTests.forEach(s => {
      if (s.completedAt) {
        const date = s.completedAt.toDate();
        const dayName = days[date.getDay()];
        const dayIndex = weeklyData.findIndex(d => d.name === dayName);
        if (dayIndex !== -1) weeklyData[dayIndex].total += 1;
      }
    });
    
    return {
      metrics: { total, completed, pending },
      recentActivity: recent,
      chartData: [...weeklyData.slice(1), weeklyData[0]] // Start on Monday
    };
  }, [allStudents, activeFilter]);


  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-primary">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Syncing Enterprise Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Command Center</h1>
          <p className="text-muted-foreground">Monitor performance across all your B2C and B2B channels.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          <Filter className="text-gray-400 ml-2" size={18} />
          <select 
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer py-2 pr-8 outline-none"
          >
            <option value="ALL">Global Data (All Students)</option>
            <option value="B2C">B2C Only (Individual Parents)</option>
            <optgroup label="B2B Partner Schools">
              {schoolList.map(school => (
                <option key={school} value={school}>{school}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-primary/10 transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Active Profiles in View</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/10 transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-amber-200 bg-amber-50/30 transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Tests Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700">{metrics.pending}</div>
            <p className="text-xs text-amber-600/80 mt-1">Awaiting candidate login</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/10 transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileBarChart className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for download</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* CHART */}
        <Card className="lg:col-span-4 shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="font-headline">Completion Trend</CardTitle>
            <CardDescription>Daily activity for the selected filter.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip cursor={{fill: '#f5f5f5'}} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.total > 0 ? '#004AAD' : '#38BDF8'} />
                        ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* RECENT ACTIVITY LIST */}
        <Card className="lg:col-span-3 shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="font-headline">Recent Completions</CardTitle>
              <CardDescription>Latest locked profiles in this view.</CardDescription>
            </CardHeader>
            <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No recent activity.</div>
            ) : (
              <div className="space-y-6">
                  {recentActivity.map((student) => (
                  <div key={student.id} className="flex items-center">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.org} • {student.grade}</p>
                      </div>
                      <div className="ml-auto font-medium text-xs text-muted-foreground text-right">
                        {student.time}
                      </div>
                  </div>
                  ))}
              </div>
            )}
            </CardContent>
        </Card>
      </div>

      {/* DETAILED LOG */}
      <Card className="shadow-lg border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-xl">Detailed Roster Log</CardTitle>
            <CardDescription>Comprehensive record of filtered candidate data.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Organization / Source</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Time Completed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Awaiting candidate completions in this filter view...
                  </TableCell>
                </TableRow>
              ) : (
                recentActivity.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/50">
                    
                    {/* 👇 THIS IS THE ONLY LINE WE CHANGED 👇 */}
                    <TableCell className="font-medium">
                      <Link href={`/admin/report/${student.id}`} className="text-[#004AAD] hover:underline font-bold transition-colors">
                        {student.name}
                      </Link>
                    </TableCell>
                    {/* 👆 ================================= 👆 */}

                    <TableCell className="text-muted-foreground">{student.org}</TableCell>
                    <TableCell>{student.grade}</TableCell>
                    <TableCell className="text-muted-foreground">{student.time}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                          {student.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}