# PRIMO Project Memory

## Project Structure
- Monorepo: `/apps/api` (Express+MongoDB), `/apps/web` (Next.js 14), `/packages/shared` (Zod schemas)
- API on port 5000, Web on port 3000
- Start: `yarn dev` from root

## Key Paths
- API models: `apps/api/src/models/`
- API routes: `apps/api/src/routes/`
- Frontend pages: `apps/web/app/`
- Frontend components: `apps/web/components/`
- Shared Zod schemas: `packages/shared/src/schemas/index.ts`
- API client: `apps/web/lib/api.ts`

## Architecture Decisions
- CMS system: key-value store via `/api/v1/cms/content/:key` (GET) and PUT via admin
- Banners: position-based model, fetch via `/api/v1/banners/position/:position`
- Categories: nested (parentId), sorted by `order`, support `showInTopBar` + `topBarOrder`
- React Query for data fetching, Zustand for client state
- `queryKeys` from `lib/query-client.ts` for consistent cache keys

## UI/UX Upgrades Implemented (March 2026)
- Removed "Categories" dropdown from Navbar header
- Added `TopCategoryBar` component inside fixed header (slim strip below main nav)
- Added `HomeQuickStrip` (On Sale + New Arrivals + auto category cards)
- Added `HomeSecondaryBanner` (uses banner position `home_secondary`)
- Search modal upgraded with live autocomplete (debounced, 2+ chars, shows product thumbnail/price)
- Products page header: "Showing X-Y of Z items" + inline search input
- Admin Homepage: new tabs for Category Bar settings + Quick Strip editor
- Banner position `home_secondary` added to model + shared schema
- Category model: added `showInTopBar` (default: true) + `topBarOrder` fields
- Products route: added GET `/products/search?q=term&limit=N` autocomplete endpoint

## Component Locations (new)
- `apps/web/components/layout/TopCategoryBar.tsx`
- `apps/web/components/home/HomeSecondaryBanner.tsx`
- `apps/web/components/home/HomeQuickStrip.tsx`
- `apps/web/components/home/HomeWideBanner.tsx` — full-width image, CMS key `homepage_wide_banner`
- `apps/web/components/home/HomeAppDownload.tsx` — dark app-download CTA, CMS key `homepage_app_download`
- `apps/web/components/home/HomeHowToOrder.tsx` — step-by-step order guide, CMS key `homepage_how_to_order`
- `apps/web/components/home/HomeNewArrivals.tsx` — horizontal scroll carousel newest products, CMS key `homepage_new_arrivals`
- `apps/web/components/home/HomeTabbedProducts.tsx` — Featured/On Sale/Top Rated/New tabs, CMS key `homepage_tabbed_products`
- Navbar: Mega Menu "All Departments" Popover (desktop, DB-driven, shows parent+subcategories)
- Brands.tsx: logos wrapped in `<a href="/products?brand=name">` links

## Navbar Spacer
Header height with category bar: `h-[104px] lg:h-[136px]`
(mobile: 64 nav + 40 catbar; desktop: 32 topbar + 64 nav + 40 catbar)

## Admin CMS Keys
- `homepage_topbar_settings` — TopCategoryBar enable/disable
- `homepage_quick_strip` — QuickStrip settings (showOnSale, showNewArrivals, customShortcuts)
- `homepage_wide_banner` — single full-width image (imageUrl, link, altText, enabled)
- `homepage_how_to_order` — step guide (title, subtitle, ctaText, ctaLink, steps[])
- `homepage_app_download` — app store section (enabled, title, subtitle, badge, appStoreUrl, googlePlayUrl)
- `homepage_tabbed_products` — product tabs (enabled, title, itemsPerTab, tabs[{id,label,enabled}])
- `homepage_new_arrivals` — new arrivals carousel (enabled, title, subtitle, count)
- `homepage_features`, `homepage_hero_badges`, `homepage_hero_categories`, `homepage_hero_promos`
