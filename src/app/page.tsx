import HeroSection from "@/components/home/HeroSection";
import PrizesPreview from "@/components/home/PrizesPreview";
import HomeRegisterCTA from "@/components/home/HomeRegisterCTA";
import MissionSection from "@/components/home/MissionSection";
import ChallengesPreview from "@/components/home/ChallengesPreview";
import OrganizersWall from "@/components/home/OrganizersWall";
import JourneyPreview from "@/components/home/JourneyPreview";
import EligibilitySection from "@/components/home/EligibilitySection";
import FinalCTA from "@/components/home/FinalCTA";

export default function HomePage() {
  return (
    <div className="page-shell">
      <HeroSection />
      <PrizesPreview />
      <HomeRegisterCTA />
      <MissionSection />
      <ChallengesPreview />
      <JourneyPreview />
      <OrganizersWall />
      <EligibilitySection />
      <FinalCTA />
    </div>
  );
}
