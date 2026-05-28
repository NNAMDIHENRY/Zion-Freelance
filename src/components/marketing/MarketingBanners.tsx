import { HomepageBannerCarousel } from "@/components/marketing/HomepageBannerCarousel";
import { getActivePlatformBanners } from "@/lib/marketing/banners";

export async function MarketingBanners() {
  const slides = await getActivePlatformBanners();
  if (!slides.length) return null;
  return <HomepageBannerCarousel slides={slides} />;
}
