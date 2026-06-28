// ============================================
// PRIMO API - Real Product Catalog Seed Script
// Run with: npx tsx src/scripts/seed-real-products.ts
// ============================================

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Category } from '../models/Category';
import { Product } from '../models/Product';

const MONGO_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/primo';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeImg(url: string, alt: string, isPrimary = false, order = 0) {
  return { id: uuidv4(), url, alt, isPrimary, order };
}

function makeFaq(q: string, a: string, order = 0) {
  return { id: uuidv4(), question: q, answer: a, order };
}

function makeSpec(name: string, value: string, group?: string) {
  return { name, value, group };
}

// ─── Category Tree ────────────────────────────────────────────────────────────

const CATEGORY_TREE: Record<string, string[]> = {
  'Personal Care': ['Hair Brush', 'IPL Hair Removal'],
  'Hot Beverages': ['Coffee Machines', 'Electric Kettles', 'Turkish Coffee Makers'],
  'Accessories': ['Vacuum Cleaners'],
  'Steam Appliances': ['Steam Mops', 'Steam Shot Cleaners'],
  'Kitchen Appliances': [
    'Electric Grills',
    'Ice Cream Makers',
    'Sandwich Makers',
    'Frozen Drink Makers',
    'Luqaimat Makers',
    'Churros Makers',
  ],
  'Water Dispensers': ['Water Dispensers'],
  'Pressure Cookers': ['Electric Pressure Cookers'],
};

// ─── Product Definitions ──────────────────────────────────────────────────────

type ProductDef = {
  sku: string;
  title: string;
  brand: string;
  category: string;
  subcategory: string;
  description: string;
  shortDescription: string;
  specs: ReturnType<typeof makeSpec>[];
  warranty: string;
  price: number;
  compareAtPrice?: number;
  discount?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  images: ReturnType<typeof makeImg>[];
  tags: string[];
  faqs: ReturnType<typeof makeFaq>[];
  isFeatured: boolean;
  metaTitle: string;
  metaDescription: string;
  deliveryNotes?: string;
  installationNotes?: string;
};

