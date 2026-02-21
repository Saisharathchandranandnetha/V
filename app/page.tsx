import { LandingNavbar } from '@/components/landing/navbar';
import { LandingHero } from '@/components/landing/hero';
import { SocialProofBar } from '@/components/landing/social-proof';
import { ProblemSection } from '@/components/landing/problem';
import { FeaturesSection } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Testimonials } from '@/components/landing/testimonials';
import { PricingSection } from '@/components/landing/pricing';
import { FinalCTA } from '@/components/landing/final-cta';
import { LandingFooter } from '@/components/landing/footer';
import { SmoothScrollWrapper } from '@/components/ui/smooth-scroll-wrapper';

export default function LandingPage() {
  return (
    <SmoothScrollWrapper>
      <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary">
        <LandingNavbar />

        <LandingHero />

        <SocialProofBar />

        <ProblemSection />

        <FeaturesSection />

        <HowItWorks />

        <Testimonials />

        <PricingSection />

        <FinalCTA />

        <LandingFooter />
      </main>
    </SmoothScrollWrapper>
  );
}
