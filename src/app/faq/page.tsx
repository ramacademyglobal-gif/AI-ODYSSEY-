import { redirect } from "next/navigation";

/** FAQ removed — keep legacy URL from breaking. */
export default function FaqRedirectPage() {
  redirect("/");
}
