import { Hero } from "@/components/home/Hero";
import { ProductIntroduction } from "@/components/home/ProductIntroduction";
import { ProductFeatures } from "@/components/home/ProductFeatures";
import { ColourSection } from "@/components/home/ColourSection";
import { FitSection } from "@/components/home/FitSection";
import { MaterialSection } from "@/components/home/MaterialSection";
import { LifestyleSection } from "@/components/home/LifestyleSection";
import { ProductGallery } from "@/components/home/ProductGallery";
import { ProofSection } from "@/components/home/ProofSection";
import { FaqSection } from "@/components/home/FaqSection";
import { FinalPurchase } from "@/components/home/FinalPurchase";
import { ProductTrustStrip } from "@/components/product/ProductTrustStrip";
import { MobilePurchaseBar } from "@/components/layout/MobilePurchaseBar";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Corduroy Dungarees in 100% Cotton | PLEBS",
  description:
    "Discover PLEBS 350 GSM 100% cotton corduroy dungarees, designed with a relaxed fit, practical details and a distinctive mid-wale textured finish.",
  path: "/",
  absoluteTitle: true,
});

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProductTrustStrip />
      <ProductIntroduction />
      <ProductFeatures />
      <ColourSection />
      <FitSection />
      <MaterialSection />
      <LifestyleSection />
      <ProductGallery />
      <ProofSection />
      <FaqSection />
      <FinalPurchase />
      <MobilePurchaseBar />
    </>
  );
}
