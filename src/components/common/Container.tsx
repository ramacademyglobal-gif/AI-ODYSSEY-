import React from "react";
import { clsx } from "clsx";

interface ContainerProps {
  children: React.ReactNode;
  size?: "wide" | "editorial" | "narrow" | "full";
  className?: string;
  id?: string;
}

/**
 * Global Responsive Fluid Layout System for AI ODYSSEY
 * Provides spacious horizontal utilization across 1440px, 1536px, 1920px & 2560px displays
 * while maintaining disciplined text readability.
 */
export function Container({
  children,
  size = "wide",
  className,
  id,
}: ContainerProps) {
  const sizeClasses = {
    // Wide sections (Hero, Grids, Navbar, Footer, Timeline, CTAs)
    wide: "max-w-[1680px] 2xl:max-w-[1820px] w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20",
    // Editorial & Content-rich pages (About narrative, Detailed briefs, FAQ split)
    editorial: "max-w-[1480px] 2xl:max-w-[1600px] w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-16",
    // Reading focused areas (Rulebook details)
    narrow: "max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8",
    // Unconstrained Full Bleed
    full: "w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20"
  };

  return (
    <div id={id} className={clsx(sizeClasses[size], className)}>
      {children}
    </div>
  );
}

export default Container;