const PRODUCTS: ProductDef[] = [
  // ── Row 1 ──────────────────────────────────────────────────────────────────
  {
    sku: 'JOY-FDD-02901',
    title: 'Joy Hair Styler 2-in-1 FDD-02901',
    brand: 'Joy',
    category: 'Personal Care',
    subcategory: 'Hair Brush',
    description:
      'The Joy FDD-02901 is a versatile 2-in-1 hair styler that combines straightening and curling in one compact device. With 1200W of power and ceramic-coated plates, it heats up quickly for salon-quality results at home. The lightweight design and ergonomic handle make it easy to use, while multiple heat settings accommodate all hair types from fine to coarse.',
    shortDescription: '2-in-1 hair straightener and curler with 1200W ceramic plates.',
    specs: [
      makeSpec('Power', '1200 W', 'Performance'),
      makeSpec('Model', 'FDD-02901', 'General'),
      makeSpec('Type', '2-in-1 (Straightener & Curler)', 'Features'),
      makeSpec('Plate Material', 'Ceramic Coated', 'Features'),
    ],
    warranty: '1 year manufacturer warranty',
    price: 0,
    stockQuantity: 25,
    lowStockThreshold: 5,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600',
        'Joy 2-in-1 Hair Styler FDD-02901',
        true,
        0
      ),
      makeImg(
        'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600',
        'Joy Hair Styler in use',
        false,
        1
      ),
    ],
    tags: ['hair styler', 'hair straightener', 'curler', 'joy', '2-in-1', 'personal care', 'fdd-02901'],
    faqs: [
      makeFaq(
        'Is the Joy FDD-02901 suitable for thick hair?',
        'Yes, the Joy FDD-02901 works well on all hair types including thick and coarse hair thanks to its adjustable heat settings.',
        0
      ),
      makeFaq(
        'Does it come with a heat-resistant pouch?',
        'Please check the package contents at the time of purchase, as accessories may vary.',
        1
      ),
    ],
    isFeatured: false,
    metaTitle: 'Joy 2-in-1 Hair Styler FDD-02901 | PRIMO',
    metaDescription:
      'Shop the Joy FDD-02901 2-in-1 hair styler — straighten and curl with a single device. Ceramic plates, 1200W, fast heat-up.',
    deliveryNotes: 'Ships within 1–3 business days.',
  },

  // ── Row 2 ──────────────────────────────────────────────────────────────────
  {
    sku: 'MLAY-T14-A',
    title: 'MLAY T14 IPL Hair Removal Device — 500,000 Flashes',
    brand: 'MLAY',
    category: 'Personal Care',
    subcategory: 'IPL Hair Removal',
    description:
      'The MLAY T14 is a professional-grade at-home IPL (Intense Pulsed Light) hair removal device offering up to 500,000 flashes. It includes 1 treatment lens and features multiple intensity levels to suit all skin tones. Ideal for use on legs, arms, underarms, bikini line, and face. The ergonomic design ensures precise targeting for long-lasting hair reduction from the comfort of your home.',
    shortDescription: 'At-home IPL hair removal with 500,000 flashes and 1 lens included.',
    specs: [
      makeSpec('Flash Lifespan', '500,000 flashes', 'Performance'),
      makeSpec('Model', 'T14', 'General'),
      makeSpec('Technology', 'IPL (Intense Pulsed Light)', 'Technology'),
      makeSpec('Included Lenses', '1', 'Package'),
      makeSpec('Treatment Areas', 'Full body', 'Coverage'),
    ],
    warranty: '1 year manufacturer warranty',
    price: 0,
    stockQuantity: 20,
    lowStockThreshold: 5,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600',
        'MLAY T14 IPL Hair Removal Device',
        true,
        0
      ),
      makeImg(
        'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=600',
        'IPL hair removal treatment',
        false,
        1
      ),
    ],
    tags: ['ipl', 'hair removal', 'mlay', 't14', 'laser', 'personal care', '500000 flashes'],
    faqs: [
      makeFaq(
        'How many sessions does the MLAY T14 require for visible results?',
        'Most users see visible hair reduction after 4–6 sessions of consistent weekly treatments.',
        0
      ),
      makeFaq(
        'Is the MLAY T14 safe for dark skin tones?',
        'The device is designed for a range of skin tones; however, always refer to the included skin tone chart and avoid use on very dark skin tones (Type VI). Consult the user manual before use.',
        1
      ),
      makeFaq(
        'Can the MLAY T14 be used on the face?',
        'Yes, it can be used on facial areas except around the eyes. Use the appropriate intensity setting for facial skin.',
        2
      ),
    ],
    isFeatured: false,
    metaTitle: 'MLAY T14 IPL Hair Removal Device 500,000 Flashes | PRIMO',
    metaDescription:
      'Long-lasting hair removal at home with the MLAY T14 IPL device — 500,000 flashes, full body coverage, 1 lens included.',
  },

  // ── Row 3 (second MLAY T14 variant — e.g. bundle or kit) ──────────────────
  {
    sku: 'MLAY-T14-B',
    title: 'MLAY T14 IPL Hair Removal Device — Advanced Kit',
    brand: 'MLAY',
    category: 'Personal Care',
    subcategory: 'IPL Hair Removal',
    description:
      'The MLAY T14 Advanced Kit expands on the standard T14 model with additional accessories for a more complete at-home hair removal experience. With 500,000 flash capacity and IPL technology, it delivers professional-level results across all body areas. The kit edition may include extra lens attachments and a protective case — please verify exact contents at checkout.',
    shortDescription: 'MLAY T14 IPL device — advanced kit edition with accessories.',
    specs: [
      makeSpec('Flash Lifespan', '500,000 flashes', 'Performance'),
      makeSpec('Model', 'T14 Advanced Kit', 'General'),
      makeSpec('Technology', 'IPL (Intense Pulsed Light)', 'Technology'),
      makeSpec('Treatment Areas', 'Full body', 'Coverage'),
    ],
    warranty: '1 year manufacturer warranty',
    price: 0,
    stockQuantity: 15,
    lowStockThreshold: 5,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600',
        'MLAY T14 IPL Device Advanced Kit',
        true,
        0
      ),
    ],
    tags: ['ipl', 'hair removal', 'mlay', 't14', 'kit', 'personal care'],
    faqs: [
      makeFaq(
        'What is the difference between MLAY T14 standard and the advanced kit?',
        'The advanced kit typically includes additional lens attachments or accessories. Confirm exact package contents on the product listing.',
        0
      ),
    ],
    isFeatured: false,
    metaTitle: 'MLAY T14 IPL Hair Removal Advanced Kit | PRIMO',
    metaDescription: 'Complete IPL hair removal kit by MLAY — T14 advanced edition with 500,000 flash capacity.',
  },

  // ── Row 5 ──────────────────────────────────────────────────────────────────
  {
    sku: 'DELONGHI-EC685',
    title: 'DeLonghi Dedica Espresso Machine EC 685',
    brand: 'DeLonghi',
    category: 'Hot Beverages',
    subcategory: 'Coffee Machines',
    description:
      "The DeLonghi Dedica EC 685 is a slim, compact espresso machine designed for the home barista who demands quality without sacrificing counter space. At just 15 cm wide, it fits easily in any kitchen while delivering 15-bar professional pressure for rich, full-bodied espresso. Compatible with both ground coffee and ESE pods, it features a manual milk frother for lattes and cappuccinos. The thermoblock heating system ensures your coffee is ready in under 40 seconds.",
    shortDescription: 'Compact 15-bar espresso machine with manual milk frother. 15 cm slim body.',
    specs: [
      makeSpec('Pump Pressure', '15 bar', 'Performance'),
      makeSpec('Model', 'EC 685', 'General'),
      makeSpec('Width', '15 cm', 'Dimensions'),
      makeSpec('Heating System', 'Thermoblock', 'Technology'),
      makeSpec('Compatibility', 'Ground coffee & ESE pods', 'Features'),
      makeSpec('Milk Frother', 'Manual steam wand', 'Features'),
    ],
    warranty: '2 years manufacturer warranty',
    price: 0,
    stockQuantity: 20,
    lowStockThreshold: 5,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1459755486867-b55449bb39ff?w=600',
        'DeLonghi Dedica EC 685 Espresso Machine',
        true,
        0
      ),
      makeImg(
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600',
        'Espresso being pulled',
        false,
        1
      ),
    ],
    tags: ['delonghi', 'espresso', 'coffee machine', 'dedica', 'ec685', 'hot beverages', 'cappuccino', 'latte'],
    faqs: [
      makeFaq(
        'Does the DeLonghi EC 685 work with Nespresso pods?',
        'No, the EC 685 is not compatible with Nespresso pods. It works with ground coffee and ESE (Easy Serve Espresso) pods.',
        0
      ),
      makeFaq(
        'How long does it take to heat up?',
        'The DeLonghi EC 685 heats up in under 40 seconds thanks to its thermoblock heating system.',
        1
      ),
      makeFaq(
        'Can I make cappuccino with the EC 685?',
        "Yes, the EC 685 includes a manual milk frother steam wand, allowing you to froth milk for cappuccinos and lattes.",
        2
      ),
    ],
    isFeatured: true,
    metaTitle: 'DeLonghi Dedica EC 685 Espresso Machine | PRIMO',
    metaDescription:
      'The DeLonghi Dedica EC 685 is a slim 15-bar espresso machine with manual milk frother. Perfect for home espresso, latte, and cappuccino.',
  },

  // ── Row 6 ──────────────────────────────────────────────────────────────────
  {
    sku: 'BRAUN-WK5110BK',
    title: 'Braun Electric Kettle WK 5110 BK',
    brand: 'Braun',
    category: 'Hot Beverages',
    subcategory: 'Electric Kettles',
    description:
      'The Braun WK 5110 BK electric kettle combines sleek European design with practical performance. Featuring rapid boil technology, a 1.7 L capacity, and a 360° cordless base, it brings water to a boil in minutes. The cool-touch handle and concealed heating element ensure safe and easy handling, while the auto-shutoff with boil-dry protection provides reliable everyday use.',
    shortDescription: '1.7L rapid-boil electric kettle with 360° cordless base and auto-shutoff.',
    specs: [
      makeSpec('Capacity', '1.7 L', 'Performance'),
      makeSpec('Model', 'WK 5110 BK', 'General'),
      makeSpec('Color', 'Black', 'Design'),
      makeSpec('Base', '360° cordless', 'Features'),
      makeSpec('Safety', 'Auto-shutoff, boil-dry protection', 'Safety'),
    ],
    warranty: '2 years manufacturer warranty',
    price: 0,
    stockQuantity: 30,
    lowStockThreshold: 5,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1594818379496-da1e345b0ded?w=600',
        'Braun Electric Kettle WK 5110 BK',
        true,
        0
      ),
      makeImg(
        'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=600',
        'Electric kettle boiling water',
        false,
        1
      ),
    ],
    tags: ['braun', 'kettle', 'electric kettle', 'wk5110', 'hot beverages', 'rapid boil'],
    faqs: [
      makeFaq(
        'What is the wattage of the Braun WK 5110 BK?',
        'The Braun WK 5110 BK typically operates at 2200W for fast boiling. Please refer to the product label for your region-specific specifications.',
        0
      ),
      makeFaq(
        'Is the kettle BPA-free?',
        'Yes, the Braun WK 5110 BK is made with BPA-free materials for safe everyday use.',
        1
      ),
    ],
    isFeatured: false,
    metaTitle: 'Braun Electric Kettle WK 5110 BK | PRIMO',
    metaDescription:
      'Braun WK 5110 BK — 1.7L rapid-boil electric kettle with 360° cordless base, auto-shutoff, and sleek black design.',
  },

  // ── Row 7 ──────────────────────────────────────────────────────────────────
  {
    sku: 'KENWOOD-ZJG08000CL',
    title: 'Kenwood Glass Electric Kettle ZJG08.000CL',
    brand: 'Kenwood',
    category: 'Hot Beverages',
    subcategory: 'Electric Kettles',
    description:
      'The Kenwood ZJG08.000CL Glass Electric Kettle features a transparent borosilicate glass body that lets you watch the water as it boils. With a 1.6 L capacity and illuminated water level window, it combines aesthetics with practicality. The cordless 360° base, easy-grip handle, and auto-shutoff with boil-dry protection make it a safe and convenient addition to any kitchen.',
    shortDescription: 'Borosilicate glass electric kettle, 1.6L, cordless 360° base, LED illumination.',
    specs: [
      makeSpec('Capacity', '1.6 L', 'Performance'),
      makeSpec('Model', 'ZJG08.000CL', 'General'),
      makeSpec('Material', 'Borosilicate Glass', 'Design'),
      makeSpec('Base', '360° cordless', 'Features'),
      makeSpec('Safety', 'Auto-shutoff, boil-dry protection', 'Safety'),
    ],
    warranty: '2 years manufacturer warranty',
    price: 0,
    stockQuantity: 25,
    lowStockThreshold: 5,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=600',
        'Kenwood Glass Electric Kettle ZJG08.000CL',
        true,
        0
      ),
    ],
    tags: ['kenwood', 'glass kettle', 'electric kettle', 'zjg08', 'hot beverages', 'borosilicate'],
    faqs: [
      makeFaq(
        'Is the Kenwood ZJG08 glass kettle safe to use?',
        'Yes, it features boil-dry protection and auto-shutoff for safe everyday use.',
        0
      ),
    ],
    isFeatured: false,
    metaTitle: 'Kenwood Glass Electric Kettle ZJG08.000CL | PRIMO',
    metaDescription:
      'Kenwood ZJG08.000CL glass electric kettle — transparent borosilicate glass body, 1.6L, LED-illuminated, 360° cordless base.',
  },

  // ── Row 8 ──────────────────────────────────────────────────────────────────
  {
    sku: 'KENWOOD-ZJM01AOBK',
    title: 'Kenwood Electric Kettle ZJM01.AOBK',
    brand: 'Kenwood',
    category: 'Hot Beverages',
    subcategory: 'Electric Kettles',
    description:
      'The Kenwood ZJM01.AOBK is a classic stainless-steel electric kettle built for everyday reliability. It boasts a generous capacity and cordless 360° base for ease of use. An auto-shutoff feature activates when the water reaches boiling point, and the boil-dry protection prevents damage if switched on without water. Its matte black finish blends seamlessly with modern kitchen décor.',
    shortDescription: 'Stainless-steel electric kettle with matte black finish, 360° base, auto-shutoff.',
    specs: [
      makeSpec('Model', 'ZJM01.AOBK', 'General'),
      makeSpec('Material', 'Stainless Steel', 'Design'),
      makeSpec('Color', 'Matte Black', 'Design'),
      makeSpec('Base', '360° cordless', 'Features'),
      makeSpec('Safety', 'Auto-shutoff, boil-dry protection', 'Safety'),
    ],
    warranty: '2 years manufacturer warranty',
    price: 0,
    stockQuantity: 25,
    lowStockThreshold: 5,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1594818379496-da1e345b0ded?w=600',
        'Kenwood Electric Kettle ZJM01.AOBK',
        true,
        0
      ),
    ],
    tags: ['kenwood', 'electric kettle', 'zjm01', 'matte black', 'stainless steel', 'hot beverages'],
    faqs: [
      makeFaq(
        'What capacity does the Kenwood ZJM01.AOBK have?',
        'Please refer to the product label, as capacity may vary by market. Typically this model offers 1.5–1.7L capacity.',
        0
      ),
    ],
    isFeatured: false,
    metaTitle: 'Kenwood Electric Kettle ZJM01.AOBK | PRIMO',
    metaDescription:
      'Kenwood ZJM01.AOBK electric kettle — matte black stainless steel, 360° cordless base, auto-shutoff and boil-dry protection.',
  },

  // ── Row 9 ──────────────────────────────────────────────────────────────────
  {
    sku: 'ARZUM-OK008WFU',
    title: 'Arzum OKKA Turkish Coffee Machine OK008-WFU',
    brand: 'Arzum',
    category: 'Hot Beverages',
    subcategory: 'Turkish Coffee Makers',
    description:
      'The Arzum OKKA OK008-WFU is a fully automatic Turkish coffee maker that brews authentic Turkish coffee at the touch of a button. It uses a patented brewing technology to produce rich, foamy Turkish coffee — complete with the signature head of foam — without manual stirring or monitoring. The machine accommodates up to 2 cups per brew and features a permanent filter, auto-shutoff, and an elegant white and gold finish.',
    shortDescription: 'Automatic Turkish coffee maker, 2 cups, patented foam technology. White & gold finish.',
    specs: [
      makeSpec('Model', 'OK008-WFU', 'General'),
      makeSpec('Color', 'White / Gold', 'Design'),
      makeSpec('Cups per Brew', '1–2', 'Performance'),
      makeSpec('Technology', 'Patented automatic foam brewing', 'Technology'),
      makeSpec('Filter', 'Permanent', 'Features'),
    ],
    warranty: '2 years manufacturer warranty',
    price: 0,
    stockQuantity: 20,
    lowStockThreshold: 5,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600',
        'Arzum OKKA Turkish Coffee Machine OK008-WFU',
        true,
        0
      ),
      makeImg(
        'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=600',
        'Turkish coffee being brewed',
        false,
        1
      ),
    ],
    tags: ['arzum', 'okka', 'turkish coffee', 'ok008', 'coffee machine', 'hot beverages', 'automatic'],
    faqs: [
      makeFaq(
        'Does the Arzum OKKA require pre-ground Turkish coffee?',
        'Yes, the Arzum OKKA uses finely ground Turkish coffee. It is not compatible with espresso capsules or standard drip coffee.',
        0
      ),
      makeFaq(
        'How many cups can it brew at once?',
        'The OK008-WFU brews 1 to 2 cups per cycle.',
        1
      ),
    ],
    isFeatured: false,
    metaTitle: 'Arzum OKKA Turkish Coffee Machine OK008-WFU | PRIMO',
    metaDescription:
      'Brew authentic Turkish coffee at home with the Arzum OKKA OK008-WFU — automatic foam technology, 2 cups, elegant white and gold design.',
  },

  // ── Row 10 ─────────────────────────────────────────────────────────────────
  {
    sku: 'ARZUM-OKKA-MINI',
    title: 'Arzum OKKA Mini Jet Turkish Coffee Machine',
    brand: 'Arzum',
    category: 'Hot Beverages',
    subcategory: 'Turkish Coffee Makers',
    description:
      'The Arzum OKKA Mini Jet is the compact version of the popular OKKA range, designed for single-serve Turkish coffee lovers with limited counter space. It delivers the same authentic, foamy Turkish coffee experience in a smaller, travel-friendly form factor. Perfect for small kitchens, offices, or gifting.',
    shortDescription: 'Compact single-serve Turkish coffee maker — mini version of the OKKA range.',
    specs: [
      makeSpec('Model', 'OKKA Mini Jet', 'General'),
      makeSpec('Serving', 'Single cup', 'Performance'),
      makeSpec('Technology', 'Automatic foam brewing', 'Technology'),
    ],
    warranty: '2 years manufacturer warranty',
    price: 0,
    stockQuantity: 20,
    lowStockThreshold: 5,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600',
        'Arzum OKKA Mini Jet Turkish Coffee Machine',
        true,
        0
      ),
    ],
    tags: ['arzum', 'okka', 'mini', 'turkish coffee', 'single serve', 'hot beverages', 'compact'],
    faqs: [
      makeFaq(
        'Is the OKKA Mini Jet suitable for travel?',
        'The OKKA Mini Jet is compact and lightweight, making it ideal for small spaces and offices. For international travel, ensure voltage compatibility.',
        0
      ),
    ],
    isFeatured: false,
    metaTitle: 'Arzum OKKA Mini Jet Turkish Coffee Machine | PRIMO',
    metaDescription:
      'The Arzum OKKA Mini Jet brews authentic foamy Turkish coffee in a compact single-serve design. Ideal for small kitchens and offices.',
  },

  // ── Row 11 ─────────────────────────────────────────────────────────────────
  {
    sku: 'ARZUM-OK0026',
    title: 'Arzum OKKA Rich Pro Turkish Coffee Machine OK0026',
    brand: 'Arzum',
    category: 'Hot Beverages',
    subcategory: 'Turkish Coffee Makers',
    description:
      'The Arzum OKKA Rich Pro OK0026 is a premium Turkish coffee machine engineered for coffee enthusiasts who demand consistently perfect results. Its advanced brew control maintains ideal water temperature throughout the brewing cycle, producing a rich crema-topped Turkish coffee every time. The model features a stainless steel heating plate, digital controls, and a sleek contemporary design.',
    shortDescription: 'Premium Turkish coffee machine with advanced brew control and stainless steel heating plate.',
    specs: [
      makeSpec('Model', 'OK0026', 'General'),
      makeSpec('Series', 'Rich Pro', 'General'),
      makeSpec('Controls', 'Digital', 'Features'),
      makeSpec('Heating Plate', 'Stainless Steel', 'Features'),
    ],
    warranty: '2 years manufacturer warranty',
    price: 0,
    stockQuantity: 15,
    lowStockThreshold: 5,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600',
        'Arzum OKKA Rich Pro OK0026',
        true,
        0
      ),
    ],
    tags: ['arzum', 'okka', 'rich pro', 'ok0026', 'turkish coffee', 'premium', 'hot beverages'],
    faqs: [
      makeFaq(
        'What makes the Rich Pro different from the standard OKKA?',
        'The Rich Pro OK0026 offers enhanced brew temperature control and a stainless steel heating plate for more consistent coffee quality.',
        0
      ),
    ],
    isFeatured: false,
    metaTitle: 'Arzum OKKA Rich Pro OK0026 Turkish Coffee Machine | PRIMO',
    metaDescription:
      'Brew premium Turkish coffee with the Arzum OKKA Rich Pro OK0026 — advanced brew control, digital display, stainless steel heating plate.',
  },

  // ── Row 12 ─────────────────────────────────────────────────────────────────
  {
    sku: 'ARZUM-OK0038',
    title: 'Arzum OKKA Rich Pro Plus Turkish Coffee Machine OK0038',
    brand: 'Arzum',
    category: 'Hot Beverages',
    subcategory: 'Turkish Coffee Makers',
    description:
      'The Arzum OKKA Rich Pro Plus OK0038 is the enhanced flagship of the Rich Pro series. It builds on the OK0026 with additional capacity or enhanced smart brewing features, delivering authentic Turkish coffee with a rich foam layer. Perfect for households that brew multiple cups throughout the day.',
    shortDescription: 'Flagship Turkish coffee machine — Rich Pro Plus with enhanced capacity and smart brewing.',
    specs: [
      makeSpec('Model', 'OK0038', 'General'),
      makeSpec('Series', 'Rich Pro Plus', 'General'),
      makeSpec('Technology', 'Smart automatic brewing', 'Technology'),
    ],
    warranty: '2 years manufacturer warranty',
    price: 0,
    stockQuantity: 15,
    lowStockThreshold: 5,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600',
        'Arzum OKKA Rich Pro Plus OK0038',
        true,
        0
      ),
    ],
    tags: ['arzum', 'okka', 'rich pro plus', 'ok0038', 'turkish coffee', 'flagship', 'hot beverages'],
    faqs: [
      makeFaq(
        'How does the Rich Pro Plus differ from the Rich Pro?',
        'The OK0038 Rich Pro Plus typically offers an upgraded brewing program and enhanced capacity compared to the OK0026.',
        0
      ),
    ],
    isFeatured: false,
    metaTitle: 'Arzum OKKA Rich Pro Plus OK0038 Turkish Coffee Machine | PRIMO',
    metaDescription:
      'The Arzum OKKA Rich Pro Plus OK0038 — flagship Turkish coffee maker with smart brewing and enhanced capacity for daily use.',
  },

  // ── Row 13 ─────────────────────────────────────────────────────────────────
  {
    sku: 'ARZUM-OK0032',
    title: 'Arzum OKKA Solo Me Turkish Coffee Machine OK0032',
    brand: 'Arzum',
    category: 'Hot Beverages',
    subcategory: 'Turkish Coffee Makers',
    description:
      'The Arzum OKKA Solo Me OK0032 is a single-serve personal Turkish coffee machine designed for the solo coffee drinker. Compact and fast, it brews one perfect cup of Turkish coffee with authentic foam in minutes. Its minimalist form and user-friendly operation make it ideal for those who want a quick, quality brew without complexity.',
    shortDescription: 'Personal single-serve Turkish coffee machine — compact and fast.',
    specs: [
      makeSpec('Model', 'OK0032', 'General'),
      makeSpec('Series', 'Solo Me', 'General'),
      makeSpec('Serving', 'Single cup', 'Performance'),
    ],
    warranty: '2 years manufacturer warranty',
    price: 0,
    stockQuantity: 20,
    lowStockThreshold: 5,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600',
        'Arzum OKKA Solo Me OK0032',
        true,
        0
      ),
    ],
    tags: ['arzum', 'okka', 'solo me', 'ok0032', 'turkish coffee', 'single serve', 'hot beverages'],
    faqs: [
      makeFaq(
        'Is the OKKA Solo Me suitable as a gift?',
        'Yes, the Solo Me is a popular gifting choice for coffee lovers due to its compact size and elegant design.',
        0
      ),
    ],
    isFeatured: false,
    metaTitle: 'Arzum OKKA Solo Me OK0032 Turkish Coffee Machine | PRIMO',
    metaDescription:
      'The Arzum OKKA Solo Me OK0032 brews a perfect single cup of Turkish coffee with rich foam — compact, personal, and effortless.',
  },

  // ── Row 14 ─────────────────────────────────────────────────────────────────
  {
    sku: 'ARZUM-ESPRESSO-SOLO',
    title: 'Arzum OKKA Espresso Solo Coffee Machine',
    brand: 'Arzum',
    category: 'Hot Beverages',
    subcategory: 'Coffee Machines',
    description:
      'The Arzum OKKA Espresso Solo bridges the gap between Turkish and Italian coffee traditions. This single-serve espresso machine delivers concentrated, full-bodied espresso shots with a rich crema. Compact in size and simple in operation, it is an excellent choice for espresso lovers who want quality without a large machine footprint.',
    shortDescription: 'Single-serve espresso coffee machine by Arzum OKKA — compact and powerful.',
    specs: [
      makeSpec('Model', 'Espresso Solo', 'General'),
      makeSpec('Type', 'Espresso machine', 'General'),
      makeSpec('Serving', 'Single shot / Double shot', 'Performance'),
    ],
    warranty: '2 years manufacturer warranty',
    price: 0,
    stockQuantity: 15,
    lowStockThreshold: 5,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1459755486867-b55449bb39ff?w=600',
        'Arzum OKKA Espresso Solo Coffee Machine',
        true,
        0
      ),
    ],
    tags: ['arzum', 'okka', 'espresso', 'solo', 'coffee machine', 'hot beverages', 'single serve'],
    faqs: [
      makeFaq(
        'What type of coffee does the Arzum Espresso Solo use?',
        'The Espresso Solo is compatible with finely ground espresso coffee. Check the product manual for pod compatibility.',
        0
      ),
    ],
    isFeatured: false,
    metaTitle: 'Arzum OKKA Espresso Solo Coffee Machine | PRIMO',
    metaDescription:
      'Brew rich espresso at home with the Arzum OKKA Espresso Solo — compact single-serve design with full-bodied crema.',
  },

  // ── Row 15 ─────────────────────────────────────────────────────────────────
  {
    sku: 'BISSELL-PARTS-KIT',
    title: 'Bissell Vacuum Cleaner Replacement Parts Kit',
    brand: 'Bissell',
    category: 'Accessories',
    subcategory: 'Vacuum Cleaners',
    description:
      'Keep your Bissell vacuum cleaner performing at its best with this genuine replacement parts kit. The kit includes essential maintenance components such as filters, belts, and brushes designed to fit compatible Bissell models. Regular replacement of these parts ensures optimal suction power and extends the life of your vacuum. Please verify compatibility with your specific Bissell model before purchasing.',
    shortDescription: 'Genuine Bissell replacement parts kit — filters, belts, and brushes for compatible models.',
    specs: [
      makeSpec('Brand Compatibility', 'Bissell', 'Compatibility'),
      makeSpec('Typical Contents', 'Filters, Belts, Brushes', 'Package'),
    ],
    warranty: '6 months on parts',
    price: 0,
    stockQuantity: 40,
    lowStockThreshold: 10,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600',
        'Bissell Vacuum Replacement Parts',
        true,
        0
      ),
    ],
    tags: ['bissell', 'vacuum', 'replacement parts', 'accessories', 'filters', 'brushes'],
    faqs: [
      makeFaq(
        'Which Bissell models is this kit compatible with?',
        'Please check the product listing for the full compatibility list. When in doubt, contact our support team with your Bissell model number.',
        0
      ),
    ],
    isFeatured: false,
    metaTitle: 'Bissell Vacuum Replacement Parts Kit | PRIMO',
    metaDescription:
      'Genuine Bissell vacuum replacement parts kit — includes filters, belts, and brushes to restore full performance to your Bissell vacuum.',
  },

  // ── Row 16 ─────────────────────────────────────────────────────────────────
  {
    sku: 'KARCHER-SC3EF',
    title: 'Kärcher SC3 EasyFix Steam Cleaner',
    brand: 'Kärcher',
    category: 'Steam Appliances',
    subcategory: 'Steam Mops',
    description:
      'The Kärcher SC3 EasyFix is a versatile steam cleaner that uses the power of steam to sanitize and deep-clean hard floors and surfaces without chemicals. The EasyFix floor nozzle allows microfibre pads to be changed quickly and hygienically — without touching them. With a 1000 ml water tank and continuous steam output, it is ideal for cleaning tiles, hardwood, laminate, and household surfaces.',
    shortDescription: '1000ml steam cleaner with EasyFix no-touch pad change. Sanitizes without chemicals.',
    specs: [
      makeSpec('Model', 'SC3 EasyFix', 'General'),
      makeSpec('Water Tank', '1000 ml', 'Performance'),
      makeSpec('Steam Type', 'Continuous', 'Performance'),
      makeSpec('Chemical-Free', 'Yes', 'Features'),
      makeSpec('Pad Change', 'EasyFix (no-touch)', 'Features'),
    ],
    warranty: '2 years manufacturer warranty',
    price: 0,
    stockQuantity: 20,
    lowStockThreshold: 5,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600',
        'Kärcher SC3 EasyFix Steam Cleaner',
        true,
        0
      ),
    ],
    tags: ['karcher', 'steam cleaner', 'sc3', 'easyfix', 'steam mop', 'floor cleaner', 'chemical-free'],
    faqs: [
      makeFaq(
        'Can the Kärcher SC3 be used on hardwood floors?',
        'Yes, the SC3 EasyFix is safe for sealed hardwood, laminate, and tile floors. Avoid using on unsealed or waxed wood.',
        0
      ),
      makeFaq(
        'Does the SC3 require special cleaning chemicals?',
        'No, the Kärcher SC3 EasyFix uses only water to produce steam, making it a 100% chemical-free cleaning solution.',
        1
      ),
    ],
    isFeatured: false,
    metaTitle: 'Kärcher SC3 EasyFix Steam Cleaner | PRIMO',
    metaDescription:
      'Deep-clean and sanitize your floors with the Kärcher SC3 EasyFix steam cleaner — 1000ml tank, continuous steam, no chemicals needed.',
  },

  // ── Row 17 ─────────────────────────────────────────────────────────────────
  {
    sku: 'BISSELL-39N7V',
    title: 'Bissell SteamShot Steam Cleaner 39N7V',
    brand: 'Bissell',
    category: 'Steam Appliances',
    subcategory: 'Steam Shot Cleaners',
    description:
      'The Bissell SteamShot 39N7V is a handheld steam cleaner that provides focused, powerful steam for cleaning and sanitizing small areas, grout, appliances, and upholstery. It heats up in about 30 seconds and comes with a range of attachments for versatile cleaning. No chemicals are required — steam alone kills 99.9% of germs and bacteria on hard surfaces.',
    shortDescription: 'Handheld steam cleaner with 30-second heat-up. Kills 99.9% of germs, no chemicals.',
    specs: [
      makeSpec('Model', '39N7V', 'General'),
      makeSpec('Type', 'Handheld steam cleaner', 'General'),
      makeSpec('Heat-Up Time', '~30 seconds', 'Performance'),
      makeSpec('Germ Kill', '99.9% on hard surfaces', 'Performance'),
      makeSpec('Chemical-Free', 'Yes', 'Features'),
    ],
    warranty: '1 year manufacturer warranty',
    price: 0,
    stockQuantity: 25,
    lowStockThreshold: 5,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600',
        'Bissell SteamShot 39N7V',
        true,
        0
      ),
    ],
    tags: ['bissell', 'steamshot', '39n7v', 'steam cleaner', 'handheld', 'steam shot', 'sanitizer'],
    faqs: [
      makeFaq(
        'What surfaces can the Bissell SteamShot clean?',
        'The SteamShot 39N7V is suitable for grout, tile, countertops, stovetops, bathroom fixtures, and upholstery.',
        0
      ),
      makeFaq(
        'What attachments come in the box?',
        'The SteamShot 39N7V typically includes a nozzle, flat scraper, grout brush, and angled concentrator. Exact contents may vary.',
        1
      ),
    ],
    isFeatured: false,
    metaTitle: 'Bissell SteamShot 39N7V Handheld Steam Cleaner | PRIMO',
    metaDescription:
      'The Bissell SteamShot 39N7V handheld steam cleaner heats up in 30 seconds and kills 99.9% of germs on hard surfaces — no chemicals needed.',
  },

  // ── Row 18 ─────────────────────────────────────────────────────────────────
  {
    sku: 'BNDECKER-BHSM1',
    title: 'Black+Decker Steam Mop BHSM1',
    brand: 'Black+Decker',
    category: 'Steam Appliances',
    subcategory: 'Steam Mops',
    description:
      'The Black+Decker BHSM1 Steam Mop effortlessly cleans and sanitizes sealed hard floors using only the power of steam. It heats up quickly and generates continuous steam through a washable microfibre pad that traps and removes dirt, grime, and bacteria without any detergents. Lightweight and easy to maneuver, it is ideal for daily floor maintenance across tiles, laminate, and sealed hardwood.',
    shortDescription: 'Lightweight steam mop with washable microfibre pad — chemical-free floor cleaning.',
    specs: [
      makeSpec('Model', 'BHSM1', 'General'),
      makeSpec('Steam Type', 'Continuous', 'Performance'),
      makeSpec('Pad', 'Washable microfibre', 'Features'),
      makeSpec('Chemical-Free', 'Yes', 'Features'),
    ],
    warranty: '2 years manufacturer warranty',
    price: 0,
    stockQuantity: 25,
    lowStockThreshold: 5,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600',
        'Black+Decker Steam Mop BHSM1',
        true,
        0
      ),
    ],
    tags: ['black+decker', 'steam mop', 'bhsm1', 'floor cleaner', 'steam appliances', 'microfibre'],
    faqs: [
      makeFaq(
        'Is the BHSM1 pad machine washable?',
        'Yes, the microfibre pad is machine washable for repeated use.',
        0
      ),
    ],
    isFeatured: false,
    metaTitle: 'Black+Decker Steam Mop BHSM1 | PRIMO',
    metaDescription:
      'The Black+Decker BHSM1 steam mop cleans and sanitizes sealed hard floors with steam alone — no chemicals, washable microfibre pad.',
  },

  // ── Row 19 ─────────────────────────────────────────────────────────────────
  {
    sku: 'KENWOOD-GRILL-ELEC',
    title: 'Kenwood Electric Grill',
    brand: 'Kenwood',
    category: 'Kitchen Appliances',
    subcategory: 'Electric Grills',
    description:
      'The Kenwood Electric Grill delivers versatile indoor grilling for meats, vegetables, and sandwiches without the need for an outdoor setup. Non-stick grill plates distribute heat evenly for perfectly grilled results every time. Adjustable temperature control and drip tray for easy cleanup make this an ideal everyday kitchen companion.',
    shortDescription: 'Versatile indoor electric grill with non-stick plates and adjustable temperature.',
    specs: [
      makeSpec('Brand', 'Kenwood', 'General'),
      makeSpec('Type', 'Electric contact grill', 'General'),
      makeSpec('Plates', 'Non-stick', 'Features'),
      makeSpec('Drip Tray', 'Included', 'Features'),
    ],
    warranty: '2 years manufacturer warranty',
    price: 0,
    stockQuantity: 20,
    lowStockThreshold: 5,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
        'Kenwood Electric Grill',
        true,
        0
      ),
    ],
    tags: ['kenwood', 'electric grill', 'indoor grill', 'kitchen appliances', 'non-stick'],
    faqs: [
      makeFaq(
        'Can the Kenwood grill plates be removed for cleaning?',
        'Many Kenwood grill models feature removable plates for easy dishwasher cleaning. Please confirm with the specific model listing.',
        0
      ),
    ],
    isFeatured: false,
    metaTitle: 'Kenwood Electric Grill | PRIMO',
    metaDescription:
      'Grill indoors with the Kenwood Electric Grill — non-stick plates, adjustable temperature, easy drip tray cleanup.',
  },

  // ── Row 20 ─────────────────────────────────────────────────────────────────
  {
    sku: 'ARZUM-AR2092',
    title: 'Arzum Griletto Pro Electric Grill AR2092',
    brand: 'Arzum',
    category: 'Kitchen Appliances',
    subcategory: 'Electric Grills',
    description:
      'The Arzum Griletto Pro AR2092 is a powerful electric contact grill built for grilling and panini pressing. Its deep-ribbed non-stick plates create authentic grill marks while locking in juices and flavor. The floating hinge adjusts to food thickness for even pressure, and the included drip tray catches excess fat for healthier cooking. Compact enough for daily use, yet powerful enough for entertaining.',
    shortDescription: 'Electric contact grill with deep-ribbed non-stick plates, floating hinge, and drip tray.',
    specs: [
      makeSpec('Model', 'AR2092', 'General'),
      makeSpec('Series', 'Griletto Pro', 'General'),
      makeSpec('Plates', 'Deep-ribbed non-stick', 'Features'),
      makeSpec('Hinge', 'Floating (adjustable thickness)', 'Features'),
      makeSpec('Drip Tray', 'Included', 'Features'),
    ],
    warranty: '2 years manufacturer warranty',
    price: 0,
    stockQuantity: 20,
    lowStockThreshold: 5,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
        'Arzum Griletto Pro AR2092 Electric Grill',
        true,
        0
      ),
    ],
    tags: ['arzum', 'griletto pro', 'ar2092', 'electric grill', 'panini', 'kitchen appliances', 'non-stick'],
    faqs: [
      makeFaq(
        'Can the Arzum Griletto Pro AR2092 grill chicken breasts?',
        'Yes, the floating hinge accommodates various food thicknesses including chicken breasts, burgers, and vegetables.',
        0
      ),
      makeFaq(
        'Are the grill plates dishwasher safe?',
        'Please refer to the product manual. Some Arzum models have removable dishwasher-safe plates.',
        1
      ),
    ],
    isFeatured: false,
    metaTitle: 'Arzum Griletto Pro AR2092 Electric Grill | PRIMO',
    metaDescription:
      'The Arzum Griletto Pro AR2092 delivers restaurant-quality grilling at home — deep-ribbed non-stick plates, floating hinge, healthier fat-draining design.',
  },

  // ── Row 21 ─────────────────────────────────────────────────────────────────
  {
    sku: 'NINJA-CREAMI-DELUXE',
    title: 'Ninja CREAMi Deluxe 10-in-1 Ice Cream Maker',
    brand: 'Ninja',
    category: 'Kitchen Appliances',
    subcategory: 'Ice Cream Makers',
    description:
      'The Ninja CREAMi Deluxe is a professional-grade at-home ice cream maker that transforms frozen ingredients into creamy ice cream, gelato, sorbet, smoothie bowls, and more — at the push of a button. With 10 one-touch programs and XL pint capacity, it gives you full control over ingredients and flavors. Perfect for customized, diet-friendly frozen treats including high-protein, low-sugar, or dairy-free options.',
    shortDescription: '10-in-1 ice cream maker — creates ice cream, gelato, sorbet, and more from frozen ingredients.',
    specs: [
      makeSpec('Model', 'CREAMi Deluxe', 'General'),
      makeSpec('Programs', '10 one-touch programs', 'Features'),
      makeSpec('Capacity', 'XL Pint (720 ml)', 'Performance'),
      makeSpec('Functions', 'Ice cream, gelato, sorbet, milkshake, smoothie bowl, and more', 'Features'),
    ],
    warranty: '1 year manufacturer warranty',
    price: 0,
    stockQuantity: 15,
    lowStockThreshold: 5,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600',
        'Ninja CREAMi Deluxe Ice Cream Maker',
        true,
        0
      ),
      makeImg(
        'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600',
        'Ice cream made with Ninja CREAMi',
        false,
        1
      ),
    ],
    tags: ['ninja', 'creami', 'ice cream maker', 'gelato', 'sorbet', 'kitchen appliances', '10-in-1'],
    faqs: [
      makeFaq(
        'Do I need to pre-freeze the ingredients before using the Ninja CREAMi?',
        'Yes, ingredients must be pre-frozen in the included pint container for at least 24 hours before processing.',
        0
      ),
      makeFaq(
        'Can I make dairy-free ice cream with the Ninja CREAMi Deluxe?',
        'Yes, the CREAMi works with any frozen base including coconut milk, oat milk, or fruit puree for dairy-free frozen treats.',
        1
      ),
      makeFaq(
        'How loud is the Ninja CREAMi Deluxe during operation?',
        'The CREAMi is moderately loud during processing, similar to a blender. Processing takes about 2–3 minutes per pint.',
        2
      ),
    ],
    isFeatured: true,
    metaTitle: 'Ninja CREAMi Deluxe 10-in-1 Ice Cream Maker | PRIMO',
    metaDescription:
      'Make custom ice cream, gelato, sorbet, and more with the Ninja CREAMi Deluxe — 10 programs, XL pint capacity, full ingredient control.',
  },

  // ── Row 22 ─────────────────────────────────────────────────────────────────
  {
    sku: 'ALSAIF-E05331',
    title: 'Al Saif Sandwich Maker E05331',
    brand: 'Al Saif',
    category: 'Kitchen Appliances',
    subcategory: 'Sandwich Makers',
    description:
      'The Al Saif E05331 Sandwich Maker delivers perfectly pressed, evenly toasted sandwiches every time. Non-stick triangle plates seal and crimp sandwich edges for mess-free results while locking in fillings. The compact and lightweight design makes it ideal for quick breakfasts, snacks, and light meals. Non-stick coating ensures easy food release and effortless cleaning.',
    shortDescription: 'Triangle sandwich maker with non-stick plates — quick toasting, easy cleanup.',
    specs: [
      makeSpec('Model', 'E05331', 'General'),
      makeSpec('Plates', 'Non-stick triangle', 'Features'),
      makeSpec('Type', 'Sandwich / Toasty maker', 'General'),
    ],
    warranty: '1 year manufacturer warranty',
    price: 0,
    stockQuantity: 30,
    lowStockThreshold: 8,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1603567941648-52e1d17b3058?w=600',
        'Al Saif Sandwich Maker E05331',
        true,
        0
      ),
    ],
    tags: ['al saif', 'sandwich maker', 'e05331', 'toaster', 'kitchen appliances', 'breakfast'],
    faqs: [
      makeFaq(
        'What size bread does the Al Saif E05331 accommodate?',
        'The E05331 is designed for standard sandwich bread slices. Thicker artisan bread may overhang the plates slightly.',
        0
      ),
    ],
    isFeatured: false,
    metaTitle: 'Al Saif Sandwich Maker E05331 | PRIMO',
    metaDescription:
      'Make perfectly toasted sandwiches with the Al Saif E05331 — triangle non-stick plates, quick heat-up, easy to clean.',
  },

  // ── Row 23 ─────────────────────────────────────────────────────────────────
  {
    sku: 'ALSAIF-SANDWICH-2IN1',
    title: 'Al Saif 2-in-1 Sandwich & Waffle Maker',
    brand: 'Al Saif',
    category: 'Kitchen Appliances',
    subcategory: 'Sandwich Makers',
    description:
      'The Al Saif 2-in-1 Sandwich and Waffle Maker gives you the versatility of two appliances in one compact unit. Interchangeable non-stick plates let you switch from making crispy waffles to perfectly pressed sandwiches in seconds. Ideal for quick breakfasts and snacks with minimal counter space required.',
    shortDescription: '2-in-1 sandwich maker with interchangeable waffle and sandwich plates.',
    specs: [
      makeSpec('Type', '2-in-1 (Sandwich + Waffle)', 'General'),
      makeSpec('Plates', 'Interchangeable non-stick', 'Features'),
    ],
    warranty: '1 year manufacturer warranty',
    price: 0,
    stockQuantity: 25,
    lowStockThreshold: 8,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1603567941648-52e1d17b3058?w=600',
        'Al Saif 2-in-1 Sandwich & Waffle Maker',
        true,
        0
      ),
    ],
    tags: ['al saif', 'sandwich maker', 'waffle maker', '2-in-1', 'kitchen appliances', 'breakfast'],
    faqs: [
      makeFaq(
        'Are the plates of the Al Saif 2-in-1 dishwasher safe?',
        'Please confirm at the time of purchase. Most models with removable plates are dishwasher safe.',
        0
      ),
    ],
    isFeatured: false,
    metaTitle: 'Al Saif 2-in-1 Sandwich & Waffle Maker | PRIMO',
    metaDescription:
      'Versatile 2-in-1 maker by Al Saif — easily switch between sandwich and waffle plates for a perfect breakfast every time.',
  },

  // ── Row 24 ─────────────────────────────────────────────────────────────────
  {
    sku: 'NINJA-FS301ME',
    title: 'Ninja SLUSHi Frozen Drink Maker FS301ME',
    brand: 'Ninja',
    category: 'Kitchen Appliances',
    subcategory: 'Frozen Drink Makers',
    description:
      'The Ninja SLUSHi FS301ME is a dedicated frozen drink maker that transforms ice and your favorite beverages into smooth, professional-quality slushies in seconds. With multiple speed settings and a large capacity pitcher, it handles everything from refreshing fruit slushies to frozen cocktails and granitas. The powerful motor and auto-clean function make it the ideal summer appliance for families and entertainers.',
    shortDescription: 'Frozen drink maker — blends ice into smooth slushies, granitas, and frozen cocktails.',
    specs: [
      makeSpec('Model', 'FS301ME', 'General'),
      makeSpec('Series', 'SLUSHi', 'General'),
      makeSpec('Functions', 'Slushie, granita, frozen cocktail', 'Features'),
      makeSpec('Auto-Clean', 'Yes', 'Features'),
    ],
    warranty: '1 year manufacturer warranty',
    price: 0,
    stockQuantity: 15,
    lowStockThreshold: 5,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1534353341678-31a5d08a3d6c?w=600',
        'Ninja SLUSHi Frozen Drink Maker FS301ME',
        true,
        0
      ),
      makeImg(
        'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=600',
        'Frozen slushie drink',
        false,
        1
      ),
    ],
    tags: ['ninja', 'slushi', 'frozen drink', 'fs301me', 'slushie', 'granita', 'kitchen appliances'],
    faqs: [
      makeFaq(
        'Can the Ninja SLUSHi make alcoholic frozen drinks?',
        'Yes, the Ninja SLUSHi FS301ME can process frozen cocktails and adult beverages alongside non-alcoholic slushies.',
        0
      ),
      makeFaq(
        'How quickly does the Ninja SLUSHi make a slushie?',
        'The SLUSHi typically produces a smooth slushie in under 60 seconds depending on the amount of ice used.',
        1
      ),
    ],
    isFeatured: false,
    metaTitle: 'Ninja SLUSHi Frozen Drink Maker FS301ME | PRIMO',
    metaDescription:
      'Make smooth, refreshing slushies and frozen cocktails in seconds with the Ninja SLUSHi FS301ME — powerful, easy to clean, perfect for summer.',
  },

  // ── Row 25 ─────────────────────────────────────────────────────────────────
  {
    sku: 'EDISON-SBM001',
    title: 'Edison Luqaimat Maker SBM-001',
    brand: 'Edison',
    category: 'Kitchen Appliances',
    subcategory: 'Luqaimat Makers',
    description:
      'The Edison SBM-001 Luqaimat Maker is specially designed to make perfectly round, golden luqaimat (traditional Gulf fried dough balls) at home without deep frying. Using its non-stick electric plates, it produces crispy-outside, soft-inside luqaimat that are ready in minutes. Ideal for Ramadan and family gatherings, this appliance makes the beloved Gulf dessert accessible and easy for everyday cooking.',
    shortDescription: 'Electric luqaimat maker — crispy golden dough balls without deep frying.',
    specs: [
      makeSpec('Model', 'SBM-001', 'General'),
      makeSpec('Brand', 'Edison', 'General'),
      makeSpec('Type', 'Electric luqaimat / aebleskiver maker', 'General'),
      makeSpec('Plates', 'Non-stick', 'Features'),
    ],
    warranty: '1 year manufacturer warranty',
    price: 0,
    stockQuantity: 30,
    lowStockThreshold: 8,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1506354666786-959d6d497f1a?w=600',
        'Edison Luqaimat Maker SBM-001',
        true,
        0
      ),
    ],
    tags: ['edison', 'luqaimat', 'sbm-001', 'luqaimat maker', 'gulf dessert', 'kitchen appliances', 'ramadan'],
    faqs: [
      makeFaq(
        'Can the Edison SBM-001 make regular pancake balls?',
        'Yes, the Edison SBM-001 can also be used to make Danish aebleskiver, takoyaki balls, and similar round pancake-style snacks.',
        0
      ),
      makeFaq(
        'How many luqaimat can it make at once?',
        'Most models can make 7–12 luqaimat at once per batch. Please check the product listing for the exact cavity count.',
        1
      ),
    ],
    isFeatured: false,
    metaTitle: 'Edison Luqaimat Maker SBM-001 | PRIMO',
    metaDescription:
      'Make crispy golden luqaimat at home with the Edison SBM-001 — electric non-stick plates, no deep frying, perfect for Ramadan gatherings.',
  },

  // ── Row 26 ─────────────────────────────────────────────────────────────────
  {
    sku: 'ALSAIF-CHURROS',
    title: 'Al Saif Churros Maker',
    brand: 'Al Saif',
    category: 'Kitchen Appliances',
    subcategory: 'Churros Makers',
    description:
      'The Al Saif Churros Maker lets you recreate the classic Spanish churro experience at home. Non-stick electric plates produce evenly cooked churros with a crispy golden exterior and soft doughy interior — no deep fryer needed. Easy to use and clean, this appliance is perfect for family dessert nights, themed events, and satisfying sweet cravings at any time.',
    shortDescription: 'Electric churros maker with non-stick plates — crispy churros without deep frying.',
    specs: [
      makeSpec('Brand', 'Al Saif', 'General'),
      makeSpec('Type', 'Electric churros maker', 'General'),
      makeSpec('Plates', 'Non-stick', 'Features'),
      makeSpec('Chemical-Free Cooking', 'Yes (no deep fry oil needed)', 'Features'),
    ],
    warranty: '1 year manufacturer warranty',
    price: 0,
    stockQuantity: 25,
    lowStockThreshold: 8,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600',
        'Al Saif Churros Maker',
        true,
        0
      ),
    ],
    tags: ['al saif', 'churros', 'churros maker', 'dessert', 'kitchen appliances', 'non-stick'],
    faqs: [
      makeFaq(
        'Do I need to use oil in the Al Saif Churros Maker?',
        'No, the non-stick plates allow churros to cook without deep frying. A small amount of oil may be brushed on for extra crispiness.',
        0
      ),
    ],
    isFeatured: false,
    metaTitle: 'Al Saif Churros Maker | PRIMO',
    metaDescription:
      'Make classic crispy churros at home without deep frying — the Al Saif Churros Maker with non-stick electric plates.',
  },

  // ── Row 27 ─────────────────────────────────────────────────────────────────
  {
    sku: 'GIBSON-DISPENSER',
    title: 'Gibson Water Dispenser',
    brand: 'Gibson',
    category: 'Water Dispensers',
    subcategory: 'Water Dispensers',
    description:
      'The Gibson Water Dispenser provides hot and cold water on demand, designed to fit standard top-load water bottles. Featuring a child-safety hot water lock, adjustable cooling thermostat, and easy-clean drip tray, it offers reliable performance for home and office environments. The compact upright design conserves floor space while delivering convenient access to purified water throughout the day.',
    shortDescription: 'Hot & cold water dispenser with child-safety lock and drip tray. Top-load design.',
    specs: [
      makeSpec('Brand', 'Gibson', 'General'),
      makeSpec('Temperature', 'Hot & Cold', 'Performance'),
      makeSpec('Loading', 'Top-load', 'Design'),
      makeSpec('Safety', 'Child-lock on hot tap', 'Safety'),
      makeSpec('Drip Tray', 'Included', 'Features'),
    ],
    warranty: '1 year manufacturer warranty',
    price: 0,
    stockQuantity: 15,
    lowStockThreshold: 3,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600',
        'Gibson Water Dispenser',
        true,
        0
      ),
    ],
    tags: ['gibson', 'water dispenser', 'hot cold water', 'office', 'home', 'top-load'],
    faqs: [
      makeFaq(
        'What bottle size does the Gibson Water Dispenser support?',
        'The Gibson Water Dispenser is compatible with standard 18.9L (5-gallon) top-load water bottles.',
        0
      ),
      makeFaq(
        'Does the Gibson dispenser have a hot water safety lock?',
        'Yes, a child-safety lock is included on the hot water tap to prevent accidental burns.',
        1
      ),
    ],
    isFeatured: false,
    metaTitle: 'Gibson Water Dispenser — Hot & Cold | PRIMO',
    metaDescription:
      'Stay hydrated with the Gibson top-load water dispenser — hot and cold water on demand, child-safety lock, compact design for home and office.',
  },

  // ── Row 28 ─────────────────────────────────────────────────────────────────
  {
    sku: 'HAAM-DISPENSER',
    title: 'Haam Water Dispenser',
    brand: 'Haam',
    category: 'Water Dispensers',
    subcategory: 'Water Dispensers',
    description:
      'The Haam Water Dispenser offers efficient hot and cold water delivery in a sleek, freestanding design. Built for everyday family or office use, it features easy-access taps, a hygienic stainless steel cold water tank, and a quick-heat hot water system. The drip tray and removable cabinet base provide convenient storage and easy maintenance.',
    shortDescription: 'Freestanding hot & cold water dispenser with stainless steel tank and cabinet storage.',
    specs: [
      makeSpec('Brand', 'Haam', 'General'),
      makeSpec('Temperature', 'Hot & Cold', 'Performance'),
      makeSpec('Cold Tank', 'Stainless Steel', 'Features'),
      makeSpec('Storage', 'Cabinet base', 'Design'),
    ],
    warranty: '1 year manufacturer warranty',
    price: 0,
    stockQuantity: 12,
    lowStockThreshold: 3,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600',
        'Haam Water Dispenser',
        true,
        0
      ),
    ],
    tags: ['haam', 'water dispenser', 'hot cold water', 'freestanding', 'cabinet', 'stainless steel'],
    faqs: [
      makeFaq(
        'Does the Haam Water Dispenser include a refrigerator compartment?',
        'Some Haam models include a small cabinet compartment for storage. Please verify with the specific model listing.',
        0
      ),
    ],
    isFeatured: false,
    metaTitle: 'Haam Water Dispenser — Hot & Cold | PRIMO',
    metaDescription:
      'The Haam freestanding water dispenser delivers instant hot and cold water with stainless steel tank and cabinet storage for home and office use.',
  },

  // ── Row 29 ─────────────────────────────────────────────────────────────────
  {
    sku: 'PANASONIC-DISPENSER',
    title: 'Panasonic Water Dispenser',
    brand: 'Panasonic',
    category: 'Water Dispensers',
    subcategory: 'Water Dispensers',
    description:
      'The Panasonic Water Dispenser combines Japanese engineering quality with practical water-dispensing functionality. Available in top-load configuration, it provides instant access to hot, cold, and room-temperature water. Built-in UV sterilization (on select models) keeps stored water hygienic, while the energy-saving mode reduces electricity consumption during idle periods.',
    shortDescription: 'Panasonic water dispenser — instant hot, cold, and room-temp water with energy-saving mode.',
    specs: [
      makeSpec('Brand', 'Panasonic', 'General'),
      makeSpec('Temperature Options', 'Hot, Cold, Room Temperature', 'Performance'),
      makeSpec('Energy Saving', 'Yes (eco mode)', 'Features'),
    ],
    warranty: '2 years manufacturer warranty',
    price: 0,
    stockQuantity: 12,
    lowStockThreshold: 3,
    images: [
      makeImg(
        'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600',
        'Panasonic Water Dispenser',
        true,
        0
      ),
    ],
    tags: ['panasonic', 'water dispenser', 'hot cold water', 'energy saving', 'japanese quality'],
    faqs: [
      makeFaq(
        'Does the Panasonic Water Dispenser have a UV sterilization function?',
        'Select Panasonic models include UV sterilization. Please verify with the product listing for your specific model.',
        0
      ),
      makeFaq(
        'Is the Panasonic dispenser energy efficient?',
        'Yes, Panasonic dispensers typically include an eco/energy-saving mode that reduces power consumption when not in active use.',
        1
      ),
    ],
    isFeatured: false,
    metaTitle: 'Panasonic Water Dispenser | PRIMO',
    metaDescription:
      'Quality hydration from Panasonic — instant hot, cold, and room-temperature water dispenser with energy-saving mode.',
  },
];

