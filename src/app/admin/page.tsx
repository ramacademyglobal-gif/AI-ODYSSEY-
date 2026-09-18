"use client";

import { Suspense } from "react";
import { ProtectedAdminRoute } from "@/registration/admin/AdminLoginPage";
import { AdminDashboardPage } from "@/registration/admin/AdminDashboardPage";

function DashboardInner() {
  return (
    <ProtectedAdminRoute>
      <AdminDashboardPage />
    </ProtectedAdminRoute>
  );
}

export default function AdminDashboardRoute() {
  return (
    <Suspense
      fallback={
        <main className="page page--admin">
          <p className="lead">Loading…</p>
        </main>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
