import { redirect } from "next/navigation";
import { CHALLENGES, getChallengeBySlug } from "@/data/challenges";

export function generateStaticParams() {
  return CHALLENGES.map((c) => ({ slug: c.slug }));
}

/** Detail routes redirect to the challenges list — statements open in-page via modal. */
export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Validate slug exists; invalid still goes to challenges list
  getChallengeBySlug(slug);
  redirect("/challenges");
}
