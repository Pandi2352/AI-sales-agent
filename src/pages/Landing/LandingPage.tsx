import {
  Navbar,
  Hero,
  Features,
  HowItWorks,
  CtaBanner,
  LandingFooter,
} from "@/components/landing";

export function LandingPage() {
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
