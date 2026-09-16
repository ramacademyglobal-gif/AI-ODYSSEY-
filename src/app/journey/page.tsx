import { redirect } from "next/navigation";

/** Journey content lives on /schedule — keep route for legacy links. */
export default function JourneyPage() {
  redirect("/schedule");
}
