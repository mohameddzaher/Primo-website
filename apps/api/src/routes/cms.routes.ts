// ============================================
// PRIMO API - CMS Routes
// ============================================

import { Router, Response } from 'express';
import mongoose from 'mongoose';
import {
  updateCMSContentSchema,
  updatePolicyPageSchema,
  createFAQSchema,
  updateFAQSchema,
  subscribeNewsletterSchema,
  createContactMessageSchema,
} from '@primo/shared';
import { CMSContent, PolicyPage, FAQ } from '../models/CMS';
import { Newsletter } from '../models/Newsletter';
import { ContactMessage } from '../models/Contact';
import { authenticate, requireAdmin, requireSuperAdmin, requirePermission, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { cacheResponse, invalidateOnWrite } from '../middleware/cache';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/errorHandler';
import {
  forwardContactMessage,
  sendNewsletterConfirmation,
  notifyNewSubscriber,
} from '../services/email.service';

const router = Router();

// CMS edits from the admin panel clear the cached storefront content
router.use(invalidateOnWrite('cms'));

// ========== DEFAULT CONTENT ==========

const defaultPolicies: Record<string, { title: string; content: string }> = {
  privacy: {
    title: 'Privacy Policy',
    content: `
<h2>Introduction</h2>
<p>At PRIMO, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase.</p>

<h2>Information We Collect</h2>
<h3>Personal Information</h3>
<p>When you create an account, place an order, or contact us, we may collect:</p>
<ul>
<li>Full name, email address, and phone number</li>
<li>Shipping and billing addresses</li>
<li>Payment information (processed securely through our payment providers)</li>
<li>Order history and preferences</li>
</ul>

<h3>Automatically Collected Information</h3>
<p>When you browse our website, we may automatically collect:</p>
<ul>
<li>IP address and browser type</li>
<li>Device information and operating system</li>
<li>Pages visited and time spent on our site</li>
<li>Referring website addresses</li>
</ul>

<h2>How We Use Your Information</h2>
<p>We use the information we collect to:</p>
<ul>
<li>Process and fulfill your orders</li>
<li>Send order confirmations and shipping updates</li>
<li>Provide customer support and respond to inquiries</li>
<li>Personalize your shopping experience</li>
<li>Send promotional offers and newsletters (with your consent)</li>
<li>Improve our website, products, and services</li>
<li>Prevent fraud and ensure security</li>
</ul>

<h2>Information Sharing</h2>
<p>We do not sell, trade, or rent your personal information to third parties. We may share your information with:</p>
<ul>
<li><strong>Shipping carriers</strong> to deliver your orders</li>
<li><strong>Payment processors</strong> to securely handle transactions</li>
<li><strong>Service providers</strong> who assist in operating our website</li>
<li><strong>Legal authorities</strong> when required by law</li>
</ul>

<h2>Data Security</h2>
<p>We implement industry-standard security measures to protect your personal information, including SSL encryption, secure data storage, and regular security audits. However, no method of transmission over the Internet is 100% secure.</p>

<h2>Cookies</h2>
<p>We use cookies and similar technologies to enhance your browsing experience, remember your preferences, and analyze website traffic. You can manage cookie preferences through your browser settings.</p>

<h2>Your Rights</h2>
<p>You have the right to:</p>
<ul>
<li>Access, update, or delete your personal information</li>
<li>Opt out of marketing communications</li>
<li>Request a copy of the data we hold about you</li>
<li>Lodge a complaint with a data protection authority</li>
</ul>

<h2>Contact Us</h2>
<p>If you have questions about this Privacy Policy or your personal data, please contact us at <a href="mailto:privacy@primo.com">privacy@primo.com</a> or through our Contact page.</p>

<p><em>Last updated: February 2026</em></p>
`,
  },
  terms: {
    title: 'Terms of Service',
    content: `
<h2>Agreement to Terms</h2>
<p>By accessing and using the PRIMO website, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our website.</p>

<h2>Account Registration</h2>
<p>To place orders, you may need to create an account. You are responsible for:</p>
<ul>
<li>Providing accurate and complete registration information</li>
<li>Maintaining the security of your account credentials</li>
<li>All activities that occur under your account</li>
<li>Notifying us immediately of any unauthorized use</li>
</ul>

<h2>Products and Pricing</h2>
<ul>
<li>All product descriptions and images are as accurate as possible, but we do not guarantee that colors or details displayed on your screen are exact.</li>
<li>Prices are listed in SAR and are subject to change without notice.</li>
<li>We reserve the right to limit quantities and refuse any order.</li>
<li>Promotional offers and discounts may have specific terms and expiration dates.</li>
</ul>

<h2>Orders and Payment</h2>
<ul>
<li>By placing an order, you are making an offer to purchase the selected products.</li>
<li>We reserve the right to accept or decline any order.</li>
<li>Payment must be completed at the time of order or upon delivery (for Cash on Delivery).</li>
<li>All payment information is processed securely through trusted payment providers.</li>
</ul>

<h2>Shipping and Delivery</h2>
<p>Delivery times are estimates and may vary depending on your location and product availability. Please refer to our <a href="/shipping">Shipping Information</a> page for detailed delivery policies.</p>

<h2>Returns and Refunds</h2>
<p>We want you to be completely satisfied with your purchase. If you are not, please review our <a href="/returns">Returns & Exchanges</a> policy for information on how to return or exchange items.</p>

<h2>Intellectual Property</h2>
<p>All content on the PRIMO website, including text, graphics, logos, images, and software, is the property of PRIMO or its content suppliers and is protected by intellectual property laws. You may not reproduce, distribute, or use any content without our written permission.</p>

<h2>Limitation of Liability</h2>
<p>PRIMO shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our website or products. Our total liability shall not exceed the amount paid for the product in question.</p>

<h2>User Conduct</h2>
<p>You agree not to:</p>
<ul>
<li>Use the website for any unlawful purpose</li>
<li>Attempt to gain unauthorized access to any part of the website</li>
<li>Interfere with the proper functioning of the website</li>
<li>Submit false or misleading information</li>
<li>Use automated tools to access or scrape the website</li>
</ul>

<h2>Changes to Terms</h2>
<p>We reserve the right to update these Terms of Service at any time. Changes will be effective immediately upon posting. Your continued use of the website constitutes acceptance of the updated terms.</p>

<h2>Governing Law</h2>
<p>These terms are governed by the laws of the Kingdom of Saudi Arabia. Any disputes shall be resolved in the competent courts of Saudi Arabia.</p>

<h2>Contact Us</h2>
<p>For questions about these Terms of Service, please contact us at <a href="mailto:legal@primo.com">legal@primo.com</a> or through our Contact page.</p>

<p><em>Last updated: February 2026</em></p>
`,
  },
  shipping: {
    title: 'Shipping Information',
    content: `
<h2>Delivery Areas</h2>
<p>PRIMO currently delivers across the Kingdom of Saudi Arabia, including all major cities and regions:</p>
<ul>
<li><strong>Riyadh</strong> - 1-2 business days</li>
<li><strong>Jeddah</strong> - 1-2 business days</li>
<li><strong>Dammam / Eastern Province</strong> - 2-3 business days</li>
<li><strong>Makkah & Madinah</strong> - 2-3 business days</li>
<li><strong>Other cities</strong> - 3-5 business days</li>
<li><strong>Remote areas</strong> - 5-7 business days</li>
</ul>

<h2>Shipping Rates</h2>
<table>
<thead>
<tr><th>Order Value</th><th>Shipping Cost</th></tr>
</thead>
<tbody>
<tr><td>Orders above 500 SAR</td><td><strong>FREE</strong></td></tr>
<tr><td>Orders below 500 SAR</td><td>25 SAR flat rate</td></tr>
<tr><td>Express delivery (next day)</td><td>50 SAR</td></tr>
</tbody>
</table>

<h2>Order Processing</h2>
<ul>
<li>Orders placed before <strong>2:00 PM</strong> are processed the same business day.</li>
<li>Orders placed after 2:00 PM or on weekends/holidays are processed the next business day.</li>
<li>You will receive a confirmation email with tracking information once your order ships.</li>
</ul>

<h2>Order Tracking</h2>
<p>Once your order has been shipped, you can track it by:</p>
<ul>
<li>Using the <a href="/track-order">Track Order</a> page with your order number</li>
<li>Checking your order status in <a href="/account/orders">My Orders</a></li>
<li>Clicking the tracking link in your shipping confirmation email</li>
</ul>

<h2>Delivery Instructions</h2>
<ul>
<li>Our delivery partners will contact you before delivery to confirm availability.</li>
<li>For large appliances, delivery includes bringing the item to your door.</li>
<li>Please ensure someone is available to receive the delivery.</li>
<li>You can add special delivery instructions when placing your order.</li>
</ul>

<h2>Delivery Issues</h2>
<p>If you experience any issues with your delivery:</p>
<ul>
<li>Contact us within 24 hours of the expected delivery date</li>
<li>Report any damaged packages immediately before signing</li>
<li>Reach out to our support team at <a href="mailto:support@primo.com">support@primo.com</a> or call us</li>
</ul>

<h2>International Shipping</h2>
<p>We currently do not offer international shipping. We plan to expand to GCC countries in the future. Stay tuned for updates!</p>
`,
  },
  returns: {
    title: 'Returns & Exchanges',
    content: `
<h2>Return Policy Overview</h2>
<p>At PRIMO, we want you to be completely satisfied with your purchase. If you're not happy with your order, we offer a hassle-free return and exchange process.</p>

<h2>Return Eligibility</h2>
<ul>
<li>Items can be returned within <strong>14 days</strong> of delivery.</li>
<li>Products must be in their <strong>original packaging</strong> and unused condition.</li>
<li>All accessories, manuals, and tags must be included.</li>
<li>The product must not show signs of use, damage, or modification.</li>
</ul>

<h2>Non-Returnable Items</h2>
<p>The following items cannot be returned:</p>
<ul>
<li>Products that have been used, installed, or show signs of wear</li>
<li>Items with removed or damaged packaging</li>
<li>Personal care and hygiene appliances (hair dryers, shavers, etc.) once opened</li>
<li>Products purchased on final sale or clearance</li>
<li>Gift cards and vouchers</li>
</ul>

<h2>How to Return an Item</h2>
<ol>
<li><strong>Initiate your return</strong> by contacting our customer support team or through your account under <a href="/account/orders">My Orders</a>.</li>
<li><strong>Pack the item</strong> securely in its original packaging with all accessories.</li>
<li><strong>Schedule a pickup</strong> - our courier will collect the item from your address at no extra cost.</li>
<li><strong>Inspection</strong> - once received, we'll inspect the item within 2-3 business days.</li>
<li><strong>Refund or exchange</strong> will be processed after successful inspection.</li>
</ol>

<h2>Refund Process</h2>
<ul>
<li><strong>Original payment method</strong>: Refund will be credited back to your original payment method within 7-10 business days.</li>
<li><strong>Cash on Delivery orders</strong>: Refund will be processed via bank transfer. Please provide your bank details.</li>
<li><strong>Shipping costs</strong>: Original shipping fees are non-refundable unless the return is due to our error.</li>
</ul>

<h2>Exchanges</h2>
<p>Want a different product? You can exchange your item for another product of equal or greater value:</p>
<ul>
<li>If the new item costs more, you'll pay the difference.</li>
<li>If the new item costs less, we'll refund the difference.</li>
<li>Exchange items are subject to availability.</li>
</ul>

<h2>Damaged or Defective Items</h2>
<p>If you received a damaged or defective product:</p>
<ul>
<li>Contact us within <strong>48 hours</strong> of delivery with photos of the damage.</li>
<li>We will arrange a free pickup and replacement or full refund.</li>
<li>Do not discard the damaged item or packaging until the claim is resolved.</li>
</ul>

<h2>Contact Us</h2>
<p>For return and exchange inquiries, contact our support team at <a href="mailto:returns@primo.com">returns@primo.com</a> or call us. We're here to help!</p>
`,
  },
  warranty: {
    title: 'Warranty Policy',
    content: `
<h2>Warranty Coverage</h2>
<p>All products sold by PRIMO come with a manufacturer's warranty. The warranty period varies by product and brand:</p>

<table>
<thead>
<tr><th>Product Category</th><th>Warranty Period</th></tr>
</thead>
<tbody>
<tr><td>Large Appliances (Washing machines, Refrigerators)</td><td>2-5 years</td></tr>
<tr><td>Kitchen Appliances (Mixers, Blenders, Air Fryers)</td><td>1-2 years</td></tr>
<tr><td>Coffee Machines</td><td>1-2 years</td></tr>
<tr><td>Small Appliances (Irons, Toasters)</td><td>1 year</td></tr>
<tr><td>Personal Care (Hair dryers, Shavers)</td><td>1 year</td></tr>
<tr><td>Vacuum Cleaners & Robot Vacuums</td><td>1-2 years</td></tr>
</tbody>
</table>

<h2>What's Covered</h2>
<ul>
<li>Manufacturing defects in materials and workmanship</li>
<li>Malfunctioning components under normal use</li>
<li>Electrical or mechanical failures not caused by misuse</li>
</ul>

<h2>What's NOT Covered</h2>
<ul>
<li>Damage caused by misuse, accidents, or negligence</li>
<li>Normal wear and tear</li>
<li>Unauthorized modifications or repairs</li>
<li>Damage from power surges or improper voltage</li>
<li>Cosmetic damage (scratches, dents) that doesn't affect functionality</li>
<li>Consumable parts (filters, bulbs, batteries)</li>
</ul>

<h2>How to Claim Warranty</h2>
<ol>
<li><strong>Contact our support team</strong> at <a href="mailto:warranty@primo.com">warranty@primo.com</a> with your order number and a description of the issue.</li>
<li><strong>Provide proof of purchase</strong> - your PRIMO order confirmation or invoice.</li>
<li><strong>Describe the issue</strong> with photos or videos if possible.</li>
<li><strong>Our team will assess</strong> whether the issue falls under warranty coverage.</li>
<li><strong>If approved</strong>, we will arrange repair, replacement, or refund as appropriate.</li>
</ol>

<h2>Warranty Service Options</h2>
<ul>
<li><strong>Repair</strong>: The product will be repaired at no cost. Turnaround time is typically 5-10 business days.</li>
<li><strong>Replacement</strong>: If the product cannot be repaired, we will replace it with the same or equivalent model.</li>
<li><strong>Refund</strong>: In rare cases where repair or replacement isn't possible, a full refund will be issued.</li>
</ul>

<h2>Extended Warranty</h2>
<p>For select products, we offer extended warranty plans that provide additional coverage beyond the standard manufacturer warranty. Check the product page for extended warranty options at the time of purchase.</p>

<h2>Brand Service Centers</h2>
<p>For certain brands, warranty service may be provided directly through the brand's authorized service centers. Our team will guide you to the appropriate service center when applicable.</p>

<h2>Contact Us</h2>
<p>For warranty questions or claims, reach out to <a href="mailto:warranty@primo.com">warranty@primo.com</a> or contact our customer support team.</p>
`,
  },
};

const defaultFaqs = [
  { question: 'How do I place an order?', answer: 'Simply browse our products, add items to your cart, and proceed to checkout. You can pay using credit/debit card, Apple Pay, or Cash on Delivery.', order: 1 },
  { question: 'What payment methods do you accept?', answer: 'We accept Visa, Mastercard, Apple Pay, and Cash on Delivery (COD). All online payments are processed securely through our encrypted payment gateway.', order: 2 },
  { question: 'How long does delivery take?', answer: 'Delivery times vary by location. Major cities (Riyadh, Jeddah, Dammam) typically receive orders within 1-2 business days. Other areas may take 3-7 business days. Orders above 500 SAR qualify for free shipping.', order: 3 },
  { question: 'Can I track my order?', answer: 'Yes! Once your order ships, you will receive a tracking number via email. You can also track your order anytime on our Track Order page or in your account under My Orders.', order: 4 },
  { question: 'What is your return policy?', answer: 'We offer a 14-day return policy. Items must be in their original packaging and unused condition. Contact our support team to initiate a return, and we will arrange a free pickup from your address.', order: 5 },
  { question: 'Do your products come with a warranty?', answer: 'Yes, all our products come with a manufacturer warranty ranging from 1-5 years depending on the product category. Check the product details page or our Warranty Policy page for specific warranty information.', order: 6 },
  { question: 'How do I contact customer support?', answer: 'You can reach us via email at support@primo.com, through our Contact page, or by phone. Our support team is available Saturday through Thursday, 9 AM to 9 PM.', order: 7 },
  { question: 'Can I change or cancel my order?', answer: 'You can modify or cancel your order before it has been shipped. Once the order is in transit, it cannot be cancelled but you can return it after delivery. Contact our support team as soon as possible for order changes.', order: 8 },
  { question: 'Do you offer gift wrapping?', answer: 'Currently, we do not offer gift wrapping services. However, all our products come in premium branded packaging that makes for a great gift presentation.', order: 9 },
  { question: 'Are the products original and authentic?', answer: 'Absolutely! PRIMO is an authorized dealer for all brands we carry. Every product is 100% genuine and comes with official manufacturer warranty and support.', order: 10 },
];

const defaultContent: Record<string, { value: string; type: string }> = {
  homepage_announcement_bar: {
    type: 'json',
    value: JSON.stringify({
      enabled: true,
      messages: [
        { text: 'Free shipping on orders over SAR 500 🚚', enabled: true },
        { text: 'Authorized distributor — 2-year warranty on all products ✅', enabled: true },
        { text: '30-day easy returns | 24/7 customer support 💬', enabled: true },
      ],
    }),
  },
  homepage_features: {
    type: 'json',
    value: JSON.stringify([
      { icon: '🚚', title: 'Free Shipping', description: 'Free delivery on orders over SAR 2,000 across all regions' },
      { icon: '🛡️', title: '2-Year Warranty', description: 'Extended warranty on all products with full parts coverage' },
      { icon: '↩️', title: 'Easy Returns', description: '30-day hassle-free returns with full refund guarantee' },
      { icon: '💬', title: '24/7 Support', description: 'Expert assistance available around the clock via phone and chat' },
    ]),
  },
  homepage_why_choose_us: {
    type: 'json',
    value: JSON.stringify({
      badge: 'Why Shop With Us',
      title: 'The PRIMO Difference',
      description: 'We are committed to providing you with the best shopping experience for premium home appliances.',
      reasons: [
        { icon: '✅', title: '100% Authentic Products', description: 'We are an authorized retailer for all brands. Every product comes with official warranty and original packaging.' },
        { icon: '💰', title: 'Best Price Guarantee', description: 'Find a lower price elsewhere? We will match it. Plus, enjoy exclusive discounts and member benefits.' },
        { icon: '🚀', title: 'Fast & Free Delivery', description: 'Free shipping on orders over SAR 2,000. Express delivery available for Riyadh and Jeddah.' },
        { icon: '🛡️', title: 'Extended Warranty', description: 'Get up to 2 years warranty on all products. Our extended warranty covers parts and labor costs.' },
        { icon: '↩️', title: 'Easy Returns', description: '30-day hassle-free returns. Not satisfied? Return it for a full refund, no questions asked.' },
        { icon: '💬', title: '24/7 Expert Support', description: 'Our dedicated team of experts is available around the clock to help you with any questions.' },
      ],
      cta: {
        title: 'Still Have Questions?',
        description: 'Our customer support team is here to help. Contact us anytime via phone, email, or live chat.',
        phone: '+966 123 456 789',
        buttonText: 'Send a Message',
        buttonLink: '/contact',
      },
    }),
  },
  homepage_newsletter: {
    type: 'json',
    value: JSON.stringify({
      badge: 'Newsletter',
      title: 'Get 10% Off Your First Order',
      description: 'Subscribe to our newsletter and receive exclusive deals, new product alerts, and expert tips for your home appliances.',
      benefits: [
        { icon: '🎁', title: 'Exclusive Offers', description: 'Get special discounts' },
        { icon: '⚡', title: 'Early Access', description: 'New arrivals first' },
        { icon: '🔔', title: 'Flash Sales', description: 'Never miss a deal' },
      ],
      formTitle: 'Join Our Community',
      subscriberText: 'Over 10,000+ subscribers already',
      buttonText: 'Subscribe & Get 10% Off',
    }),
  },
  homepage_hero_badges: {
    type: 'json',
    value: JSON.stringify([
      { icon: '🚚', title: 'Free Shipping', subtitle: 'On orders over SAR 2,000' },
      { icon: '🛡️', title: '2-Year Warranty', subtitle: 'On all products' },
      { icon: '🔒', title: 'Secure Payment', subtitle: 'Multiple options' },
      { icon: '💬', title: '24/7 Support', subtitle: 'Expert assistance' },
    ]),
  },
  homepage_hero_categories: {
    type: 'json',
    value: JSON.stringify([
      { emoji: '🍳', label: 'Kitchen', href: '/categories/kitchen-appliances' },
      { emoji: '☕', label: 'Coffee', href: '/categories/coffee-machines' },
      { emoji: '🧹', label: 'Cleaning', href: '/categories/home-essentials' },
      { emoji: '🔌', label: 'Small Appliances', href: '/categories/small-appliances' },
    ]),
  },
  homepage_hero_promos: {
    type: 'json',
    value: JSON.stringify([
      { emoji: '🔥', title: 'Flash Deals', subtitle: 'Up to 50% off', href: '/deals', color: 'from-red-500 to-orange-500' },
      { emoji: '✨', title: 'New Arrivals', subtitle: 'Latest products', href: '/products?new=true', color: 'from-blue-500 to-purple-500' },
      { emoji: '📦', title: 'All Categories', subtitle: 'Browse collection', href: '/categories', color: 'from-green-500 to-teal-500' },
      { emoji: '⭐', title: 'Best Sellers', subtitle: 'Top rated items', href: '/products?featured=true', color: 'from-yellow-500 to-amber-500' },
    ]),
  },
  homepage_promo_banners: {
    type: 'json',
    value: JSON.stringify({
      enabled: true,
      banners: [
        {
          id: 'banner_1',
          enabled: true,
          imageUrl: '',
          altText: 'Promo Banner 1',
          title: '',
          subtitle: '',
          linkType: 'url',
          linkValue: '/products',
          order: 1,
        },
        {
          id: 'banner_2',
          enabled: true,
          imageUrl: '',
          altText: 'Promo Banner 2',
          title: '',
          subtitle: '',
          linkType: 'url',
          linkValue: '/products',
          order: 2,
        },
      ],
    }),
  },
  homepage_topbar_settings: {
    type: 'json',
    value: JSON.stringify({ enabled: true }),
  },
  homepage_quick_strip: {
    type: 'json',
    value: JSON.stringify({
      enabled: true,
      showOnSale: true,
      showNewArrivals: true,
      customShortcuts: [],
    }),
  },
  homepage_tabbed_products: {
    type: 'json',
    value: JSON.stringify({
      enabled: true,
      title: 'Shop Our Collection',
      itemsPerTab: 8,
      tabs: [
        { id: 'featured', label: 'Featured', enabled: true },
        { id: 'on_sale', label: 'On Sale', enabled: true },
        { id: 'top_rated', label: 'Top Rated', enabled: true },
        { id: 'new_arrivals', label: 'New Arrivals', enabled: true },
      ],
    }),
  },
  homepage_new_arrivals: {
    type: 'json',
    value: JSON.stringify({
      enabled: true,
      title: 'New Arrivals',
      subtitle: 'Fresh picks just landed',
      count: 10,
    }),
  },
  homepage_wide_banner: {
    type: 'json',
    value: JSON.stringify({
      enabled: true,
      imageUrl: '',
      link: '',
      altText: 'Promotional banner',
    }),
  },
  homepage_how_to_order: {
    type: 'json',
    value: JSON.stringify({
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
      ],
    }),
  },
  homepage_app_download: {
    type: 'json',
    value: JSON.stringify({
      enabled: false,
      badge: 'PRIMO Mobile',
      title: 'Download the PRIMO App',
      subtitle: 'Shop smarter. Track orders. Get exclusive app-only deals — all from your pocket.',
      appStoreUrl: '',
      googlePlayUrl: '',
    }),
  },
  careers: {
    type: 'html',
    value: `
<h2>Why Work at PRIMO?</h2>
<p>PRIMO is a fast-growing e-commerce company specializing in premium home appliances. We're building the future of online shopping in the region, and we need talented, passionate people to join our journey.</p>

<h3>Our Culture</h3>
<ul>
<li><strong>Innovation First</strong> - We embrace new ideas and technologies</li>
<li><strong>Customer Obsessed</strong> - Everything we do starts with the customer</li>
<li><strong>Growth Mindset</strong> - We invest in our team's development</li>
<li><strong>Collaboration</strong> - We believe great things happen when we work together</li>
</ul>

<h3>Benefits</h3>
<ul>
<li>Competitive salary and performance bonuses</li>
<li>Health insurance for you and your family</li>
<li>Professional development budget</li>
<li>Flexible working arrangements</li>
<li>Employee discounts on all products</li>
<li>Team events and activities</li>
</ul>

<h3>Open Positions</h3>

<h4>Digital Marketing Specialist</h4>
<p><strong>Location:</strong> Riyadh | <strong>Type:</strong> Full-time</p>
<p>We're looking for a creative digital marketing specialist to manage our social media presence, run advertising campaigns, and drive brand awareness. Experience with e-commerce marketing and Arabic content creation is a plus.</p>

<h4>Customer Service Representative</h4>
<p><strong>Location:</strong> Riyadh | <strong>Type:</strong> Full-time</p>
<p>Join our customer support team to help customers with their orders, product questions, and after-sales service. Excellent communication skills in both Arabic and English are required.</p>

<h4>Warehouse Operations Associate</h4>
<p><strong>Location:</strong> Riyadh | <strong>Type:</strong> Full-time</p>
<p>Help us manage our growing inventory and ensure timely order fulfillment. Experience in warehouse operations or logistics is preferred.</p>

<hr />
<p>Don't see a role that fits? We're always looking for talented people. Send your resume to <a href="mailto:careers@primo.com">careers@primo.com</a> and tell us how you can contribute to PRIMO's growth.</p>
`,
  },
  press: {
    type: 'html',
    value: `
<h2>About PRIMO</h2>
<p>PRIMO is a leading online retailer of premium home appliances in Saudi Arabia. We offer a curated selection of top international brands, providing customers with high-quality products, competitive prices, and exceptional service.</p>

<h3>Key Facts</h3>
<ul>
<li><strong>Founded:</strong> 2024</li>
<li><strong>Headquarters:</strong> Riyadh, Saudi Arabia</li>
<li><strong>Products:</strong> 500+ premium home appliances</li>
<li><strong>Brands:</strong> 20+ international brands including Dyson, Philips, DeLonghi, Braun, and more</li>
<li><strong>Delivery:</strong> Nationwide across Saudi Arabia</li>
</ul>

<h3>Our Mission</h3>
<p>To make premium home appliances accessible to every household in the region through a seamless online shopping experience backed by authentic products and reliable service.</p>

<h3>Press Releases</h3>

<h4>PRIMO Launches Premium Home Appliance E-Commerce Platform</h4>
<p><em>Riyadh, 2024</em> — PRIMO officially launched its e-commerce platform, offering a curated selection of premium home appliances from world-renowned brands. The platform features an intuitive shopping experience with fast delivery across Saudi Arabia.</p>

<h4>PRIMO Expands Product Range with 10 New Brand Partnerships</h4>
<p><em>Riyadh, 2025</em> — PRIMO announced partnerships with 10 new international home appliance brands, expanding its product catalog to over 500 items across categories including kitchen, cleaning, personal care, and home essentials.</p>

<hr />

<h3>Media Inquiries</h3>
<p>For press inquiries, interviews, or media resources, please contact our communications team:</p>
<p>Email: <a href="mailto:press@primo.com">press@primo.com</a></p>

<h3>Brand Assets</h3>
<p>For approved PRIMO logos, brand guidelines, and media kit, please contact our press team.</p>
`,
  },
};

