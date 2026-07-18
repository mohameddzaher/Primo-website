'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HiOutlineX, HiOutlinePlus, HiOutlineSave } from 'react-icons/hi';
import { Button, Input, Card } from '@/components/ui';
import { cmsApi, adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import toast from 'react-hot-toast';

type SectionKey =
  | 'homepage_announcement_bar'
  | 'homepage_features'
  | 'homepage_why_choose_us'
  | 'homepage_newsletter'
  | 'homepage_hero_badges'
  | 'homepage_hero_categories'
  | 'homepage_hero_promos'
  | 'homepage_topbar_settings'
  | 'homepage_quick_strip'
  | 'homepage_app_download'
  | 'homepage_wide_banner'
  | 'homepage_how_to_order'
  | 'homepage_tabbed_products'
  | 'homepage_new_arrivals'
  | 'homepage_promo_banners';

const sections: { key: SectionKey; label: string }[] = [
  { key: 'homepage_announcement_bar', label: '📣 Announcement Bar' },
  { key: 'homepage_promo_banners', label: '🖼️ Promo Banners' },
  { key: 'homepage_topbar_settings', label: 'Category Bar' },
  { key: 'homepage_quick_strip', label: 'Quick Strip' },
  { key: 'homepage_tabbed_products', label: 'Product Tabs' },
  { key: 'homepage_new_arrivals', label: 'New Arrivals' },
  { key: 'homepage_wide_banner', label: 'Wide Banner' },
  { key: 'homepage_how_to_order', label: 'How to Order' },
  { key: 'homepage_app_download', label: 'App Download' },
  { key: 'homepage_features', label: 'Features Bar' },
  { key: 'homepage_why_choose_us', label: 'Why Choose Us' },
  { key: 'homepage_newsletter', label: 'Newsletter' },
  { key: 'homepage_hero_badges', label: 'Hero Trust Badges' },
  { key: 'homepage_hero_categories', label: 'Hero Quick Categories' },
  { key: 'homepage_hero_promos', label: 'Hero Promo Cards' },
];

export default function HomepageContentPage() {
  const [activeTab, setActiveTab] = useState<SectionKey>('homepage_topbar_settings');

  const { data: cmsData, isLoading } = useQuery({
    queryKey: ['cms-homepage-all'],
    queryFn: () => cmsApi.getMultiple(sections.map((s) => s.key)),
    staleTime: 30 * 1000, // 30s — use cached data on quick back-navigations, no loading flash
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-dark-900">Homepage Content</h1>
        <p className="text-dark-500 mt-1">
          Manage all homepage sections. Changes appear immediately on the public website.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-beige-200 pb-2">
        {sections.map((section) => (
          <button
            key={section.key}
            type="button"
            onClick={() => setActiveTab(section.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === section.key
                ? 'bg-primary-600 text-white'
                : 'bg-white text-dark-600 hover:bg-beige-100 border border-beige-200'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-beige-200 rounded-xl"></div>
        </div>
      ) : (
        <>
          {activeTab === 'homepage_announcement_bar' && (
            <AnnouncementBarEditor data={(cmsData as any)?.homepage_announcement_bar} />
          )}
          {activeTab === 'homepage_promo_banners' && (
            <PromoBannersEditor data={(cmsData as any)?.homepage_promo_banners} />
          )}
          {activeTab === 'homepage_features' && (
            <FeaturesEditor data={cmsData?.homepage_features} />
          )}
          {activeTab === 'homepage_why_choose_us' && (
            <WhyChooseUsEditor data={cmsData?.homepage_why_choose_us} />
          )}
          {activeTab === 'homepage_newsletter' && (
            <NewsletterEditor data={cmsData?.homepage_newsletter} />
          )}
          {activeTab === 'homepage_hero_badges' && (
            <HeroBadgesEditor data={cmsData?.homepage_hero_badges} />
          )}
          {activeTab === 'homepage_hero_categories' && (
            <HeroCategoriesEditor data={cmsData?.homepage_hero_categories} />
          )}
          {activeTab === 'homepage_hero_promos' && (
            <HeroPromosEditor data={cmsData?.homepage_hero_promos} />
          )}
          {activeTab === 'homepage_topbar_settings' && (
            <TopBarSettingsEditor data={(cmsData as any)?.homepage_topbar_settings} />
          )}
          {activeTab === 'homepage_quick_strip' && (
            <QuickStripEditor data={(cmsData as any)?.homepage_quick_strip} />
          )}
          {activeTab === 'homepage_tabbed_products' && (
            <TabbedProductsEditor data={(cmsData as any)?.homepage_tabbed_products} />
          )}
          {activeTab === 'homepage_new_arrivals' && (
            <NewArrivalsEditor data={(cmsData as any)?.homepage_new_arrivals} />
          )}
          {activeTab === 'homepage_wide_banner' && (
            <WideBannerEditor data={(cmsData as any)?.homepage_wide_banner} />
          )}
          {activeTab === 'homepage_how_to_order' && (
            <HowToOrderEditor data={(cmsData as any)?.homepage_how_to_order} />
          )}
          {activeTab === 'homepage_app_download' && (
            <AppDownloadEditor data={(cmsData as any)?.homepage_app_download} />
          )}
        </>
      )}

      {/* Secondary banner — managed directly from Banners admin */}
      {activeTab === 'homepage_topbar_settings' && (
        <Card padding="md" className="bg-blue-50 border border-blue-100">
          <p className="text-sm text-blue-700">
            <strong>Secondary Banner:</strong> Manage the promo banner under the hero from{' '}
            <a href="/admin/banners" className="underline font-medium">Admin → Banners</a>{' '}
            — create a banner with position <code className="bg-blue-100 px-1 rounded">home_secondary</code>.
          </p>
        </Card>
      )}
    </div>
  );
}

// ========== HELPER ==========

function parseCmsValue<T>(data: any, fallback: T): T {
  try {
    if (data?.value) {
      return (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) as T;
    }
  } catch {}
  return fallback;
}

function useSaveContent(key: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (value: any) => adminApi.updateContent(key, JSON.stringify(value)),
    onSuccess: (result, variables) => {
      // Immediately update the cache so editors re-initialize with the saved state
      queryClient.setQueryData(['cms-homepage-all'], (old: any) => {
        if (!old) return old;
        // Use the actual server response when available (has updatedAt, _id, etc.)
        // so React Query's structural sharing always detects the change
        const updatedEntry = result ?? { ...(old[key] || {}), value: JSON.stringify(variables) };
        return { ...old, [key]: updatedEntry };
      });
      // Background sync to confirm with server
      queryClient.invalidateQueries({ queryKey: ['cms-homepage-all'] });
      const dashKey = key.replace(/_/g, '-');
      queryClient.invalidateQueries({ queryKey: [`cms-${key}`] });
      queryClient.invalidateQueries({ queryKey: [`cms-${dashKey}`] });
      toast.success('Saved successfully');
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to save')),
  });
}

// ========== FEATURES EDITOR ==========

function FeaturesEditor({ data }: { data: any }) {
  const featuresDefault = [
    { icon: '🚚', title: 'Free Shipping', description: 'On orders over SAR 500' },
    { icon: '🛡️', title: '2 Year Warranty', description: 'Full coverage guarantee' },
    { icon: '↩️', title: 'Easy Returns', description: '30-day return policy' },
    { icon: '💬', title: '24/7 Support', description: 'Expert assistance anytime' },
  ];
  const [items, setItems] = useState<Array<{ icon: string; title: string; description: string }>>(
    () => parseCmsValue(data, featuresDefault)
  );
  const save = useSaveContent('homepage_features');

  useEffect(() => {
    setItems(parseCmsValue(data, featuresDefault));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-dark-900">Feature Cards</h3>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<HiOutlinePlus size={16} />}
          onClick={() => setItems([...items, { icon: '⭐', title: '', description: '' }])}
        >
          Add Feature
        </Button>
      </div>

      {items.map((item, i) => (
        <div key={i} className="flex gap-3 items-start p-4 bg-beige-50 rounded-lg">
          <input
            className="w-16 px-2 py-2 border border-beige-300 rounded-lg text-center text-xl"
            value={item.icon}
            onChange={(e) => { const n = [...items]; n[i].icon = e.target.value; setItems(n); }}
            placeholder="Icon"
          />
          <div className="flex-1 space-y-2">
            <input
              className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
              value={item.title}
              onChange={(e) => { const n = [...items]; n[i].title = e.target.value; setItems(n); }}
              placeholder="Title"
            />
            <input
              className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
              value={item.description}
              onChange={(e) => { const n = [...items]; n[i].description = e.target.value; setItems(n); }}
              placeholder="Description"
            />
          </div>
          <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 p-1" title="Remove">
            <HiOutlineX size={18} />
          </button>
        </div>
      ))}

      <Button leftIcon={<HiOutlineSave size={16} />} onClick={() => save.mutate(items)} isLoading={save.isPending}>
        Save Features
      </Button>
    </Card>
  );
}

// ========== WHY CHOOSE US EDITOR ==========

function WhyChooseUsEditor({ data }: { data: any }) {
  const defaultVal = {
    badge: 'Why Shop With Us',
    title: 'The PRIMO Difference',
    description: 'We are committed to providing you with the best shopping experience for premium home appliances.',
    reasons: [] as Array<{ icon: string; title: string; description: string }>,
    cta: { title: 'Still Have Questions?', description: '', phone: '+20 123 456 789', buttonText: 'Send a Message', buttonLink: '/contact' },
  };

  const [content, setContent] = useState(() => {
    const parsed = parseCmsValue(data, defaultVal);
    const mergedCta = { ...defaultVal.cta, ...(parsed.cta || {}) };
    return { ...defaultVal, ...parsed, cta: mergedCta };
  });
  const save = useSaveContent('homepage_why_choose_us');

  useEffect(() => {
    const parsed = parseCmsValue(data, defaultVal);
    const mergedCta = { ...defaultVal.cta, ...(parsed.cta || {}) };
    setContent({ ...defaultVal, ...parsed, cta: mergedCta });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const updateReason = (i: number, field: string, value: string) => {
    const reasons = [...content.reasons];
    (reasons[i] as any)[field] = value;
    setContent({ ...content, reasons });
  };

  return (
    <div className="space-y-6">
      <Card padding="lg" className="space-y-4">
        <h3 className="font-semibold text-dark-900">Section Header</h3>
        <div className="grid grid-cols-1 gap-4">
          <Input label="Badge Text" value={content.badge} onChange={(e: any) => setContent({ ...content, badge: e.target.value })} />
          <Input label="Title" value={content.title} onChange={(e: any) => setContent({ ...content, title: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Description</label>
            <textarea
              className="w-full px-4 py-2 border border-beige-300 rounded-lg text-sm"
              rows={2}
              value={content.description}
              onChange={(e) => setContent({ ...content, description: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-dark-900">Reasons</h3>
          <Button size="sm" variant="outline" leftIcon={<HiOutlinePlus size={16} />}
            onClick={() => setContent({ ...content, reasons: [...content.reasons, { icon: '⭐', title: '', description: '' }] })}>
            Add Reason
          </Button>
        </div>

        {content.reasons.map((reason, i) => (
          <div key={i} className="flex gap-3 items-start p-4 bg-beige-50 rounded-lg">
            <input className="w-16 px-2 py-2 border border-beige-300 rounded-lg text-center text-xl" value={reason.icon} onChange={(e) => updateReason(i, 'icon', e.target.value)} />
            <div className="flex-1 space-y-2">
              <input className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm" value={reason.title} onChange={(e) => updateReason(i, 'title', e.target.value)} placeholder="Title" />
              <textarea className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm" rows={2} value={reason.description} onChange={(e) => updateReason(i, 'description', e.target.value)} placeholder="Description" />
            </div>
            <button type="button" onClick={() => setContent({ ...content, reasons: content.reasons.filter((_, j) => j !== i) })} className="text-red-500 hover:text-red-700 p-1" title="Remove">
              <HiOutlineX size={18} />
            </button>
          </div>
        ))}
      </Card>

      <Card padding="lg" className="space-y-4">
        <h3 className="font-semibold text-dark-900">CTA Banner</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input label="CTA Title" value={content.cta.title} onChange={(e: any) => setContent({ ...content, cta: { ...content.cta, title: e.target.value } })} />
          <Input label="Phone Number" value={content.cta.phone} onChange={(e: any) => setContent({ ...content, cta: { ...content.cta, phone: e.target.value } })} />
          <Input label="Button Text" value={content.cta.buttonText} onChange={(e: any) => setContent({ ...content, cta: { ...content.cta, buttonText: e.target.value } })} />
          <Input label="Button Link" value={content.cta.buttonLink} onChange={(e: any) => setContent({ ...content, cta: { ...content.cta, buttonLink: e.target.value } })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-700 mb-1">CTA Description</label>
          <textarea className="w-full px-4 py-2 border border-beige-300 rounded-lg text-sm" rows={2} value={content.cta.description} onChange={(e) => setContent({ ...content, cta: { ...content.cta, description: e.target.value } })} />
        </div>
      </Card>

      <Button leftIcon={<HiOutlineSave size={16} />} onClick={() => save.mutate(content)} isLoading={save.isPending}>
        Save Why Choose Us
      </Button>
    </div>
  );
}

// ========== NEWSLETTER EDITOR ==========

function NewsletterEditor({ data }: { data: any }) {
  const defaultVal = {
    badge: 'Newsletter',
    title: 'Get 10% Off Your First Order',
    description: '',
    benefits: [] as Array<{ icon: string; title: string; description: string }>,
    formTitle: 'Join Our Community',
    subscriberText: 'Over 10,000+ subscribers already',
    buttonText: 'Subscribe & Get 10% Off',
  };

  const [content, setContent] = useState(() => {
    const parsed = parseCmsValue(data, defaultVal);
    return { ...defaultVal, ...parsed };
  });
  const save = useSaveContent('homepage_newsletter');

  useEffect(() => {
    const parsed = parseCmsValue(data, defaultVal);
    setContent({ ...defaultVal, ...parsed });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div className="space-y-6">
      <Card padding="lg" className="space-y-4">
        <h3 className="font-semibold text-dark-900">Newsletter Content</h3>
        <Input label="Badge" value={content.badge} onChange={(e: any) => setContent({ ...content, badge: e.target.value })} />
        <Input label="Title" value={content.title} onChange={(e: any) => setContent({ ...content, title: e.target.value })} />
        <div>
          <label className="block text-sm font-medium text-dark-700 mb-1">Description</label>
          <textarea className="w-full px-4 py-2 border border-beige-300 rounded-lg text-sm" rows={2} value={content.description} onChange={(e) => setContent({ ...content, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Form Title" value={content.formTitle} onChange={(e: any) => setContent({ ...content, formTitle: e.target.value })} />
          <Input label="Subscriber Text" value={content.subscriberText} onChange={(e: any) => setContent({ ...content, subscriberText: e.target.value })} />
        </div>
        <Input label="Button Text" value={content.buttonText} onChange={(e: any) => setContent({ ...content, buttonText: e.target.value })} />
      </Card>

      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-dark-900">Benefits</h3>
          <Button size="sm" variant="outline" leftIcon={<HiOutlinePlus size={16} />}
            onClick={() => setContent({ ...content, benefits: [...content.benefits, { icon: '⭐', title: '', description: '' }] })}>
            Add Benefit
          </Button>
        </div>
        {content.benefits.map((b, i) => (
          <div key={i} className="flex gap-3 items-start p-4 bg-beige-50 rounded-lg">
            <input className="w-16 px-2 py-2 border border-beige-300 rounded-lg text-center text-xl" value={b.icon} onChange={(e) => { const n = [...content.benefits]; n[i].icon = e.target.value; setContent({ ...content, benefits: n }); }} />
            <div className="flex-1 space-y-2">
              <input className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm" value={b.title} onChange={(e) => { const n = [...content.benefits]; n[i].title = e.target.value; setContent({ ...content, benefits: n }); }} placeholder="Title" />
              <input className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm" value={b.description} onChange={(e) => { const n = [...content.benefits]; n[i].description = e.target.value; setContent({ ...content, benefits: n }); }} placeholder="Description" />
            </div>
            <button type="button" onClick={() => setContent({ ...content, benefits: content.benefits.filter((_, j) => j !== i) })} className="text-red-500 hover:text-red-700 p-1" title="Remove">
              <HiOutlineX size={18} />
            </button>
          </div>
        ))}
      </Card>

      <Button leftIcon={<HiOutlineSave size={16} />} onClick={() => save.mutate(content)} isLoading={save.isPending}>
        Save Newsletter
      </Button>
    </div>
  );
}

// ========== HERO BADGES EDITOR ==========

function HeroBadgesEditor({ data }: { data: any }) {
  const badgesDefault = [
    { icon: '🚚', title: 'Free Shipping', subtitle: 'On orders over SAR 500' },
    { icon: '🛡️', title: '2-Year Warranty', subtitle: 'On all products' },
    { icon: '🔒', title: 'Secure Payment', subtitle: 'Multiple options' },
    { icon: '💬', title: '24/7 Support', subtitle: 'Expert assistance' },
  ];
  const [items, setItems] = useState<Array<{ icon: string; title: string; subtitle: string }>>(
    () => parseCmsValue(data, badgesDefault)
  );
  const save = useSaveContent('homepage_hero_badges');

  useEffect(() => {
    setItems(parseCmsValue(data, badgesDefault));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-dark-900">Trust Badges</h3>
        <Button size="sm" variant="outline" leftIcon={<HiOutlinePlus size={16} />}
          onClick={() => setItems([...items, { icon: '⭐', title: '', subtitle: '' }])}>
          Add Badge
        </Button>
      </div>

      {items.map((item, i) => (
        <div key={i} className="flex gap-3 items-start p-4 bg-beige-50 rounded-lg">
          <input className="w-16 px-2 py-2 border border-beige-300 rounded-lg text-center text-xl" value={item.icon} onChange={(e) => { const n = [...items]; n[i].icon = e.target.value; setItems(n); }} />
          <div className="flex-1 space-y-2">
            <input className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm" value={item.title} onChange={(e) => { const n = [...items]; n[i].title = e.target.value; setItems(n); }} placeholder="Title" />
            <input className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm" value={item.subtitle} onChange={(e) => { const n = [...items]; n[i].subtitle = e.target.value; setItems(n); }} placeholder="Subtitle" />
          </div>
          <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 p-1" title="Remove">
            <HiOutlineX size={18} />
          </button>
        </div>
      ))}

      <Button leftIcon={<HiOutlineSave size={16} />} onClick={() => save.mutate(items)} isLoading={save.isPending}>
        Save Trust Badges
      </Button>
    </Card>
  );
}

// ========== HERO CATEGORIES EDITOR ==========

function HeroCategoriesEditor({ data }: { data: any }) {
  const heroCatsDefault = [
    { emoji: '🍳', label: 'Kitchen', href: '/categories/kitchen-appliances' },
    { emoji: '☕', label: 'Coffee', href: '/categories/coffee-machines' },
    { emoji: '🧹', label: 'Cleaning', href: '/categories/home-essentials' },
    { emoji: '🔌', label: 'Small Appliances', href: '/categories/small-appliances' },
  ];
  const [items, setItems] = useState<Array<{ emoji: string; label: string; href: string }>>(
    () => parseCmsValue(data, heroCatsDefault)
  );
  const save = useSaveContent('homepage_hero_categories');

  useEffect(() => {
    setItems(parseCmsValue(data, heroCatsDefault));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-dark-900">Quick Categories</h3>
        <Button size="sm" variant="outline" leftIcon={<HiOutlinePlus size={16} />}
          onClick={() => setItems([...items, { emoji: '📦', label: '', href: '' }])}>
          Add Category
        </Button>
      </div>

      {items.map((item, i) => (
        <div key={i} className="flex gap-3 items-center p-4 bg-beige-50 rounded-lg">
          <input className="w-16 px-2 py-2 border border-beige-300 rounded-lg text-center text-xl" value={item.emoji} onChange={(e) => { const n = [...items]; n[i].emoji = e.target.value; setItems(n); }} />
          <input className="flex-1 px-3 py-2 border border-beige-300 rounded-lg text-sm" value={item.label} onChange={(e) => { const n = [...items]; n[i].label = e.target.value; setItems(n); }} placeholder="Label" />
          <input className="flex-1 px-3 py-2 border border-beige-300 rounded-lg text-sm" value={item.href} onChange={(e) => { const n = [...items]; n[i].href = e.target.value; setItems(n); }} placeholder="/categories/..." />
          <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 p-1" title="Remove">
            <HiOutlineX size={18} />
          </button>
        </div>
      ))}

      <Button leftIcon={<HiOutlineSave size={16} />} onClick={() => save.mutate(items)} isLoading={save.isPending}>
        Save Categories
      </Button>
    </Card>
  );
}

// ========== HERO PROMOS EDITOR ==========

function HeroPromosEditor({ data }: { data: any }) {
  const heroPromosDefault = [
    { emoji: '🔥', title: 'Flash Deals', subtitle: 'Up to 50% off', href: '/deals', color: 'from-primary-500 to-primary-600' },
    { emoji: '✨', title: 'New Arrivals', subtitle: 'Latest products', href: '/products?new=true', color: 'from-dark-800 to-dark-900' },
    { emoji: '📦', title: 'All Categories', subtitle: 'Browse collection', href: '/categories', color: '' },
    { emoji: '⭐', title: 'Best Sellers', subtitle: 'Top rated items', href: '/products?featured=true', color: '' },
  ];
  const [items, setItems] = useState<Array<{ emoji: string; title: string; subtitle: string; href: string; color: string }>>(
    () => parseCmsValue(data, heroPromosDefault)
  );
  const save = useSaveContent('homepage_hero_promos');

  useEffect(() => {
    setItems(parseCmsValue(data, heroPromosDefault));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-dark-900">Promo Cards</h3>
        <Button size="sm" variant="outline" leftIcon={<HiOutlinePlus size={16} />}
          onClick={() => setItems([...items, { emoji: '🎉', title: '', subtitle: '', href: '', color: '' }])}>
          Add Card
        </Button>
      </div>

      {items.map((item, i) => (
        <div key={i} className="flex gap-3 items-start p-4 bg-beige-50 rounded-lg">
          <input className="w-16 px-2 py-2 border border-beige-300 rounded-lg text-center text-xl" value={item.emoji} onChange={(e) => { const n = [...items]; n[i].emoji = e.target.value; setItems(n); }} />
          <div className="flex-1 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input className="px-3 py-2 border border-beige-300 rounded-lg text-sm" value={item.title} onChange={(e) => { const n = [...items]; n[i].title = e.target.value; setItems(n); }} placeholder="Title" />
              <input className="px-3 py-2 border border-beige-300 rounded-lg text-sm" value={item.subtitle} onChange={(e) => { const n = [...items]; n[i].subtitle = e.target.value; setItems(n); }} placeholder="Subtitle" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input className="px-3 py-2 border border-beige-300 rounded-lg text-sm" value={item.href} onChange={(e) => { const n = [...items]; n[i].href = e.target.value; setItems(n); }} placeholder="Link (e.g. /deals)" />
              <input className="px-3 py-2 border border-beige-300 rounded-lg text-sm" value={item.color} onChange={(e) => { const n = [...items]; n[i].color = e.target.value; setItems(n); }} placeholder="Gradient (e.g. from-red-500 to-orange-500)" />
            </div>
          </div>
          <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 p-1" title="Remove">
            <HiOutlineX size={18} />
          </button>
        </div>
      ))}

      <Button leftIcon={<HiOutlineSave size={16} />} onClick={() => save.mutate(items)} isLoading={save.isPending}>
        Save Promo Cards
      </Button>
    </Card>
  );
}

// ========== TOP BAR SETTINGS EDITOR ==========

function TopBarSettingsEditor({ data }: { data: any }) {
  const defaultVal = { enabled: true };
  const [settings, setSettings] = useState(() => ({ ...defaultVal, ...parseCmsValue(data, defaultVal) }));
  const save = useSaveContent('homepage_topbar_settings');

  useEffect(() => {
    setSettings({ ...defaultVal, ...parseCmsValue(data, defaultVal) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <Card padding="lg" className="space-y-6">
      <div>
        <h3 className="font-semibold text-dark-900">Category Bar Settings</h3>
        <p className="text-sm text-dark-500 mt-1">
          Controls the slim category navigation strip displayed below the header on all pages.
        </p>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
          className="w-5 h-5 rounded text-primary-600 border-beige-300"
        />
        <div>
          <p className="text-sm font-medium text-dark-900">Show category bar</p>
          <p className="text-xs text-dark-500">When disabled, the category bar is hidden site-wide.</p>
        </div>
      </label>

      <div className="p-4 bg-beige-50 rounded-lg text-sm text-dark-600 space-y-1">
        <p className="font-medium text-dark-900">Which categories appear?</p>
        <p>All active parent categories appear automatically.</p>
        <p>To hide a specific category from the bar, set <strong>showInTopBar = false</strong> on that category.</p>
        <p>To reorder them, use the <strong>topBarOrder</strong> field on each category (lower number = first).</p>
        <p className="mt-2">
          <a href="/admin/products?tab=categories" className="text-primary-600 underline font-medium">
            Manage Categories →
          </a>
        </p>
      </div>

      <Button leftIcon={<HiOutlineSave size={16} />} onClick={() => save.mutate(settings)} isLoading={save.isPending}>
        Save Bar Settings
      </Button>
    </Card>
  );
}

// ========== QUICK STRIP EDITOR ==========

function QuickStripEditor({ data }: { data: any }) {
  const defaultVal = {
    enabled: true,
    showOnSale: true,
    showNewArrivals: true,
    customShortcuts: [] as Array<{ label: string; emoji: string; link: string; enabled: boolean }>,
  };

  const [settings, setSettings] = useState(() => {
    const parsed = parseCmsValue(data, defaultVal);
    return { ...defaultVal, ...parsed, customShortcuts: parsed.customShortcuts || [] };
  });
  const save = useSaveContent('homepage_quick_strip');

  useEffect(() => {
    const parsed = parseCmsValue(data, defaultVal);
    setSettings({ ...defaultVal, ...parsed, customShortcuts: parsed.customShortcuts || [] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const addShortcut = () => {
    setSettings({
      ...settings,
      customShortcuts: [...settings.customShortcuts, { label: '', emoji: '🔗', link: '', enabled: true }],
    });
  };

  const updateShortcut = (i: number, field: string, value: any) => {
    const updated = [...settings.customShortcuts];
    (updated[i] as any)[field] = value;
    setSettings({ ...settings, customShortcuts: updated });
  };

  return (
    <div className="space-y-6">
      <Card padding="lg" className="space-y-5">
        <div>
          <h3 className="font-semibold text-dark-900">Quick Icon Strip</h3>
          <p className="text-sm text-dark-500 mt-1">
            The horizontal scrollable icon strip below the hero. Categories appear automatically from DB.
          </p>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
            className="w-5 h-5 rounded text-primary-600 border-beige-300"
          />
          <div>
            <p className="text-sm font-medium text-dark-900">Show quick strip</p>
          </div>
        </label>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showOnSale}
              onChange={(e) => setSettings({ ...settings, showOnSale: e.target.checked })}
              className="w-4 h-4 rounded text-primary-600 border-beige-300"
            />
            <span className="text-sm text-dark-700">Show "On Sale" card 🏷️</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showNewArrivals}
              onChange={(e) => setSettings({ ...settings, showNewArrivals: e.target.checked })}
              className="w-4 h-4 rounded text-primary-600 border-beige-300"
            />
            <span className="text-sm text-dark-700">Show "New Arrivals" card ✨</span>
          </label>
        </div>
      </Card>

      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-dark-900">Custom Shortcuts</h3>
            <p className="text-xs text-dark-500 mt-0.5">Add extra cards after On Sale / New Arrivals (before category cards).</p>
          </div>
          <Button size="sm" variant="outline" leftIcon={<HiOutlinePlus size={16} />} onClick={addShortcut}>
            Add Shortcut
          </Button>
        </div>

        {settings.customShortcuts.length === 0 && (
          <p className="text-sm text-dark-400 italic">No custom shortcuts. Category cards appear automatically.</p>
        )}

        {settings.customShortcuts.map((item, i) => (
          <div key={i} className="flex gap-3 items-center p-3 bg-beige-50 rounded-lg">
            <input
              className="w-14 px-2 py-2 border border-beige-300 rounded-lg text-center text-xl"
              value={item.emoji}
              onChange={(e) => updateShortcut(i, 'emoji', e.target.value)}
              title="Emoji"
            />
            <input
              className="flex-1 px-3 py-2 border border-beige-300 rounded-lg text-sm"
              value={item.label}
              onChange={(e) => updateShortcut(i, 'label', e.target.value)}
              placeholder="Label"
            />
            <input
              className="flex-1 px-3 py-2 border border-beige-300 rounded-lg text-sm"
              value={item.link}
              onChange={(e) => updateShortcut(i, 'link', e.target.value)}
              placeholder="/products?..."
            />
            <label className="flex items-center gap-1 text-xs text-dark-500 cursor-pointer">
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={(e) => updateShortcut(i, 'enabled', e.target.checked)}
                className="w-4 h-4 rounded"
              />
              On
            </label>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, customShortcuts: settings.customShortcuts.filter((_, j) => j !== i) })}
              className="text-red-500 hover:text-red-700 p-1"
              title="Remove"
            >
              <HiOutlineX size={18} />
            </button>
          </div>
        ))}
      </Card>

      <Button leftIcon={<HiOutlineSave size={16} />} onClick={() => save.mutate(settings)} isLoading={save.isPending}>
        Save Quick Strip
      </Button>
    </div>
  );
}

// ========== WIDE BANNER EDITOR ==========

function WideBannerEditor({ data }: { data: any }) {
  const defaultVal = {
    enabled: true,
    imageUrl: '',
    link: '',
    altText: 'Promotional banner',
  };

  const [settings, setSettings] = useState(() => ({ ...defaultVal, ...parseCmsValue(data, defaultVal) }));
  const save = useSaveContent('homepage_wide_banner');

  useEffect(() => {
    setSettings({ ...defaultVal, ...parseCmsValue(data, defaultVal) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <Card padding="lg" className="space-y-6">
      <div>
        <h3 className="font-semibold text-dark-900">Single Wide Banner</h3>
        <p className="text-sm text-dark-500 mt-1">
          A full-width image banner displayed between sections on the homepage. Upload an image and optionally link it.
        </p>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
          className="w-5 h-5 rounded text-primary-600 border-beige-300"
        />
        <div>
          <p className="text-sm font-medium text-dark-900">Show wide banner</p>
          <p className="text-xs text-dark-500">When disabled, this banner is hidden on the homepage.</p>
        </div>
      </label>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-700 mb-1">Banner Image URL</label>
          <input
            className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
            value={settings.imageUrl}
            onChange={(e) => setSettings({ ...settings, imageUrl: e.target.value })}
            placeholder="https://... (upload via Media Library, then paste URL)"
          />
          <p className="text-xs text-dark-400 mt-1">Recommended: 1600×320px wide image (5:1 aspect ratio).</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-700 mb-1">Link (optional)</label>
          <input
            className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
            value={settings.link}
            onChange={(e) => setSettings({ ...settings, link: e.target.value })}
            placeholder="/products?category=... or leave blank for no link"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-700 mb-1">Alt Text</label>
          <input
            className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
            value={settings.altText}
            onChange={(e) => setSettings({ ...settings, altText: e.target.value })}
            placeholder="Describe the banner for accessibility"
          />
        </div>
      </div>

      {settings.imageUrl && (
        <div className="rounded-lg overflow-hidden border border-beige-200 bg-beige-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={settings.imageUrl} alt="Preview" className="w-full h-24 object-cover" />
          <p className="text-xs text-center text-dark-400 py-1">Preview</p>
        </div>
      )}

      <Button leftIcon={<HiOutlineSave size={16} />} onClick={() => save.mutate(settings)} isLoading={save.isPending}>
        Save Wide Banner
      </Button>
    </Card>
  );
}

// ========== HOW TO ORDER EDITOR ==========

interface OrderStep {
  icon: string;
  title: string;
  description: string;
  order: number;
  enabled: boolean;
}

function HowToOrderEditor({ data }: { data: any }) {
  const defaultVal = {
    enabled: true,
    title: 'How to Order',
    subtitle: 'Get your favorite products delivered in just a few easy steps.',
    ctaText: 'Start Shopping',
    ctaLink: '/products',
    steps: [
      { icon: '🔍', title: 'Browse Products', description: 'Explore our wide range of premium home appliances and electronics.', order: 1, enabled: true },
      { icon: '🛒', title: 'Add to Cart', description: 'Select your items and add them to your cart with a single click.', order: 2, enabled: true },
      { icon: '📦', title: 'Place Your Order', description: 'Review your cart, choose a payment method, and confirm your order.', order: 3, enabled: true },
      { icon: '🚀', title: 'Fast Delivery', description: 'Sit back and relax — your order will arrive right at your door.', order: 4, enabled: true },
    ] as OrderStep[],
  };

  const [settings, setSettings] = useState(() => {
    const parsed = parseCmsValue(data, defaultVal);
    return { ...defaultVal, ...parsed, steps: parsed.steps || defaultVal.steps };
  });
  const save = useSaveContent('homepage_how_to_order');

  useEffect(() => {
    const parsed = parseCmsValue(data, defaultVal);
    setSettings({ ...defaultVal, ...parsed, steps: parsed.steps || defaultVal.steps });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const updateStep = (i: number, field: string, value: any) => {
    const steps = [...settings.steps];
    (steps[i] as any)[field] = value;
    setSettings({ ...settings, steps });
  };

  const addStep = () => {
    const nextOrder = settings.steps.length + 1;
    setSettings({
      ...settings,
      steps: [...settings.steps, { icon: '⭐', title: '', description: '', order: nextOrder, enabled: true }],
    });
  };

  return (
    <div className="space-y-6">
      <Card padding="lg" className="space-y-5">
        <div>
          <h3 className="font-semibold text-dark-900">How to Order Section</h3>
          <p className="text-sm text-dark-500 mt-1">
            Displays step-by-step ordering instructions on the homepage.
          </p>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
            className="w-5 h-5 rounded text-primary-600 border-beige-300"
          />
          <div>
            <p className="text-sm font-medium text-dark-900">Show this section</p>
          </div>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Section Title</label>
            <input
              className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              placeholder="How to Order"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Subtitle</label>
            <input
              className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
              value={settings.subtitle}
              onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
              placeholder="Short description below the title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">CTA Button Text</label>
            <input
              className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
              value={settings.ctaText}
              onChange={(e) => setSettings({ ...settings, ctaText: e.target.value })}
              placeholder="Start Shopping"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">CTA Button Link</label>
            <input
              className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
              value={settings.ctaLink}
              onChange={(e) => setSettings({ ...settings, ctaLink: e.target.value })}
              placeholder="/products"
            />
          </div>
        </div>
      </Card>

      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-dark-900">Steps</h3>
            <p className="text-xs text-dark-500 mt-0.5">3–5 steps recommended.</p>
          </div>
          <Button size="sm" variant="outline" leftIcon={<HiOutlinePlus size={16} />} onClick={addStep}>
            Add Step
          </Button>
        </div>

        {settings.steps.map((step, i) => (
          <div key={i} className="flex gap-3 items-start p-4 bg-beige-50 rounded-lg">
            <input
              className="w-14 px-2 py-2 border border-beige-300 rounded-lg text-center text-xl"
              value={step.icon}
              onChange={(e) => updateStep(i, 'icon', e.target.value)}
              title="Icon (emoji)"
            />
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="px-3 py-2 border border-beige-300 rounded-lg text-sm"
                  value={step.title}
                  onChange={(e) => updateStep(i, 'title', e.target.value)}
                  placeholder="Step title"
                />
                <input
                  type="number"
                  className="px-3 py-2 border border-beige-300 rounded-lg text-sm"
                  value={step.order}
                  onChange={(e) => updateStep(i, 'order', Number(e.target.value))}
                  placeholder="Order (1, 2, 3...)"
                  min={1}
                />
              </div>
              <textarea
                className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
                rows={2}
                value={step.description}
                onChange={(e) => updateStep(i, 'description', e.target.value)}
                placeholder="Step description"
              />
            </div>
            <div className="flex flex-col gap-2 items-center">
              <label className="flex items-center gap-1 text-xs text-dark-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={step.enabled}
                  onChange={(e) => updateStep(i, 'enabled', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                On
              </label>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, steps: settings.steps.filter((_, j) => j !== i) })}
                className="text-red-500 hover:text-red-700 p-1"
                title="Remove"
              >
                <HiOutlineX size={18} />
              </button>
            </div>
          </div>
        ))}
      </Card>

      <Button leftIcon={<HiOutlineSave size={16} />} onClick={() => save.mutate(settings)} isLoading={save.isPending}>
        Save How to Order
      </Button>
    </div>
  );
}

// ========== APP DOWNLOAD EDITOR ==========

function AppDownloadEditor({ data }: { data: any }) {
  const defaultVal = {
    enabled: false,
    badge: 'PRIMO Mobile',
    title: 'Download the PRIMO App',
    subtitle: 'Shop smarter. Track orders. Get exclusive app-only deals — all from your pocket.',
    appStoreUrl: '',
    googlePlayUrl: '',
  };

  const [settings, setSettings] = useState(() => ({ ...defaultVal, ...parseCmsValue(data, defaultVal) }));
  const save = useSaveContent('homepage_app_download');

  useEffect(() => {
    setSettings({ ...defaultVal, ...parseCmsValue(data, defaultVal) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <Card padding="lg" className="space-y-6">
      <div>
        <h3 className="font-semibold text-dark-900">App Download Section</h3>
        <p className="text-sm text-dark-500 mt-1">
          A dark promotional section with App Store and Google Play download buttons. Hidden until at least one URL is set.
        </p>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
          className="w-5 h-5 rounded text-primary-600 border-beige-300"
        />
        <div>
          <p className="text-sm font-medium text-dark-900">Show app download section</p>
          <p className="text-xs text-dark-500">Also requires at least one store URL to be filled.</p>
        </div>
      </label>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-700 mb-1">Badge Label</label>
          <input
            className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
            value={settings.badge}
            onChange={(e) => setSettings({ ...settings, badge: e.target.value })}
            placeholder="PRIMO Mobile"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-700 mb-1">Title</label>
          <input
            className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
            value={settings.title}
            onChange={(e) => setSettings({ ...settings, title: e.target.value })}
            placeholder="Download the PRIMO App"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-700 mb-1">Subtitle</label>
          <textarea
            className="w-full px-4 py-2 border border-beige-300 rounded-lg text-sm"
            rows={2}
            value={settings.subtitle}
            onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
            placeholder="Short description / value proposition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">App Store URL</label>
            <input
              className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
              value={settings.appStoreUrl}
              onChange={(e) => setSettings({ ...settings, appStoreUrl: e.target.value })}
              placeholder="https://apps.apple.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Google Play URL</label>
            <input
              className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
              value={settings.googlePlayUrl}
              onChange={(e) => setSettings({ ...settings, googlePlayUrl: e.target.value })}
              placeholder="https://play.google.com/store/apps/..."
            />
          </div>
        </div>
      </div>

      <Button leftIcon={<HiOutlineSave size={16} />} onClick={() => save.mutate(settings)} isLoading={save.isPending}>
        Save App Download Section
      </Button>
    </Card>
  );
}

// ========== TABBED PRODUCTS EDITOR ==========

type TabId = 'featured' | 'on_sale' | 'top_rated' | 'new_arrivals';

interface TabConfig {
  id: TabId;
  label: string;
  enabled: boolean;
}

function TabbedProductsEditor({ data }: { data: any }) {
  const defaultVal = {
    enabled: true,
    title: 'Shop Our Collection',
    itemsPerTab: 8,
    tabs: [
      { id: 'featured', label: 'Featured', enabled: true },
      { id: 'on_sale', label: 'On Sale', enabled: true },
      { id: 'top_rated', label: 'Top Rated', enabled: true },
      { id: 'new_arrivals', label: 'New Arrivals', enabled: true },
    ] as TabConfig[],
  };

  const [settings, setSettings] = useState(() => {
    const parsed = parseCmsValue(data, defaultVal);
    return { ...defaultVal, ...parsed, tabs: parsed.tabs || defaultVal.tabs };
  });
  const save = useSaveContent('homepage_tabbed_products');

  useEffect(() => {
    const parsed = parseCmsValue(data, defaultVal);
    setSettings({ ...defaultVal, ...parsed, tabs: parsed.tabs || defaultVal.tabs });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const updateTab = (i: number, field: string, value: any) => {
    const tabs = [...settings.tabs];
    (tabs[i] as any)[field] = value;
    setSettings({ ...settings, tabs });
  };

  return (
    <div className="space-y-6">
      <Card padding="lg" className="space-y-5">
        <div>
          <h3 className="font-semibold text-dark-900">Product Tabs Section</h3>
          <p className="text-sm text-dark-500 mt-1">
            Tabbed product display with Featured, On Sale, Top Rated, and New Arrivals tabs.
          </p>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
            className="w-5 h-5 rounded text-primary-600 border-beige-300"
          />
          <div>
            <p className="text-sm font-medium text-dark-900">Show product tabs section</p>
          </div>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Section Title</label>
            <input
              className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              placeholder="Shop Our Collection"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Items per Tab</label>
            <input
              type="number"
              min={4}
              max={12}
              className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
              value={settings.itemsPerTab}
              onChange={(e) => setSettings({ ...settings, itemsPerTab: Number(e.target.value) })}
            />
          </div>
        </div>
      </Card>

      <Card padding="lg" className="space-y-4">
        <h3 className="font-semibold text-dark-900">Tabs Configuration</h3>
        <p className="text-xs text-dark-500">Enable or rename each tab. At least one tab must be enabled.</p>

        {settings.tabs.map((tab, i) => (
          <div key={tab.id} className="flex items-center gap-3 p-3 bg-beige-50 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tab.enabled}
                onChange={(e) => updateTab(i, 'enabled', e.target.checked)}
                className="w-4 h-4 rounded text-primary-600"
              />
              <span className="text-xs text-dark-500 w-20 font-mono">{tab.id}</span>
            </label>
            <input
              className="flex-1 px-3 py-2 border border-beige-300 rounded-lg text-sm"
              value={tab.label}
              onChange={(e) => updateTab(i, 'label', e.target.value)}
              placeholder="Tab label"
            />
          </div>
        ))}
      </Card>

      <Button leftIcon={<HiOutlineSave size={16} />} onClick={() => save.mutate(settings)} isLoading={save.isPending}>
        Save Product Tabs
      </Button>
    </div>
  );
}

// ========== NEW ARRIVALS EDITOR ==========

function NewArrivalsEditor({ data }: { data: any }) {
  const defaultVal = {
    enabled: true,
    title: 'New Arrivals',
    subtitle: 'Fresh picks just landed',
    count: 10,
  };

  const [settings, setSettings] = useState(() => ({ ...defaultVal, ...parseCmsValue(data, defaultVal) }));
  const save = useSaveContent('homepage_new_arrivals');

  useEffect(() => {
    setSettings({ ...defaultVal, ...parseCmsValue(data, defaultVal) });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <Card padding="lg" className="space-y-6">
      <div>
        <h3 className="font-semibold text-dark-900">New Arrivals Section</h3>
        <p className="text-sm text-dark-500 mt-1">
          A horizontal scrollable carousel showing the latest products (sorted by newest first).
        </p>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
          className="w-5 h-5 rounded text-primary-600 border-beige-300"
        />
        <div>
          <p className="text-sm font-medium text-dark-900">Show new arrivals section</p>
        </div>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-dark-700 mb-1">Section Title</label>
          <input
            className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
            value={settings.title}
            onChange={(e) => setSettings({ ...settings, title: e.target.value })}
            placeholder="New Arrivals"
          />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-dark-700 mb-1">Subtitle</label>
          <input
            className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
            value={settings.subtitle}
            onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
            placeholder="Fresh picks just landed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-700 mb-1">Products to Show</label>
          <input
            type="number"
            min={4}
            max={20}
            className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
            value={settings.count}
            onChange={(e) => setSettings({ ...settings, count: Number(e.target.value) })}
          />
          <p className="text-xs text-dark-400 mt-1">4–20 products shown in horizontal scroll.</p>
        </div>
      </div>

      <Button leftIcon={<HiOutlineSave size={16} />} onClick={() => save.mutate(settings)} isLoading={save.isPending}>
        Save New Arrivals
      </Button>
    </Card>
  );
}

// ========== ANNOUNCEMENT BAR EDITOR ==========

function AnnouncementBarEditor({ data }: { data: any }) {
  const defaultVal = {
    enabled: true,
    messages: [
      { text: 'Free shipping on orders over SAR 500 🚚', enabled: true },
    ],
  };

  // Lazy initializer: read from DB data on mount (parent ensures isLoading=false before render)
  const [settings, setSettings] = useState(() => {
    const parsed = parseCmsValue(data, defaultVal);
    return {
      enabled: parsed.enabled ?? true,
      messages: parsed.messages ?? defaultVal.messages,
    };
  });
  const save = useSaveContent('homepage_announcement_bar');

  // Sync if DB data changes externally (e.g. background refetch after save)
  useEffect(() => {
    const parsed = parseCmsValue(data, defaultVal);
    setSettings({
      enabled: parsed.enabled ?? true,
      messages: parsed.messages ?? defaultVal.messages,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const updateMessage = (i: number, field: string, value: any) => {
    const msgs = [...settings.messages];
    (msgs[i] as any)[field] = value;
    setSettings({ ...settings, messages: msgs });
  };

  return (
    <Card padding="lg" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-dark-900">Announcement Bar</h3>
          <p className="text-sm text-dark-500 mt-0.5">
            The orange bar at the very top of the site. 1 message = static; 2+ messages = auto-rotating slider every 4 seconds.
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-dark-600">Enabled</span>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
            className="w-4 h-4 rounded text-primary-600"
          />
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-dark-800">Messages</h4>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<HiOutlinePlus size={14} />}
            onClick={() =>
              setSettings({
                ...settings,
                messages: [...settings.messages, { text: '', enabled: true }],
              })
            }
          >
            Add Message
          </Button>
        </div>

        {settings.messages.map((msg, i) => (
          <div key={i} className="flex gap-3 items-center p-3 bg-beige-50 rounded-lg border border-beige-200">
            <input
              className="flex-1 px-3 py-2 border border-beige-300 rounded-lg text-sm"
              value={msg.text}
              onChange={(e) => updateMessage(i, 'text', e.target.value)}
              placeholder="e.g. Free shipping on orders over SAR 500 🚚"
            />
            <label className="flex items-center gap-1 text-xs text-dark-500 cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={msg.enabled}
                onChange={(e) => updateMessage(i, 'enabled', e.target.checked)}
                className="w-4 h-4 rounded"
              />
              On
            </label>
            <button
              type="button"
              onClick={() =>
                setSettings({ ...settings, messages: settings.messages.filter((_, j) => j !== i) })
              }
              className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
              title="Remove"
            >
              <HiOutlineX size={16} />
            </button>
          </div>
        ))}

        {settings.messages.length === 0 && (
          <p className="text-sm text-dark-400 italic">No messages. Add at least one to show the bar.</p>
        )}
      </div>

      {/* Preview */}
      {settings.enabled && settings.messages.some((m) => m.enabled) && (
        <div className="rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 h-9 flex items-center justify-center px-8">
            <p className="text-xs font-medium text-white text-center">
              {settings.messages.find((m) => m.enabled)?.text || ''}
            </p>
          </div>
          <p className="text-xs text-center text-dark-400 py-1 bg-beige-50">Preview (first enabled message)</p>
        </div>
      )}

      <Button leftIcon={<HiOutlineSave size={16} />} onClick={() => save.mutate(settings)} isLoading={save.isPending}>
        Save Announcement Bar
      </Button>
    </Card>
  );
}

// ========== PROMO BANNERS EDITOR ==========

interface PromoBannerItem {
  id: string;
  enabled: boolean;
  imageUrl: string;
  altText: string;
  title: string;
  subtitle: string;
  linkType: 'category' | 'product' | 'collection' | 'url';
  linkValue: string;
}

const defaultBanners: PromoBannerItem[] = [
  { id: 'banner_1', enabled: true, imageUrl: '', altText: 'Promo Banner 1', title: '', subtitle: '', linkType: 'url', linkValue: '/products' },
  { id: 'banner_2', enabled: true, imageUrl: '', altText: 'Promo Banner 2', title: '', subtitle: '', linkType: 'url', linkValue: '/products' },
];

function PromoBannersEditor({ data }: { data: any }) {
  const [enabled, setEnabled] = useState(() => {
    const parsed = parseCmsValue(data, { enabled: true, banners: defaultBanners });
    return parsed.enabled ?? true;
  });
  const [banners, setBanners] = useState<PromoBannerItem[]>(() => {
    const parsed = parseCmsValue(data, { enabled: true, banners: defaultBanners });
    return parsed.banners ?? defaultBanners;
  });
  const save = useSaveContent('homepage_promo_banners');

  useEffect(() => {
    const parsed = parseCmsValue(data, { enabled: true, banners: defaultBanners });
    setEnabled(parsed.enabled ?? true);
    setBanners(parsed.banners ?? defaultBanners);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const updateBanner = (index: number, field: keyof PromoBannerItem, value: any) => {
    const next = [...banners];
    (next[index] as any)[field] = value;
    setBanners(next);
  };

  const linkTypeOptions = [
    { value: 'url', label: 'Direct URL' },
    { value: 'category', label: 'Category (ID or slug)' },
    { value: 'product', label: 'Product (slug)' },
    { value: 'collection', label: 'Collection (slug)' },
  ];

  const linkPlaceholder = (type: string) => {
    if (type === 'category') return 'Category ID or slug e.g. 6702abc or kitchen';
    if (type === 'product') return 'Product slug e.g. delonghi-espresso';
    if (type === 'collection') return 'Collection slug e.g. new-arrivals';
    return 'e.g. /products?onSale=true';
  };

  return (
    <Card padding="lg" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-dark-900">Promo Banners Block</h3>
          <p className="text-sm text-dark-500 mt-0.5">
            Two stacked image banners at the top of the homepage. Banner 1 is tall (main promo), Banner 2 is a shorter strip below it.
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-dark-600">Block Enabled</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4 rounded text-primary-600"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {banners.map((banner, i) => (
          <div key={banner.id} className="border border-beige-200 rounded-xl p-4 space-y-3 bg-beige-50">
            <div className="flex items-center justify-between">
              <span className="font-medium text-dark-800 text-sm">Banner {i + 1}</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <span className="text-xs text-dark-500">Enabled</span>
                <input
                  type="checkbox"
                  checked={banner.enabled}
                  onChange={(e) => updateBanner(i, 'enabled', e.target.checked)}
                  className="w-4 h-4 rounded text-primary-600"
                />
              </label>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1">Image URL *</label>
              <input
                className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
                value={banner.imageUrl}
                onChange={(e) => updateBanner(i, 'imageUrl', e.target.value)}
                placeholder="https://example.com/banner.jpg"
              />
              {banner.imageUrl && (
                <div className="mt-2 rounded-lg overflow-hidden aspect-[16/7] relative bg-beige-200">
                  <img src={banner.imageUrl} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Alt text */}
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1">Alt Text</label>
              <input
                className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
                value={banner.altText}
                onChange={(e) => updateBanner(i, 'altText', e.target.value)}
                placeholder="Banner description for accessibility"
              />
            </div>

            {/* Optional overlay text */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-dark-600 mb-1">Title (overlay)</label>
                <input
                  className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
                  value={banner.title}
                  onChange={(e) => updateBanner(i, 'title', e.target.value)}
                  placeholder="e.g. Summer Sale"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-dark-600 mb-1">Subtitle (overlay)</label>
                <input
                  className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
                  value={banner.subtitle}
                  onChange={(e) => updateBanner(i, 'subtitle', e.target.value)}
                  placeholder="e.g. Up to 40% off"
                />
              </div>
            </div>

            {/* Link */}
            <div>
              <label className="block text-xs font-medium text-dark-600 mb-1">Link Type</label>
              <select
                title="Link type"
                className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm mb-2"
                value={banner.linkType}
                onChange={(e) => updateBanner(i, 'linkType', e.target.value)}
              >
                {linkTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <input
                className="w-full px-3 py-2 border border-beige-300 rounded-lg text-sm"
                value={banner.linkValue}
                onChange={(e) => updateBanner(i, 'linkValue', e.target.value)}
                placeholder={linkPlaceholder(banner.linkType)}
              />
            </div>

          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-beige-200 bg-beige-50 -mx-6 px-6 pb-0 rounded-b-xl">
        <p className="text-xs text-dark-400 mb-3 pt-3">
          • Banner 1 is always the tall main banner; Banner 2 is always the shorter strip below it.<br />
          • Leave image URL empty to show a placeholder (banner still visible in admin preview).
        </p>
      </div>

      <Button leftIcon={<HiOutlineSave size={16} />} onClick={() => save.mutate({ enabled, banners })} isLoading={save.isPending}>
        Save Promo Banners
      </Button>
    </Card>
  );
}
