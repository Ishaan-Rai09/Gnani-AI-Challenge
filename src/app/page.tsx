import { SiteNav } from "@/components/landing/SiteNav";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Trust } from "@/components/landing/Trust";
import { DemoCta } from "@/components/landing/DemoCta";
import { SiteFooter } from "@/components/landing/SiteFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ivory">
      <SiteNav />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <Trust />
        <DemoCta />
      </main>
      <SiteFooter />
    </div>
  );
}