// Helper: seed default policy if not found
async function getOrCreatePolicy(slug: string): Promise<any> {
  const page = await PolicyPage.findOne({ slug }).lean();
  if (page) return page;
  if (!defaultPolicies[slug]) return null;
  const created = await PolicyPage.create({
    slug,
    title: defaultPolicies[slug].title,
    content: defaultPolicies[slug].content,
    isActive: true,
  });
  return created.toObject();
}

// Helper: seed default FAQs if none exist
async function getOrCreateFaqs(query: any) {
  let faqs = await FAQ.find(query).sort({ order: 1 }).lean();
  if (faqs.length === 0 && !query.categoryId) {
    await FAQ.insertMany(defaultFaqs.map(f => ({ ...f, isActive: true })));
    faqs = await FAQ.find(query).sort({ order: 1 }).lean();
  }
  return faqs;
}

// Helper: get CMS content by key, falling back to defaultContent if no DB record exists
async function getOrCreateContent(key: string): Promise<any> {
  const content = await CMSContent.findOne({ key }).lean();
  if (content) return content;
  if (!defaultContent[key]) return null;
  // Return a synthetic default object without persisting — avoids the required `updatedBy` field
  return {
    key,
    value: defaultContent[key].value,
    type: defaultContent[key].type,
  };
}

