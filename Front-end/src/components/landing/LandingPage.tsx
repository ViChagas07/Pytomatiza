"use client";

import { SectionWrapper } from "./SectionWrapper";
import { LandingNav } from "./LandingNav";
import { HeroSection } from "./HeroSection";
import { SocialProofSection } from "./SocialProofSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { FeaturesSection } from "./FeaturesSection";
import { DemoSection } from "./DemoSection";
import { BenefitsSection } from "./BenefitsSection";
import { UseCasesSection } from "./UseCasesSection";
import { CTASection } from "./CTASection";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--surface-0)]">
      <LandingNav />

      <main id="main-content" className="pt-14">
        <SectionWrapper>
          <HeroSection />
        </SectionWrapper>

        <SectionWrapper>
          <SocialProofSection />
        </SectionWrapper>

        <SectionWrapper>
          <HowItWorksSection />
        </SectionWrapper>

        <SectionWrapper>
          <FeaturesSection />
        </SectionWrapper>

        <SectionWrapper>
          <DemoSection />
        </SectionWrapper>

        <SectionWrapper>
          <BenefitsSection />
        </SectionWrapper>

        <SectionWrapper>
          <UseCasesSection />
        </SectionWrapper>

        <SectionWrapper>
          <CTASection />
        </SectionWrapper>
      </main>

      <LandingFooter />
    </div>
  );
}
