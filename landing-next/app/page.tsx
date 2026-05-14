import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { LogosStrip } from "@/components/logos-strip";
import { Problem } from "@/components/problem";
import { HowItWorks } from "@/components/how-it-works";
import { Features } from "@/components/features";
import { Security } from "@/components/security";
import { Services } from "@/components/services";
import { Install } from "@/components/install";
import { FAQ } from "@/components/faq";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="relative">
      <Nav />
      <main>
        <Hero />
        <LogosStrip />
        <Problem />
        <HowItWorks />
        <Features />
        <Security />
        <Services />
        <Install />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