// ========== CMS CONTENT ==========

// Get CMS content by key (public)
router.get(
  '/content/:key',
  cacheResponse('cms', 300),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { key } = req.params;

    const content = await getOrCreateContent(key);

    res.json({
      success: true,
      data: content || null,
    });
  })
);

// Get multiple CMS contents (public)
router.get(
  '/content',
  cacheResponse('cms', 300),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { keys } = req.query;

    if (!keys) {
      res.json({
        success: true,
        data: [],
      });
      return;
    }

    const keyList = (keys as string).split(',');

    // Fetch existing and create defaults for missing keys
    const results = await Promise.all(keyList.map((k) => getOrCreateContent(k.trim())));
    const result = results.reduce((acc: any, content) => {
      if (content) acc[content.key] = content;
      return acc;
    }, {});

    res.json({
      success: true,
      data: result,
    });
  })
);

// Update CMS content (admin)
router.put(
  '/content/:key',
  authenticate,
  requireSuperAdmin,
  validate(updateCMSContentSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { key } = req.params;
    const { value } = req.body;

    const content = await CMSContent.findOneAndUpdate(
      { key },
      {
        key,
        value,
        type: typeof value === 'object' ? 'json' : 'text',
        updatedBy: req.userId,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: content,
    });
  })
);

