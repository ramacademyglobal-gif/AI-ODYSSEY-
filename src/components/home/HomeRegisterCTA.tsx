"use client";

import { motion } from "framer-motion";
import RegistrationButton from "@/components/common/RegistrationButton";
import { EVENT_CONFIG } from "@/config/event";

export default function HomeRegisterCTA() {
  return (
    <section
      id="register-cta"
      className="py-20 md:py-28 border-b border-[#2A2A2A] bg-[#070707] relative overflow-hidden"
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 40%, rgba(255,77,28,0.14), transparent 42%),
            linear-gradient(to right, rgba(42,42,42,0.45) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(42,42,42,0.45) 1px, transparent 1px)
          `,
          backgroundSize: "auto, 48px 48px, 48px 48px",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="space-y-6"
        >
          <p className="font-mono-custom text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#FF4D1C]">
            Ready to compete?
          </p>
          <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-[#F2F0EB] leading-[1.05] tracking-tight">
            24 hours.
            <br />
            One mission.
            <br />
            <span className="italic text-[#FF4D1C]">Are you ready?</span>
          </h2>
          <p className="font-mono-custom text-[10px] sm:text-xs tracking-[0.22em] uppercase text-[#8A8A8A] max-w-md mx-auto leading-relaxed">
            Bring your idea.
            <br />
            Build your solution.
            <br />
            Begin your Odyssey.
          </p>
          <p className="font-mono-custom text-[10px] tracking-[0.2em] uppercase text-[#8A8A8A]/80">
            {EVENT_CONFIG.eventName} · 28–29 September 2026 · {EVENT_CONFIG.city}
          </p>

          <div className="pt-4 flex justify-center">
            <RegistrationButton
              label="REGISTER NOW"
              variant="solid"
              size="lg"
              className="w-full sm:w-auto min-w-[240px]"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
