import {
  Navbar,
  Hero,
  Features,
  HowItWorks,
  CtaBanner,
  LandingFooter,
} from "@/components/landing";
import { usePageTitle } from "@/hooks";

export function LandingPage() {
  usePageTitle();
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CtaBanner />
      <LandingFooter />
    </div>
  );
}