// ─── Main Seed Function ───────────────────────────────────────────────────────

async function main() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.\n');

  // ── Step 1: Delete all existing products ──────────────────────────────────
  console.log('🗑️  Deleting all existing products...');
  const deleted = await Product.deleteMany({});
  console.log(`   Removed ${deleted.deletedCount} products.\n`);

  // ── Step 2: Upsert categories and subcategories ───────────────────────────
  console.log('📁 Upserting categories...');
  const categoryMap = new Map<string, mongoose.Types.ObjectId>(); // "Category" or "Category::Sub" → _id

  let catOrder = 1;
  for (const [catName, subNames] of Object.entries(CATEGORY_TREE)) {
    // Parent category
    let parent = await Category.findOne({ name: catName, parentId: { $exists: false } });
    if (!parent) {
      parent = new Category({
        name: catName,
        order: catOrder,
        showInTopBar: true,
        topBarOrder: catOrder,
        isActive: true,
      });
      await parent.save();
      console.log(`   + Created parent: ${catName}`);
    } else {
      console.log(`   = Found parent:   ${catName}`);
    }
    categoryMap.set(catName, parent._id);
    catOrder++;

    // Subcategories
    let subOrder = 1;
    for (const subName of subNames) {
      let sub = await Category.findOne({ name: subName, parentId: parent._id });
      if (!sub) {
        sub = new Category({
          name: subName,
          parentId: parent._id,
          order: subOrder,
          showInTopBar: false,
          isActive: true,
        });
        await sub.save();
        console.log(`     + Created sub:    ${catName} > ${subName}`);
      } else {
        console.log(`     = Found sub:      ${catName} > ${subName}`);
      }
      categoryMap.set(`${catName}::${subName}`, sub._id);
      subOrder++;
    }
  }

  console.log(`\n✅ Categories ready. Map size: ${categoryMap.size}\n`);

  // ── Step 3: Upsert products by SKU ───────────────────────────────────────
  console.log('📦 Importing products...');
  let created = 0;
  let updated = 0;
  let errors = 0;

  // Real EGP prices per SKU (the product definitions ship with price: 0 so the
  // catalogue can be priced here without editing every block). Adjust freely.
  const PRICE_BY_SKU: Record<string, number> = {
    'JOY-FDD-02901': 1200, 'MLAY-T14-A': 3500, 'MLAY-T14-B': 4200, 'DELONGHI-EC685': 12000,
    'BRAUN-WK5110BK': 1800, 'KENWOOD-ZJG08000CL': 1500, 'KENWOOD-ZJM01AOBK': 1300,
    'ARZUM-OK008WFU': 4500, 'ARZUM-OKKA-MINI': 3200, 'ARZUM-OK0026': 5500, 'ARZUM-OK0038': 6200,
    'ARZUM-OK0032': 3800, 'ARZUM-ESPRESSO-SOLO': 4000, 'BISSELL-PARTS-KIT': 600, 'KARCHER-SC3EF': 7500,
    'BISSELL-39N7V': 2800, 'BNDECKER-BHSM1': 2200, 'KENWOOD-GRILL-ELEC': 2500, 'ARZUM-AR2092': 2900,
    'NINJA-CREAMI-DELUXE': 9500, 'ALSAIF-E05331': 900, 'ALSAIF-SANDWICH-2IN1': 1100, 'NINJA-FS301ME': 8500,
    'EDISON-SBM001': 1400, 'ALSAIF-CHURROS': 1000, 'GIBSON-DISPENSER': 6000, 'HAAM-DISPENSER': 5500,
    'PANASONIC-DISPENSER': 7000,
  };
  // Percentage discounts for a few items so the "On Sale" rail is populated.
  const DISCOUNT_BY_SKU: Record<string, number> = {
    'DELONGHI-EC685': 20, 'ARZUM-OK0038': 15, 'KARCHER-SC3EF': 25,
    'NINJA-CREAMI-DELUXE': 18, 'MLAY-T14-A': 12, 'BRAUN-WK5110BK': 10, 'NINJA-FS301ME': 20,
  };
  const discountEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  for (const def of PRODUCTS) {
    try {
      const catId = categoryMap.get(def.category);
      if (!catId) {
        console.warn(`   ⚠️  SKU ${def.sku}: category "${def.category}" not found — skipping`);
        errors++;
        continue;
      }

      const subKey = `${def.category}::${def.subcategory}`;
      const subId = categoryMap.get(subKey);

      const payload = {
        title: def.title,
        brand: def.brand,
        sku: def.sku,
        description: def.description,
        shortDescription: def.shortDescription,
        specs: def.specs,
        warranty: def.warranty,
        price: PRICE_BY_SKU[def.sku] ?? def.price,
        ...(DISCOUNT_BY_SKU[def.sku]
          ? {
              discount: DISCOUNT_BY_SKU[def.sku],
              compareAtPrice: PRICE_BY_SKU[def.sku] ?? def.price,
              discountEndsAt,
            }
          : def.compareAtPrice !== undefined
          ? { compareAtPrice: def.compareAtPrice }
          : {}),
        stockQuantity: def.stockQuantity,
        lowStockThreshold: def.lowStockThreshold,
        images: def.images,
        categoryId: catId,
        ...(subId && { subcategoryId: subId }),
        tags: def.tags,
        faqs: def.faqs,
        isActive: true,
        isFeatured: def.isFeatured,
        metaTitle: def.metaTitle,
        metaDescription: def.metaDescription,
        ...(def.deliveryNotes && { deliveryNotes: def.deliveryNotes }),
        ...(def.installationNotes && { installationNotes: def.installationNotes }),
        soldCount: 0,
        viewCount: 0,
        averageRating: 0,
        reviewCount: 0,
      };

      const existing = await Product.findOne({ sku: def.sku });
      if (existing) {
        // Update but preserve slug (don't change title-derived slug on update)
        await Product.updateOne({ sku: def.sku }, { $set: payload });
        console.log(`   ~ Updated: [${def.sku}] ${def.title}`);
        updated++;
      } else {
        const product = new Product(payload);
        await product.save(); // triggers pre-save slug generation
        console.log(`   + Created: [${def.sku}] ${def.title}`);
        created++;
      }
    } catch (err: any) {
      console.error(`   ✗ Error on SKU ${def.sku}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n🎉 Done!`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Errors:  ${errors}`);
  console.log(`   Total processed: ${PRODUCTS.length}\n`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
