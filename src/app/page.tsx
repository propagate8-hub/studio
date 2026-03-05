"use client";

import React from 'react';

// ⚠️ IMPORTANT: If your generated dashboard file is in a different folder, update this path!
// For example, if it's in a 'components' folder, change it to '../components/AdminDashboard'
import { AdminLayout, DashboardHome } from '../components/AdminDashboard'; 

export default function Home() {
  return (
    <AdminLayout>
      <DashboardHome />
    </AdminLayout>
  );
}