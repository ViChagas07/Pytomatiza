"use client";

import { SectionWrapper } from "./SectionWrapper";
import { LandingNav } from "./LandingNav";
import { HeroSection } from "./HeroSection";
import { TrustBar } from "./TrustBar";
import { HowItWorksSection } from "./HowItWorksSection";
import { FeaturesSection } from "./FeaturesSection";
import { HighlightSection } from "./HighlightSection";
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
          <TrustBar />
        </SectionWrapper>

        <SectionWrapper>
          <HowItWorksSection />
        </SectionWrapper>

        <SectionWrapper>
          <FeaturesSection />
        </SectionWrapper>

        <SectionWrapper>
          <HighlightSection />
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