// ========== POLICY PAGES ==========

// Get policy page by slug (public)
router.get(
  '/policies/:slug',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { slug } = req.params;

    const page = await getOrCreatePolicy(slug);

    if (!page) {
      throw new NotFoundError('Page');
    }

    // Only return active pages to public
    if (!(page as any).isActive) {
      throw new NotFoundError('Page');
    }

    res.json({
      success: true,
      data: page,
    });
  })
);

// Get all policy pages (admin) - auto-seeds defaults if none exist
router.get(
  '/policies',
  authenticate,
  requireAdmin,
  requirePermission('cms', 'read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    let pages = await PolicyPage.find().sort({ slug: 1 }).lean();

    // Auto-seed all default policies if none exist
    if (pages.length === 0) {
      const slugs = Object.keys(defaultPolicies);
      for (const slug of slugs) {
        await getOrCreatePolicy(slug);
      }
      pages = await PolicyPage.find().sort({ slug: 1 }).lean();
    }

    res.json({
      success: true,
      data: pages,
    });
  })
);

// Update policy page (admin)
router.put(
  '/policies/:slug',
  authenticate,
  requireSuperAdmin,
  validate(updatePolicyPageSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { slug } = req.params;
    const data = req.body;

    const page = await PolicyPage.findOneAndUpdate(
      { slug },
      {
        ...data,
        slug,
        updatedBy: req.userId,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: page,
    });
  })
);

