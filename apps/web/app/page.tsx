import {
  PromoBanners,
  HomeQuickStrip,
  HomeSecondaryBanner,
  HomeProductSection,
  HomeNewArrivals,
  HomeWideBanner,
  HomeHowToOrder,
  HomeAppDownload,
  Features,
  Brands,
  Categories,
  WhyChooseUs,
  DealsSection,
  Testimonials,
  Newsletter,
} from '@/components/home';

// Set to true when trust badges should be visible on the homepage
const TRUST_BADGES_ENABLED = false;

export default function HomePage() {
  return (
    <>
      {/* 1. Promo Banners — two stacked image banners, fully admin-controlled */}
      <PromoBanners />

      {/* 2. Quick Icon Strip — On Sale, New Arrivals, category shortcuts */}
      <HomeQuickStrip />

      {/* 3. Secondary promo banner — admin banners (position: home_secondary) */}
      <HomeSecondaryBanner />

      {/* 4. Featured Products — hand-picked by admin */}
      <HomeProductSection
        queryKey="products-featured-section"
        title="Featured Products"
        subtitle="Hand-picked for you"
        viewAllHref="/products?featured=true"
        queryParams={{ featured: true }}
        tabId="featured"
        bg="bg-beige-50"
        limit={8}
      />

      {/* 5. On Sale — high conversion, show discounted items */}
      <HomeProductSection
        queryKey="products-on-sale-section"
        title="On Sale"
        subtitle="Limited-time offers"
        viewAllHref="/products?onSale=true"
        queryParams={{ onSale: true, sort: '-discount' }}
        tabId="on_sale"
        bg="bg-white"
        limit={8}
      />

      {/* 6. New Arrivals carousel — horizontal scroll, freshness signal */}
      <HomeNewArrivals />

      {/* 7. Flash Deals — urgency via countdown timer (moved up for higher impact) */}
      <DealsSection />

      {/* 8. Top Rated — social proof, auto-hides if no ratings */}
      <HomeProductSection
        queryKey="products-top-rated-section"
        title="Top Rated"
        subtitle="Customer favourites"
        viewAllHref="/products?sort=rating"
        queryParams={{ sort: '-averageRating' }}
        tabId="top_rated"
        bg="bg-beige-50"
        limit={8}
        requireRatings
      />

      {/* 9. Wide promo banner — full-width campaign image */}
      <HomeWideBanner />

      {/* 10. Browse by Category — icon grid */}
      <Categories />

      {/* 11. Authorized Brands carousel — trust + click to filter */}
      <Brands />

      {/* 12. How to Order — reduce purchase friction */}
      <HomeHowToOrder />

      {/* 13. Why Choose Us — trust building */}
      <WhyChooseUs />

      {/* 14. Customer Testimonials — social proof */}
      <Testimonials />

      {/* 15. Download PRIMO App — mobile conversion */}
      <HomeAppDownload />

      {/* 16. Trust badges — free shipping, warranty, returns, support */}
      {/* Toggle TRUST_BADGES_ENABLED = true above to re-enable */}
      {TRUST_BADGES_ENABLED && <Features />}

      {/* 17. Newsletter — retain visitors */}
      <Newsletter />
    </>
  );
}
