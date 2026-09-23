"use client";

import { Suspense } from "react";
import RegistrationFlow from "@/registration/RegistrationPage";
import { RegistrationClosed } from "@/registration/components/RegistrationClosed";
import { RouteVeil } from "@/registration/components/RouteVeil";
import "@/registration/styles/motion.css";

export default function RegisterPage() {
  return (
    <div className="page-stage min-h-screen bg-[var(--bg-primary)]">
      <RouteVeil />
      <Suspense fallback={<RegistrationClosed checking />}>
        <RegistrationFlow />
      </Suspense>
    </div>
  );
}