// ========== FAQs ==========

// Get FAQs (public)
router.get(
  '/faqs',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { categoryId } = req.query;

    const query: any = { isActive: true };
    if (categoryId) {
      query.categoryId = categoryId;
    }

    const faqs = await getOrCreateFaqs(query);

    res.json({
      success: true,
      data: faqs,
    });
  })
);

// Get FAQ by ID (admin)
router.get(
  '/faqs/:id',
  authenticate,
  requireAdmin,
  requirePermission('cms', 'read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid FAQ ID');
    }

    const faq = await FAQ.findById(id).lean();

    if (!faq) {
      throw new NotFoundError('FAQ');
    }

    res.json({
      success: true,
      data: faq,
    });
  })
);

// Create FAQ (admin)
router.post(
  '/faqs',
  authenticate,
  requireAdmin,
  requirePermission('cms', 'write'),
  validate(createFAQSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const faq = await FAQ.create(req.body);

    res.status(201).json({
      success: true,
      data: faq,
    });
  })
);

// Update FAQ (admin)
router.patch(
  '/faqs/:id',
  authenticate,
  requireAdmin,
  requirePermission('cms', 'write'),
  validate(updateFAQSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid FAQ ID');
    }

    const faq = await FAQ.findByIdAndUpdate(id, req.body, { new: true });

    if (!faq) {
      throw new NotFoundError('FAQ');
    }

    res.json({
      success: true,
      data: faq,
    });
  })
);

