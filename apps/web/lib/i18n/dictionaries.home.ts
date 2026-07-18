// ============================================
// Translation namespace: home
// ============================================
// Extra keys for the home surfaces. Kept in its own module so separate areas can
// grow independently without fighting over one file. Merged into the lookup by
// ./index.tsx — `en` is the source of truth and every key added here MUST also
// be added to `ar`, otherwise TypeScript will fail the build.

export const en = {
  // ── Announcement bar / top category bar ───────────────────────────────────
  'home.freeShippingDefault': 'Free shipping on orders over SAR 500 🚚',
  'home.helpCenter': 'Help Center',
  'home.allProducts': 'All Products',
  'home.specialDeals': 'Special Deals',

  // ── Hero ──────────────────────────────────────────────────────────────────
  'home.heroSearchPlaceholder': 'Search products…',
  'home.shopNow': 'Shop Now',
  'home.goToSlide': 'Go to slide {index}',

  // ── Deals / countdown ─────────────────────────────────────────────────────
  'home.limitedTimeOffer': 'Limited Time Offer',
  'home.bestDiscounts': 'Best Discounts',
  'home.endsIn': 'Ends in:',
  'home.viewAllDeals': 'View All Deals',
  'home.days': 'Days',
  'home.hours': 'Hours',
  'home.minutes': 'Mins',
  'home.seconds': 'Secs',

  // ── Brands ────────────────────────────────────────────────────────────────
  'home.brandsHeading': 'Authorized Retailer of Premium Brands',
  'home.shopBrand': 'Shop {brand}',

  // ── App download ──────────────────────────────────────────────────────────
  'home.downloadOnThe': 'Download on the',
  'home.getItOn': 'Get it on',
  'home.appMockupAlt': 'PRIMO mobile app',

  // ── How to order ──────────────────────────────────────────────────────────
  'home.simpleProcess': 'Simple Process',

  // ── Banners ───────────────────────────────────────────────────────────────
  'home.promotionAlt': 'Promotion',
  'home.promoBannerAlt': 'Promotional banner',
  'home.addBannerFromAdmin': 'Add a banner image from the admin panel',

  // ── Tabbed products ───────────────────────────────────────────────────────
  'home.viewAllTab': 'View all {label}',
  'home.noProductsAvailable': 'No products available.',

  // ── Rails / carousels ─────────────────────────────────────────────────────
  'home.pickUpWhereYouLeftOff': 'Pick up where you left off',
  'home.browseAll': 'Browse All',

  // ── Newsletter ────────────────────────────────────────────────────────────
  'home.newsletterEmailLabel': 'Email address',
  'home.newsletterEmailPlaceholder': 'Enter your email address',
  'home.newsletterSuccess': 'Subscribed successfully! Check your inbox to confirm.',
  'home.newsletterError': 'Subscription failed. Please try again.',
  'home.newsletterConsentPrefix': 'By subscribing you agree to our',
  'home.newsletterConsentSuffix': '. You can unsubscribe anytime.',
  'home.noSpam': 'No spam',
  'home.weeklyUpdates': 'Weekly updates',
  'home.unsubscribeAnytime': 'Unsubscribe anytime',

  // ── Testimonials ──────────────────────────────────────────────────────────
  'home.customerReviews': 'Customer Reviews',
  'home.whatCustomersSay': 'What Our Customers Say',
  'home.shopTopRated': 'Shop our top-rated products',
  'home.noReviewsYet': 'No Reviews Yet',
  'home.beTheFirstReview': 'Be the first to share your experience with PRIMO!',
  'home.writeFirstReview': 'Write the First Review',
  'home.statReviews': 'Reviews',
  'home.statAvgRating': 'Avg Rating',
  'home.statSatisfied': 'Satisfied',
  'home.statFiveStar': '5-Star',
  'home.shareYourExperience': 'Share Your Experience',
  'home.closeForm': 'Close form',
  'home.yourName': 'Your Name',
  'home.yourNamePlaceholder': 'Enter your name',
  'home.emailAddress': 'Email Address',
  'home.emailPlaceholder': 'Enter your email',
  'home.yourRating': 'Your Rating',
  'home.rateStars': 'Rate {count} stars',
  'home.reviewTitleLabel': 'Title (optional)',
  'home.reviewTitlePlaceholder': 'e.g. Great shopping experience!',
  'home.yourReview': 'Your Review',
  'home.yourReviewPlaceholder': 'Tell us about your experience with PRIMO…',
  'home.testimonialSuccess': 'Thanks for your review! It will be published after approval.',
  'home.testimonialError': 'Could not submit your review. Please try again.',
  'home.validationName': 'Name must be at least 2 characters',
  'home.validationEmail': 'Please enter a valid email address',
  'home.validationContent': 'Please write at least 10 characters',

  // ── Why choose us ─────────────────────────────────────────────────────────
  'home.callUs': 'Call us',

  // ── Listing header: quick picks, active filter chips, trust bar ───────────
  'home.quickPicks': 'Quick picks',
  'home.activeFilters': 'Active filters',
  'home.ratingChip': '{rating} stars & up',
  'home.searchChip': 'Search: {query}',
  'home.trustFreeDelivery': 'Free delivery over {amount}',
  'home.trustFreeDeliveryAlt': 'Fast nationwide delivery',
  'home.trustVatIncluded': 'Prices include {rate}% {label}',
  'home.trustAuthorizedDealer': 'Authorized dealer · genuine warranty',
  'home.trustEasyReturns': 'Easy 30-day returns',

  // ── Shop by price ─────────────────────────────────────────────────────────
  'home.shopByPrice': 'Shop by Price',
  'home.shopByPriceHeading': 'Find something for your budget',
  'home.priceBucketCta': 'Browse range',

  // ── Best sellers ──────────────────────────────────────────────────────────
  'home.bestSellers': 'Best Sellers',
  'home.bestSellersSubtitle': 'Most bought by our customers',

  // ── Category spotlight ────────────────────────────────────────────────────
  'home.categorySpotlight': 'Category Spotlight',
  'home.shopTheCategory': 'Shop {category}',
  'home.spotlightCta': 'Browse the full range',

  // ── Buying guides ─────────────────────────────────────────────────────────
  'home.buyingGuides': 'Buying Guides',
  'home.buyingGuidesHeading': 'Choose with confidence',
  'home.readGuide': 'Read guide',
  'home.allGuides': 'All guides',

  // ── Footer ────────────────────────────────────────────────────────────────
  'footer.tagline':
    'Premium home appliances for modern living. Quality products, exceptional service and unmatched value.',
  'footer.shop': 'Shop',
  'footer.support': 'Support',
  'footer.company': 'Company',
  'footer.account': 'Account',
  'footer.contactUs': 'Contact Us',
  'footer.faqs': 'FAQs',
  'footer.shippingInfo': 'Shipping Info',
  'footer.returnsExchanges': 'Returns & Exchanges',
  'footer.careers': 'Careers',
  'footer.press': 'Press',
  'footer.myAccount': 'My Account',
  'footer.orderHistory': 'Order History',
  'footer.privacyShort': 'Privacy',
  'footer.termsShort': 'Terms',
} as const;

