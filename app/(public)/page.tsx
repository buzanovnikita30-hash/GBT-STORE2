import type { Metadata } from "next";
import { AnimateSection } from "@/components/ui/AnimateSection";
import { ChatGptLandingNav } from "@/components/sections/ChatGptLandingNav";
import { ChatWidget } from "@/components/sections/ChatWidget";
import { CompareSection } from "@/components/sections/CompareSection";
import { CrossSellSection } from "@/components/sections/CrossSellSection";
import { FaqSection } from "@/components/sections/FaqSection";
import { FinalCtaSection } from "@/components/sections/FinalCtaSection";
import { GuaranteeSection } from "@/components/sections/GuaranteeSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { ReviewsSection } from "@/components/sections/ReviewsSection";
import { RussiaSection } from "@/components/sections/RussiaSection";
import { SafetySection } from "@/components/sections/SafetySection";
import { Ticker } from "@/components/sections/Ticker";
import { TokenSafetySection } from "@/components/sections/TokenSafetySection";
import { WhyCheaperSection } from "@/components/sections/WhyCheaperSection";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { getPublicSiteOrigin } from "@/lib/app-url";
import { getPublicReviews } from "@/lib/reviews/publicReviews";
import { getStoreConfig } from "@/lib/store-config";

const APP_URL = getPublicSiteOrigin();
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ChatGPT Plus без иностранной карты",
  description:
    "Подключаем ChatGPT Plus и Pro на ваш аккаунт. Оплата картой РФ, активация за 5–15 минут, гарантия на весь срок.",
  openGraph: {
    title: "ChatGPT Plus без иностранной карты — GBT STORE",
    description: "Подключаем ChatGPT Plus и Pro. Оплата картой РФ, активация за 5–15 минут.",
    url: APP_URL,
    siteName: "GBT STORE",
    locale: "ru_RU",
    type: "website",
  },
  alternates: { canonical: APP_URL },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "GBT STORE",
  url: APP_URL,
  description: "Подключение ChatGPT Plus и Pro для пользователей из России. Оплата картой РФ.",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    availableLanguage: "Russian",
  },
};

export default async function HomePage() {
  const storeConfig = await getStoreConfig();
  const reviews = await getPublicReviews(40, {
    uniqueAuthors: true,
  });

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <div className="relative text-gray-900">
      <div className="relative z-10">
        <ChatGptLandingNav />
        <main>
          <HeroSection />
          <AnimateSection><Ticker /></AnimateSection>
          <AnimateSection delay={0.05}><HowItWorksSection /></AnimateSection>
          <AnimateSection delay={0.05}><SafetySection /></AnimateSection>
          <AnimateSection delay={0.05}><TokenSafetySection /></AnimateSection>
          <AnimateSection delay={0.05}><RussiaSection /></AnimateSection>
          <AnimateSection delay={0.05}><WhyCheaperSection /></AnimateSection>
          {storeConfig.landingSections.showReviews && (
            <AnimateSection delay={0.05}><ReviewsSection reviews={reviews} /></AnimateSection>
          )}
          {storeConfig.landingSections.showCompare && (
            <AnimateSection delay={0.05}><CompareSection /></AnimateSection>
          )}
          <AnimateSection delay={0.05}>
            <PricingSection initialPlans={storeConfig.plans} initialLandingDiscounts={storeConfig.landingDiscounts} />
          </AnimateSection>
          <AnimateSection delay={0.05}><GuaranteeSection /></AnimateSection>
          {storeConfig.landingSections.showFaq && (
            <AnimateSection delay={0.05}><FaqSection /></AnimateSection>
          )}
          <AnimateSection delay={0.05}><CrossSellSection /></AnimateSection>
          <AnimateSection delay={0.05}><FinalCtaSection /></AnimateSection>
        </main>
        <LandingFooter />
        <ChatWidget />
      </div>
    </div>
    </>
  );
}