// Delete FAQ (admin)
router.delete(
  '/faqs/:id',
  authenticate,
  requireAdmin,
  requirePermission('cms', 'write'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid FAQ ID');
    }

    const faq = await FAQ.findByIdAndDelete(id);

    if (!faq) {
      throw new NotFoundError('FAQ');
    }

    res.json({
      success: true,
      message: 'FAQ deleted',
    });
  })
);

// ========== NEWSLETTER ==========

// Subscribe to newsletter (public)
router.post(
  '/newsletter/subscribe',
  validate(subscribeNewsletterSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email } = req.body;

    // Check if already subscribed
    const existing = await Newsletter.findOne({ email });

    if (existing) {
      if (existing.isActive) {
        res.json({
          success: true,
          message: 'Already subscribed',
        });
        return;
      }

      // Reactivate subscription
      existing.isActive = true;
      existing.subscribedAt = new Date();
      existing.unsubscribedAt = undefined;
      await existing.save();
    } else {
      await Newsletter.create({ email });
    }

    // Send confirmation email
    sendNewsletterConfirmation(email).catch(console.error);

    // Notify company
    notifyNewSubscriber(email).catch(console.error);

    res.json({
      success: true,
      message: 'Successfully subscribed',
    });
  })
);

// Unsubscribe from newsletter
router.post(
  '/newsletter/unsubscribe',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new BadRequestError('Email required');
    }

    await Newsletter.findOneAndUpdate(
      { email },
      { isActive: false, unsubscribedAt: new Date() }
    );

    res.json({
      success: true,
      message: 'Successfully unsubscribed',
    });
  })
);

