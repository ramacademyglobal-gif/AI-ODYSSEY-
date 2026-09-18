"use client";

import RegistrationFlow from "@/registration/RegistrationPage";
import { RouteVeil } from "@/registration/components/RouteVeil";
import "@/registration/styles/motion.css";

export default function RegisterPage() {
  return (
    <div className="page-stage min-h-screen bg-[var(--bg-primary)]">
      <RouteVeil />
      <RegistrationFlow />
    </div>
  );
}
