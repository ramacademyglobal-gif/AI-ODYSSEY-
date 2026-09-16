"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
  /** @deprecated Decorative section IDs removed from UI */
  sec?: string;
  /** @deprecated Decorative section numbers removed from UI */
  index?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={clsx(
        "mb-12 md:mb-16",
        align === "center" ? "text-center flex flex-col items-center" : "text-left",
        className
      )}
    >
      <h2 className="font-serif text-section text-[var(--text-primary)] tracking-tight uppercase">
        {title}
      </h2>
      {subtitle ? (
        <p className="label-tech mt-4 max-w-xl">{subtitle}</p>
      ) : null}
    </motion.div>
  );
}
