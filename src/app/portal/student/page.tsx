"use client";

import { StudentPortal } from "@/components/StudentPortal";

/**
 * Student Testing Portal Route
 * This is the distraction-free entry point for students taking the ACET.
 */
export default function StudentPortalPage() {
  return (
    <main className="min-h-screen bg-background">
      <StudentPortal />
    </main>
  );
}