// Get newsletter subscribers (admin)
router.get(
  '/newsletter/subscribers',
  authenticate,
  requireSuperAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 50, active } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};
    if (active === 'true') query.isActive = true;
    if (active === 'false') query.isActive = false;

    const [subscribers, total] = await Promise.all([
      Newsletter.find(query)
        .sort({ subscribedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Newsletter.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: subscribers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  })
);

// ========== CONTACT ==========

// Submit contact form (public)
router.post(
  '/contact',
  validate(createContactMessageSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, email, phone, subject, message } = req.body;

    // Save to database
    await ContactMessage.create({ name, email, phone, subject, message });

    // Forward to company email
    forwardContactMessage(name, email, phone, subject, message).catch(console.error);

    res.json({
      success: true,
      message: 'Message sent successfully',
    });
  })
);

// Get contact messages (admin)
router.get(
  '/contact/messages',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 20, status } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};
    if (status) query.status = status;

    const [messages, total] = await Promise.all([
      ContactMessage.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ContactMessage.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: messages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  })
);

// Update contact message status (admin)
router.patch(
  '/contact/messages/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, notes, assignedTo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid message ID');
    }

    const message = await ContactMessage.findByIdAndUpdate(
      id,
      { status, notes, assignedTo },
      { new: true }
    );

    if (!message) {
      throw new NotFoundError('Message');
    }

    res.json({
      success: true,
      data: message,
    });
  })
);

export default router;
