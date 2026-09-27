import type { Metadata } from "next";
import { HallDisplay } from "@/components/hackathon/HallDisplay";

export const metadata: Metadata = {
  title: "Hall display",
  robots: { index: false, follow: false },
};

export default function DisplayPage() {
  return <HallDisplay />;
}