export type HomeKey = keyof typeof en;

export const ar: Record<HomeKey, string> = {
  // ── Announcement bar / top category bar ───────────────────────────────────
  'home.freeShippingDefault': 'شحن مجاني للطلبات فوق 500 ريال 🚚',
  'home.helpCenter': 'مركز المساعدة',
  'home.allProducts': 'كل المنتجات',
  'home.specialDeals': 'عروض خاصة',

  // ── Hero ──────────────────────────────────────────────────────────────────
  'home.heroSearchPlaceholder': 'ابحث عن منتج…',
  'home.shopNow': 'تسوق الآن',
  'home.goToSlide': 'الانتقال إلى الشريحة {index}',

  // ── Deals / countdown ─────────────────────────────────────────────────────
  'home.limitedTimeOffer': 'عرض لفترة محدودة',
  'home.bestDiscounts': 'أقوى الخصومات',
  'home.endsIn': 'ينتهي خلال:',
  'home.viewAllDeals': 'عرض كل العروض',
  'home.days': 'يوم',
  'home.hours': 'ساعة',
  'home.minutes': 'دقيقة',
  'home.seconds': 'ثانية',

  // ── Brands ────────────────────────────────────────────────────────────────
  'home.brandsHeading': 'وكيل معتمد لأفضل الماركات العالمية',
  'home.shopBrand': 'تسوق منتجات {brand}',

  // ── App download ──────────────────────────────────────────────────────────
  'home.downloadOnThe': 'حمّل التطبيق من',
  'home.getItOn': 'احصل عليه من',
  'home.appMockupAlt': 'تطبيق بريمو للجوال',

  // ── How to order ──────────────────────────────────────────────────────────
  'home.simpleProcess': 'خطوات بسيطة',

  // ── Banners ───────────────────────────────────────────────────────────────
  'home.promotionAlt': 'عرض ترويجي',
  'home.promoBannerAlt': 'لافتة إعلانية',
  'home.addBannerFromAdmin': 'أضف صورة اللافتة من لوحة التحكم',

  // ── Tabbed products ───────────────────────────────────────────────────────
  'home.viewAllTab': 'عرض كل {label}',
  'home.noProductsAvailable': 'لا توجد منتجات متاحة حالياً.',

  // ── Rails / carousels ─────────────────────────────────────────────────────
  'home.pickUpWhereYouLeftOff': 'أكمل من حيث توقفت',
  'home.browseAll': 'تصفح الكل',

  // ── Newsletter ────────────────────────────────────────────────────────────
  'home.newsletterEmailLabel': 'البريد الإلكتروني',
  'home.newsletterEmailPlaceholder': 'أدخل بريدك الإلكتروني',
  'home.newsletterSuccess': 'تم الاشتراك بنجاح! تحقق من بريدك لتأكيد الاشتراك.',
  'home.newsletterError': 'تعذّر إتمام الاشتراك. حاول مرة أخرى.',
  'home.newsletterConsentPrefix': 'باشتراكك فأنت توافق على',
  'home.newsletterConsentSuffix': '. يمكنك إلغاء الاشتراك في أي وقت.',
  'home.noSpam': 'بدون رسائل مزعجة',
  'home.weeklyUpdates': 'تحديثات أسبوعية',
  'home.unsubscribeAnytime': 'إلغاء الاشتراك في أي وقت',

  // ── Testimonials ──────────────────────────────────────────────────────────
  'home.customerReviews': 'آراء العملاء',
  'home.whatCustomersSay': 'ماذا يقول عملاؤنا',
  'home.shopTopRated': 'تسوق المنتجات الأعلى تقييماً',
  'home.noReviewsYet': 'لا توجد تقييمات بعد',
  'home.beTheFirstReview': 'كن أول من يشاركنا تجربته مع بريمو!',
  'home.writeFirstReview': 'اكتب أول تقييم',
  'home.statReviews': 'تقييم',
  'home.statAvgRating': 'متوسط التقييم',
  'home.statSatisfied': 'راضون',
  'home.statFiveStar': '5 نجوم',
  'home.shareYourExperience': 'شاركنا تجربتك',
  'home.closeForm': 'إغلاق النموذج',
  'home.yourName': 'الاسم',
  'home.yourNamePlaceholder': 'أدخل اسمك',
  'home.emailAddress': 'البريد الإلكتروني',
  'home.emailPlaceholder': 'أدخل بريدك الإلكتروني',
  'home.yourRating': 'تقييمك',
  'home.rateStars': 'التقييم بـ {count} نجوم',
  'home.reviewTitleLabel': 'العنوان (اختياري)',
  'home.reviewTitlePlaceholder': 'مثال: تجربة تسوق ممتازة!',
  'home.yourReview': 'تقييمك',
  'home.yourReviewPlaceholder': 'حدثنا عن تجربتك مع بريمو…',
  'home.testimonialSuccess': 'شكراً لتقييمك! سيتم نشره بعد المراجعة.',
  'home.testimonialError': 'تعذّر إرسال التقييم. حاول مرة أخرى.',
  'home.validationName': 'الاسم يجب ألا يقل عن حرفين',
  'home.validationEmail': 'يرجى إدخال بريد إلكتروني صحيح',
  'home.validationContent': 'يرجى كتابة 10 أحرف على الأقل',

  // ── Why choose us ─────────────────────────────────────────────────────────
  'home.callUs': 'اتصل بنا',

  // ── Listing header: quick picks, active filter chips, trust bar ───────────
  'home.quickPicks': 'اختيارات سريعة',
  'home.activeFilters': 'الفلاتر المفعّلة',
  'home.ratingChip': '{rating} نجوم فأكثر',
  'home.searchChip': 'بحث: {query}',
  'home.trustFreeDelivery': 'توصيل مجاني للطلبات فوق {amount}',
  'home.trustFreeDeliveryAlt': 'توصيل سريع لجميع مناطق المملكة',
  'home.trustVatIncluded': 'الأسعار شاملة {label} {rate}%',
  'home.trustAuthorizedDealer': 'وكيل معتمد · ضمان أصلي',
  'home.trustEasyReturns': 'إرجاع سهل خلال 30 يوم',

  // ── Shop by price ─────────────────────────────────────────────────────────
  'home.shopByPrice': 'تسوق حسب السعر',
  'home.shopByPriceHeading': 'اختر ما يناسب ميزانيتك',
  'home.priceBucketCta': 'تصفح الفئة',

  // ── Best sellers ──────────────────────────────────────────────────────────
  'home.bestSellers': 'الأكثر مبيعاً',
  'home.bestSellersSubtitle': 'الأكثر شراءً من عملائنا',

  // ── Category spotlight ────────────────────────────────────────────────────
  'home.categorySpotlight': 'قسم تحت الضوء',
  'home.shopTheCategory': 'تسوق {category}',
  'home.spotlightCta': 'تصفح كامل التشكيلة',

  // ── Buying guides ─────────────────────────────────────────────────────────
  'home.buyingGuides': 'أدلة الشراء',
  'home.buyingGuidesHeading': 'اشترِ بثقة',
  'home.readGuide': 'اقرأ الدليل',
  'home.allGuides': 'كل الأدلة',

  // ── Footer ────────────────────────────────────────────────────────────────
  'footer.tagline':
    'أجهزة منزلية فاخرة لحياة عصرية. منتجات أصلية وخدمة مميزة وأسعار لا تُنافس.',
  'footer.shop': 'تسوق',
  'footer.support': 'الدعم',
  'footer.company': 'الشركة',
  'footer.account': 'حسابي',
  'footer.contactUs': 'اتصل بنا',
  'footer.faqs': 'الأسئلة الشائعة',
  'footer.shippingInfo': 'معلومات الشحن',
  'footer.returnsExchanges': 'الإرجاع والاستبدال',
  'footer.careers': 'الوظائف',
  'footer.press': 'المركز الإعلامي',
  'footer.myAccount': 'حسابي',
  'footer.orderHistory': 'سجل الطلبات',
  'footer.privacyShort': 'الخصوصية',
  'footer.termsShort': 'الشروط',
};
