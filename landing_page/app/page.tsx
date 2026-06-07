import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import Comparison from "@/components/Comparison";
import Pricing from "@/components/Pricing";
import Faq from "@/components/Faq";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative bg-paper">
      <Nav />
      <Hero />
      <Marquee />
      <HowItWorks />
      <Features />
      <Comparison />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
