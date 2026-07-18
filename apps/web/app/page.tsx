import {
  PromoBanners,
  HomeSecondaryBanner,
  HomeProductSection,
  HomeBestSellers,
  HomeShopByPrice,
  HomeCategorySpotlight,
  HomeBuyingGuides,
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
  RecentlyViewed,
} from '@/components/home';

export default function HomePage() {
  return (
    <>
      {/* 1. Promo Banners — the campaign artwork lands immediately under the
          header. Nothing is allowed above it: the header already carries the
          category navigation, so anything else here just delays the hero. */}
      <PromoBanners />

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

      {/* 4b. Best Sellers — what customers actually buy; strongest social proof
          on the page. Hides itself until something has genuinely sold. */}
      <HomeBestSellers />

      {/* 4c. Shop by Price — budget-first entry points into the filtered
          listing, for visitors who know their spend but not their category. */}
      <HomeShopByPrice />

      {/* 5. On Sale — high conversion, show discounted items */}
      <HomeProductSection
        queryKey="products-on-sale-section"
        title="On Sale"
        subtitle="Limited-time offers"
        viewAllHref="/products?onSale=true"
        queryParams={{ onSale: true, sort: 'discount' }}
        tabId="on_sale"
        bg="bg-white"
        limit={8}
      />

      {/* 5b. Recently Viewed — personalised re-entry point, hides itself when empty */}
      <RecentlyViewed />

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
        queryParams={{ sort: 'rating' }}
        tabId="top_rated"
        bg="bg-beige-50"
        limit={8}
        requireRatings
      />

      {/* 9. Wide promo banner — full-width campaign image */}
      <HomeWideBanner />

      {/* 10. Browse by Category — icon grid */}
      <Categories />

      {/* 10b. Category Spotlight — takes the largest category from the grid
          above and shows what's actually on its shelf. */}
      <HomeCategorySpotlight />

      {/* 11. Authorized Brands carousel — trust + click to filter */}
      <Brands />

      {/* 12. How to Order — reduce purchase friction */}
      <HomeHowToOrder />

      {/* 12b. Service promises — free delivery, VAT, authorized dealer, returns.
          Kept OUT of the hero area: the top of the page is for the campaign
          artwork and the products. These read better as reassurance further
          down, next to the other trust content. */}
      <Features />

      {/* 13. Why Choose Us — trust building */}
      <WhyChooseUs />

      {/* 13b. Buying Guides — keeps considered-purchase research on-site.
          Renders nothing when no blog posts are published. */}
      <HomeBuyingGuides />

      {/* 14. Customer Testimonials — social proof */}
      <Testimonials />

      {/* 15. Download PRIMO App — mobile conversion */}
      <HomeAppDownload />

      {/* 16. Newsletter — retain visitors */}
      <Newsletter />
    </>
  );
}
