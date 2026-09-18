"use client";

import { Suspense } from "react";
import { ProtectedAdminRoute } from "@/registration/admin/AdminLoginPage";
import { AdminParticipantsPage } from "@/registration/admin/AdminParticipantsPage";

function ParticipantsInner() {
  return (
    <ProtectedAdminRoute>
      <AdminParticipantsPage />
    </ProtectedAdminRoute>
  );
}

export default function AdminParticipantsRoute() {
  return (
    <Suspense
      fallback={
        <main className="page page--admin">
          <p className="lead">Loading…</p>
        </main>
      }
    >
      <ParticipantsInner />
    </Suspense>
  );
}
