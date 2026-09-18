"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import CustomCursor from "@/components/common/CustomCursor";
import OpeningIntro from "@/components/common/OpeningIntro";

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <div className="relative bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen overflow-x-hidden font-serif flex flex-col">
        <main className="relative z-10 w-full flex-grow">{children}</main>
      </div>
    );
  }

  return (
    <div className="relative bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen overflow-x-hidden font-serif flex flex-col">
      <OpeningIntro />
      <CustomCursor />
      <Navbar />
      <main className="relative z-10 w-full flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
