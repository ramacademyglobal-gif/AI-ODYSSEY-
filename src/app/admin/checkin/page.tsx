"use client";

import { ProtectedAdminRoute } from "@/registration/admin/AdminLoginPage";
import { AdminCheckinPage } from "@/registration/admin/AdminCheckinPage";

export default function AdminCheckinRoute() {
  return (
    <ProtectedAdminRoute>
      <AdminCheckinPage />
    </ProtectedAdminRoute>
  );
}
