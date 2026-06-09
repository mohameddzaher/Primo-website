// ============================================
// PRIMO API - Database Seed Script
// ============================================

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Review } from '../models/Review';
import { Order } from '../models/Order';
import { Offer } from '../models/Offer';
import { Banner } from '../models/Banner';
import { BlogPost, BlogCategory } from '../models/Blog';
import { CMSContent, PolicyPage, FAQ } from '../models/CMS';
import { Notification } from '../models/Notification';
import { Brand } from '../models/Brand';

// Unsplash image URLs for realistic product images
const productImages = {
  refrigerators: [
    'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800',
    'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800',
  ],
  washingMachines: [
    'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800',
    'https://images.unsplash.com/photo-1610557892470-55d9e80c0eb2?w=800',
  ],
  airConditioners: [
    'https://images.unsplash.com/photo-1631545806609-35d4ae440431?w=800',
    'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800',
  ],
  televisions: [
    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800',
    'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800',
  ],
  microwaves: [
    'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800',
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800',
  ],
  vacuums: [
    'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800',
    'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800',
  ],
  blenders: [
    'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800',
    'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800',
  ],
  coffeeMakers: [
    'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
  ],
};

const bannerImages = [
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600',
  'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=1600',
];

const blogImages = [
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=800',
];

async function clearDatabase(): Promise<void> {
  console.log('🗑️  Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Review.deleteMany({}),
    Order.deleteMany({}),
    Offer.deleteMany({}),
    Banner.deleteMany({}),
    BlogPost.deleteMany({}),
    BlogCategory.deleteMany({}),
    CMSContent.deleteMany({}),
    PolicyPage.deleteMany({}),
    FAQ.deleteMany({}),
    Notification.deleteMany({}),
    Brand.deleteMany({}),
  ]);
  console.log('✅ Database cleared');
}

async function seedUsers(): Promise<{
  superAdmin: any;
  admin: any;
  users: any[];
}> {
  console.log('👤 Seeding users...');

  const superAdmin = await User.create({
    email: 'admin@primo.com',
    password: 'admin123',
    firstName: 'Super',
    lastName: 'Admin',
    phone: '+201234567890',
    role: 'super_admin',
    isActive: true,
    isEmailVerified: true,
    addresses: [
      {
        id: uuidv4(),
        label: 'Office',
        fullAddress: '123 Business Tower, Downtown Cairo',
        city: 'Cairo',
        area: 'Downtown',
        building: 'Tower A',
        floor: '15', 
        isDefault: true,
      },
    ],
  });

  const admin = await User.create({
    email: 'staff@primo.com',
    password: 'staff123',
    firstName: 'Staff',
    lastName: 'Member',
    phone: '+201234567891',
    role: 'admin',
    isActive: true,
    isEmailVerified: true,
    createdBy: superAdmin._id,
    permissions: {
      orders: { read: true, write: true },
      products: { read: true, write: true },
      offers: { read: true, write: true },
      reviews: { moderate: true },
      analytics: { limited: true, full: false },
      staff: { read: false, write: false },
      cms: { read: true, write: true },
    },
  });

  const regularUsers = await User.create([
    {
      email: 'user@primo.com',
      password: 'user123',
      firstName: 'Ahmed',
      lastName: 'Hassan',
      phone: '+201234567892',
      role: 'user',
      isActive: true,
      isEmailVerified: true,
      addresses: [
        {
          id: uuidv4(),
          label: 'Home',
          fullAddress: '45 Nile Corniche, Maadi',
          city: 'Cairo',
          area: 'Maadi',
          building: '12',
          floor: '3',
          apartment: '5',
          isDefault: true,
        },
      ],
    },
    {
      email: 'fatma@example.com',
      password: 'password123',
      firstName: 'Fatma',
      lastName: 'Ali',
      phone: '+201234567893',
      role: 'user',
      isActive: true,
      isEmailVerified: true,
      addresses: [
        {
          id: uuidv4(),
          label: 'Home',
          fullAddress: '78 October Street, 6th of October',
          city: 'Giza',
          area: '6th of October',
          isDefault: true,
        },
      ],
    },
    {
      email: 'omar@example.com',
      password: 'password123',
      firstName: 'Omar',
      lastName: 'Mohamed',
      phone: '+201234567894',
      role: 'user',
      isActive: true,
      isEmailVerified: false,
    },
  ]);

  console.log(`✅ Created ${3 + regularUsers.length} users`);
  return { superAdmin, admin, users: regularUsers };
}

async function seedCategories(): Promise<any[]> {
  console.log('📁 Seeding categories...');

  const categories = await Category.create([
    {
      name: 'Large Appliances',
      description: 'Major home appliances for your kitchen and laundry room',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
      icon: 'refrigerator',
      order: 1,
      isActive: true,
    },
    {
      name: 'Small Appliances',
      description: 'Countertop and portable appliances for everyday use',
      image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400',
      icon: 'blender',
      order: 2,
      isActive: true,
    },
    {
      name: 'Climate Control',
      description: 'Air conditioners, fans, and heating solutions',
      image: 'https://images.unsplash.com/photo-1631545806609-35d4ae440431?w=400',
      icon: 'air-conditioner',
      order: 3,
      isActive: true,
    },
    {
      name: 'Home Entertainment',
      description: 'TVs, sound systems, and entertainment devices',
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400',
      icon: 'tv',
      order: 4,
      isActive: true,
    },
    {
      name: 'Cleaning',
      description: 'Vacuum cleaners, steam mops, and cleaning equipment',
      image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400',
      icon: 'vacuum',
      order: 5,
      isActive: true,
    },
  ]);

  // Create subcategories
  const subcategories = await Category.create([
    {
      name: 'Refrigerators',
      description: 'French door, side-by-side, and top-freezer refrigerators',
      image: productImages.refrigerators[0],
      parentId: categories[0]._id,
      order: 1,
      isActive: true,
    },
    {
      name: 'Washing Machines',
      description: 'Front-load and top-load washing machines',
      image: productImages.washingMachines[0],
      parentId: categories[0]._id,
      order: 2,
      isActive: true,
    },
    {
      name: 'Dryers',
      description: 'Electric and gas dryers',
      image: productImages.washingMachines[1],
      parentId: categories[0]._id,
      order: 3,
      isActive: true,
    },
    {
      name: 'Dishwashers',
      description: 'Built-in and portable dishwashers',
      parentId: categories[0]._id,
      order: 4,
      isActive: true,
    },
    {
      name: 'Blenders',
      description: 'Countertop and immersion blenders',
      image: productImages.blenders[0],
      parentId: categories[1]._id,
      order: 1,
      isActive: true,
    },
    {
      name: 'Coffee Makers',
      description: 'Drip, espresso, and single-serve coffee machines',
      image: productImages.coffeeMakers[0],
      parentId: categories[1]._id,
      order: 2,
      isActive: true,
    },
    {
      name: 'Microwaves',
      description: 'Countertop and over-the-range microwaves',
      image: productImages.microwaves[0],
      parentId: categories[1]._id,
      order: 3,
      isActive: true,
    },
    {
      name: 'Air Conditioners',
      description: 'Split, window, and portable air conditioners',
      image: productImages.airConditioners[0],
      parentId: categories[2]._id,
      order: 1,
      isActive: true,
    },
    {
      name: 'Televisions',
      description: 'Smart TVs, OLED, QLED, and LED displays',
      image: productImages.televisions[0],
      parentId: categories[3]._id,
      order: 1,
      isActive: true,
    },
    {
      name: 'Vacuum Cleaners',
      description: 'Robot, upright, and handheld vacuums',
      image: productImages.vacuums[0],
      parentId: categories[4]._id,
      order: 1,
      isActive: true,
    },
  ]);

  console.log(`✅ Created ${categories.length} categories and ${subcategories.length} subcategories`);
  return [...categories, ...subcategories];
}

async function seedProducts(categories: any[]): Promise<any[]> {
  console.log('📦 Seeding products...');

  const refrigeratorCat = categories.find((c) => c.name === 'Refrigerators');
  const washingCat = categories.find((c) => c.name === 'Washing Machines');
  const acCat = categories.find((c) => c.name === 'Air Conditioners');
  const tvCat = categories.find((c) => c.name === 'Televisions');
  const blenderCat = categories.find((c) => c.name === 'Blenders');
  const coffeeCat = categories.find((c) => c.name === 'Coffee Makers');
  const vacuumCat = categories.find((c) => c.name === 'Vacuum Cleaners');
  const microwaveCat = categories.find((c) => c.name === 'Microwaves');
  const largeCat = categories.find((c) => c.name === 'Large Appliances');
  const smallCat = categories.find((c) => c.name === 'Small Appliances');
  const climateCat = categories.find((c) => c.name === 'Climate Control');
  const entertainmentCat = categories.find((c) => c.name === 'Home Entertainment');
  const cleaningCat = categories.find((c) => c.name === 'Cleaning');

  const products = await Product.create([
    // Refrigerators
    {
      title: 'Samsung French Door Refrigerator 28 Cu Ft',
      brand: 'Samsung',
      sku: 'SAM-REF-001',
      description: 'Experience the ultimate in food preservation with this Samsung French Door Refrigerator. Featuring a spacious 28 cubic feet capacity, this refrigerator offers ample room for all your groceries while maintaining optimal freshness. The Twin Cooling Plus technology keeps fruits and vegetables crisp for longer, while the FlexZone drawer provides customizable storage options.',
      shortDescription: 'Spacious 28 cu ft French door refrigerator with Twin Cooling Plus technology.',
      specs: [
        { name: 'Capacity', value: '28 Cu Ft', group: 'Dimensions' },
        { name: 'Width', value: '35.75"', group: 'Dimensions' },
        { name: 'Height', value: '70"', group: 'Dimensions' },
        { name: 'Depth', value: '36.5"', group: 'Dimensions' },
        { name: 'Cooling Technology', value: 'Twin Cooling Plus', group: 'Features' },
        { name: 'Ice Maker', value: 'Built-in', group: 'Features' },
        { name: 'Energy Rating', value: 'A++', group: 'Efficiency' },
        { name: 'Annual Energy', value: '650 kWh', group: 'Efficiency' },
      ],
      warranty: '2 Years Manufacturer Warranty',
      deliveryNotes: 'Free delivery. Professional installation available.',
      price: 42999,
      compareAtPrice: 49999,
      discount: 15,
      stockQuantity: 25,
      lowStockThreshold: 5,
      images: [
        { id: uuidv4(), url: productImages.refrigerators[0], alt: 'Samsung French Door Refrigerator Front View', isPrimary: true, order: 0 },
        { id: uuidv4(), url: productImages.refrigerators[1], alt: 'Samsung French Door Refrigerator Interior', isPrimary: false, order: 1 },
      ],
      categoryId: largeCat._id,
      subcategoryId: refrigeratorCat?._id,
      tags: ['refrigerator', 'french-door', 'samsung', 'smart', 'large-capacity'],
      faqs: [
        { id: uuidv4(), question: 'Does it have a water dispenser?', answer: 'Yes, it features an external water and ice dispenser with a built-in filter.', order: 0 },
        { id: uuidv4(), question: 'Is professional installation included?', answer: 'Basic delivery is free. Professional installation is available for an additional fee.', order: 1 },
      ],
      isActive: true,
      isFeatured: true,
      averageRating: 4.5,
      reviewCount: 128,
      soldCount: 245,
      viewCount: 3420,
    },
    {
      title: 'LG InstaView Side-by-Side Refrigerator 26 Cu Ft',
      brand: 'LG',
      sku: 'LG-REF-002',
      description: 'The LG InstaView Door-in-Door refrigerator lets you see inside without opening the door. Simply knock twice on the sleek glass panel and the interior lights up. This innovative feature helps reduce cold air loss, keeping food fresher longer while saving energy.',
      shortDescription: 'Innovative InstaView technology with Door-in-Door design.',
      specs: [
        { name: 'Capacity', value: '26 Cu Ft', group: 'Dimensions' },
        { name: 'Width', value: '36"', group: 'Dimensions' },
        { name: 'Smart Features', value: 'ThinQ App Compatible', group: 'Features' },
        { name: 'Energy Rating', value: 'A+', group: 'Efficiency' },
      ],
      warranty: '2 Years Manufacturer Warranty',
      price: 38999,
      stockQuantity: 15,
      lowStockThreshold: 3,
      images: [
        { id: uuidv4(), url: productImages.refrigerators[1], alt: 'LG InstaView Refrigerator', isPrimary: true, order: 0 },
        { id: uuidv4(), url: productImages.refrigerators[0], alt: 'LG InstaView Refrigerator Interior', isPrimary: false, order: 1 },
      ],
      categoryId: largeCat._id,
      subcategoryId: refrigeratorCat?._id,
      tags: ['refrigerator', 'lg', 'instaview', 'smart-home'],
      isActive: true,
      isFeatured: true,
      averageRating: 4.7,
      reviewCount: 89,
      soldCount: 156,
      viewCount: 2100,
    },
    // Washing Machines
    {
      title: 'Bosch Series 8 Front Load Washing Machine 10kg',
      brand: 'Bosch',
      sku: 'BOSCH-WM-001',
      description: 'The Bosch Series 8 washing machine combines German engineering with innovative features for exceptional laundry care. The i-DOS automatic dosing system precisely measures detergent, while the SpeedPerfect option reduces washing time by up to 65% without compromising results.',
      shortDescription: 'Premium 10kg front-loader with i-DOS automatic dosing.',
      specs: [
        { name: 'Capacity', value: '10 kg', group: 'Performance' },
        { name: 'Spin Speed', value: '1600 RPM', group: 'Performance' },
        { name: 'Energy Class', value: 'A+++', group: 'Efficiency' },
        { name: 'Noise Level', value: '47 dB', group: 'Features' },
        { name: 'Programs', value: '14', group: 'Features' },
      ],
      warranty: '3 Years Manufacturer Warranty',
      installationNotes: 'Free installation with old appliance removal.',
      price: 28999,
      compareAtPrice: 32999,
      discount: 12,
      stockQuantity: 30,
      lowStockThreshold: 5,
      images: [
        { id: uuidv4(), url: productImages.washingMachines[0], alt: 'Bosch Washing Machine Front', isPrimary: true, order: 0 },
        { id: uuidv4(), url: productImages.washingMachines[1], alt: 'Bosch Washing Machine Open', isPrimary: false, order: 1 },
      ],
      categoryId: largeCat._id,
      subcategoryId: washingCat?._id,
      tags: ['washing-machine', 'bosch', 'front-load', 'energy-efficient'],
      faqs: [
        { id: uuidv4(), question: 'Does it have a steam function?', answer: 'Yes, it features ActiveOxygen that removes 99.99% of bacteria without pre-treatment.', order: 0 },
      ],
      isActive: true,
      isFeatured: true,
      averageRating: 4.8,
      reviewCount: 256,
      soldCount: 412,
      viewCount: 5200,
    },
    // Air Conditioners
    {
      title: 'Carrier Split Air Conditioner 2.25 HP Cool',
      brand: 'Carrier',
      sku: 'CARR-AC-001',
      description: 'Stay cool and comfortable with the Carrier Split Air Conditioner. Featuring advanced inverter technology for energy efficiency and quiet operation. The 4-way air flow ensures even cooling throughout the room.',
      shortDescription: '2.25 HP split AC with inverter technology.',
      specs: [
        { name: 'Capacity', value: '2.25 HP', group: 'Performance' },
        { name: 'BTU', value: '18000', group: 'Performance' },
        { name: 'Technology', value: 'Inverter', group: 'Features' },
        { name: 'Noise Level', value: '26 dB', group: 'Features' },
        { name: 'Energy Rating', value: 'A++', group: 'Efficiency' },
      ],
      warranty: '5 Years Compressor, 2 Years Parts',
      installationNotes: 'Professional installation included. Copper pipes up to 3m included.',
      price: 24999,
      stockQuantity: 45,
      lowStockThreshold: 10,
      images: [
        { id: uuidv4(), url: productImages.airConditioners[0], alt: 'Carrier Split AC', isPrimary: true, order: 0 },
        { id: uuidv4(), url: productImages.airConditioners[1], alt: 'Carrier Split AC Indoor Unit', isPrimary: false, order: 1 },
      ],
      categoryId: climateCat._id,
      subcategoryId: acCat?._id,
      tags: ['air-conditioner', 'carrier', 'inverter', 'split-ac'],
      isActive: true,
      isFeatured: true,
      averageRating: 4.6,
      reviewCount: 342,
      soldCount: 567,
      viewCount: 8900,
    },
    // Televisions
    {
      title: 'LG OLED 65" 4K Smart TV C3 Series',
      brand: 'LG',
      sku: 'LG-TV-001',
      description: 'Experience stunning picture quality with the LG OLED C3 Series. Self-lit OLED pixels deliver perfect blacks, infinite contrast, and over a billion colors. Powered by the α9 AI Processor Gen6, it optimizes picture and sound for an immersive viewing experience.',
      shortDescription: '65" OLED 4K Smart TV with α9 Gen6 AI Processor.',
      specs: [
        { name: 'Screen Size', value: '65"', group: 'Display' },
        { name: 'Resolution', value: '4K Ultra HD', group: 'Display' },
        { name: 'Panel Type', value: 'OLED', group: 'Display' },
        { name: 'Refresh Rate', value: '120Hz', group: 'Display' },
        { name: 'HDR', value: 'Dolby Vision IQ', group: 'Features' },
        { name: 'Smart Platform', value: 'webOS 23', group: 'Features' },
      ],
      warranty: '2 Years Manufacturer Warranty',
      price: 64999,
      compareAtPrice: 74999,
      discount: 13,
      stockQuantity: 12,
      lowStockThreshold: 3,
      images: [
        { id: uuidv4(), url: productImages.televisions[0], alt: 'LG OLED TV Front', isPrimary: true, order: 0 },
        { id: uuidv4(), url: productImages.televisions[1], alt: 'LG OLED TV Lifestyle', isPrimary: false, order: 1 },
      ],
      categoryId: entertainmentCat._id,
      subcategoryId: tvCat?._id,
      tags: ['tv', 'oled', 'lg', '4k', 'smart-tv', '65-inch'],
      isActive: true,
      isFeatured: true,
      averageRating: 4.9,
      reviewCount: 567,
      soldCount: 234,
      viewCount: 12500,
    },
    // Small Appliances
    {
      title: 'Vitamix Professional Series 750 Blender',
      brand: 'Vitamix',
      sku: 'VIT-BL-001',
      description: 'The Vitamix Professional Series 750 is the ultimate kitchen workhorse. With 5 pre-programmed settings, aircraft-grade stainless steel blades, and a powerful 2.2 HP motor, it handles everything from smoothies to hot soups.',
      shortDescription: 'Professional-grade blender with 5 pre-programmed settings.',
      specs: [
        { name: 'Motor Power', value: '2.2 HP', group: 'Performance' },
        { name: 'Container', value: '64 oz', group: 'Capacity' },
        { name: 'Blade Material', value: 'Stainless Steel', group: 'Features' },
        { name: 'Programs', value: '5 Pre-set', group: 'Features' },
      ],
      warranty: '7 Years Full Warranty',
      price: 18999,
      stockQuantity: 20,
      lowStockThreshold: 5,
      images: [
        { id: uuidv4(), url: productImages.blenders[0], alt: 'Vitamix Blender', isPrimary: true, order: 0 },
        { id: uuidv4(), url: productImages.blenders[1], alt: 'Vitamix Blender Top View', isPrimary: false, order: 1 },
      ],
      categoryId: smallCat._id,
      subcategoryId: blenderCat?._id,
      tags: ['blender', 'vitamix', 'professional', 'kitchen'],
      isActive: true,
      isFeatured: false,
      averageRating: 4.8,
      reviewCount: 189,
      soldCount: 345,
      viewCount: 4200,
    },
    {
      title: 'De\'Longhi La Specialista Espresso Machine',
      brand: 'De\'Longhi',
      sku: 'DEL-CM-001',
      description: 'Craft barista-quality espresso at home with the De\'Longhi La Specialista. Featuring Sensor Grinding Technology, Active Temperature Control, and a built-in tamping system for consistent, cafe-quality results every time.',
      shortDescription: 'Semi-automatic espresso machine with sensor grinding.',
      specs: [
        { name: 'Pump Pressure', value: '19 Bar', group: 'Performance' },
        { name: 'Grinder', value: 'Built-in Burr', group: 'Features' },
        { name: 'Water Tank', value: '2L', group: 'Capacity' },
        { name: 'Bean Hopper', value: '300g', group: 'Capacity' },
      ],
      warranty: '2 Years Manufacturer Warranty',
      price: 22999,
      compareAtPrice: 25999,
      discount: 12,
      stockQuantity: 18,
      lowStockThreshold: 4,
      images: [
        { id: uuidv4(), url: productImages.coffeeMakers[0], alt: 'DeLonghi Espresso Machine', isPrimary: true, order: 0 },
        { id: uuidv4(), url: productImages.coffeeMakers[1], alt: 'DeLonghi Espresso Machine Brewing', isPrimary: false, order: 1 },
      ],
      categoryId: smallCat._id,
      subcategoryId: coffeeCat?._id,
      tags: ['coffee', 'espresso', 'delonghi', 'barista'],
      isActive: true,
      isFeatured: true,
      averageRating: 4.7,
      reviewCount: 234,
      soldCount: 189,
      viewCount: 5600,
    },
    {
      title: 'Dyson V15 Detect Cordless Vacuum',
      brand: 'Dyson',
      sku: 'DYS-VAC-001',
      description: 'The Dyson V15 Detect reveals microscopic dust with a laser, showing dust you couldn\'t see before. The piezo sensor counts and sizes particles, automatically adjusting suction power for deep cleaning.',
      shortDescription: 'Intelligent cordless vacuum with laser dust detection.',
      specs: [
        { name: 'Run Time', value: 'Up to 60 min', group: 'Performance' },
        { name: 'Suction Power', value: '230 AW', group: 'Performance' },
        { name: 'Bin Capacity', value: '0.76L', group: 'Capacity' },
        { name: 'Weight', value: '3 kg', group: 'Dimensions' },
      ],
      warranty: '2 Years Manufacturer Warranty',
      price: 27999,
      stockQuantity: 22,
      lowStockThreshold: 5,
      images: [
        { id: uuidv4(), url: productImages.vacuums[0], alt: 'Dyson V15 Vacuum', isPrimary: true, order: 0 },
        { id: uuidv4(), url: productImages.vacuums[1], alt: 'Dyson V15 Vacuum In Use', isPrimary: false, order: 1 },
      ],
      categoryId: cleaningCat._id,
      subcategoryId: vacuumCat?._id,
      tags: ['vacuum', 'dyson', 'cordless', 'smart'],
      isActive: true,
      isFeatured: true,
      averageRating: 4.9,
      reviewCount: 456,
      soldCount: 678,
      viewCount: 9800,
    },
    {
      title: 'Panasonic Inverter Microwave Oven 32L',
      brand: 'Panasonic',
      sku: 'PAN-MW-001',
      description: 'The Panasonic Inverter Microwave delivers consistent cooking power for evenly heated meals. The 32L capacity is perfect for families, and the combination of microwave, grill, and convection offers versatile cooking options.',
      shortDescription: '32L inverter microwave with grill and convection.',
      specs: [
        { name: 'Capacity', value: '32L', group: 'Dimensions' },
        { name: 'Power', value: '1000W', group: 'Performance' },
        { name: 'Grill', value: '1300W', group: 'Performance' },
        { name: 'Programs', value: '24 Auto', group: 'Features' },
      ],
      warranty: '2 Years Manufacturer Warranty',
      price: 8999,
      compareAtPrice: 10999,
      discount: 18,
      stockQuantity: 35,
      lowStockThreshold: 8,
      images: [
        { id: uuidv4(), url: productImages.microwaves[0], alt: 'Panasonic Microwave', isPrimary: true, order: 0 },
        { id: uuidv4(), url: productImages.microwaves[1], alt: 'Panasonic Microwave Interior', isPrimary: false, order: 1 },
      ],
      categoryId: smallCat._id,
      subcategoryId: microwaveCat?._id,
      tags: ['microwave', 'panasonic', 'inverter', 'grill'],
      isActive: true,
      isFeatured: false,
      averageRating: 4.5,
      reviewCount: 167,
      soldCount: 289,
      viewCount: 3400,
    },
    {
      title: 'Samsung Bespoke Jet Bot AI+ Robot Vacuum',
      brand: 'Samsung',
      sku: 'SAM-VAC-002',
      description: 'The Samsung Bespoke Jet Bot AI+ uses Intel AI and LiDAR sensors to navigate your home intelligently. It recognizes objects, avoids obstacles, and automatically empties its dustbin at the Clean Station.',
      shortDescription: 'AI-powered robot vacuum with auto-empty station.',
      specs: [
        { name: 'Navigation', value: 'LiDAR + Intel AI', group: 'Features' },
        { name: 'Run Time', value: '90 min', group: 'Performance' },
        { name: 'Suction Power', value: '30W', group: 'Performance' },
        { name: 'Dustbin', value: '0.3L', group: 'Capacity' },
      ],
      warranty: '2 Years Manufacturer Warranty',
      price: 34999,
      stockQuantity: 8,
      lowStockThreshold: 2,
      images: [
        { id: uuidv4(), url: productImages.vacuums[1], alt: 'Samsung Jet Bot', isPrimary: true, order: 0 },
        { id: uuidv4(), url: productImages.vacuums[0], alt: 'Samsung Jet Bot Cleaning', isPrimary: false, order: 1 },
      ],
      categoryId: cleaningCat._id,
      subcategoryId: vacuumCat?._id,
      tags: ['vacuum', 'robot', 'samsung', 'ai', 'smart-home'],
      isActive: true,
      isFeatured: true,
      averageRating: 4.6,
      reviewCount: 78,
      soldCount: 45,
      viewCount: 2100,
    },
  ]);

  console.log(`✅ Created ${products.length} products`);
  return products;
}

async function seedReviews(products: any[], users: any[]): Promise<void> {
  console.log('⭐ Seeding reviews...');

  const reviewsData = [];
  const comments = [
    'Excellent product! Exceeded my expectations.',
    'Great quality for the price. Highly recommend.',
    'Works perfectly. Very satisfied with my purchase.',
    'Good product overall. Delivery was fast.',
    'Amazing features. Best purchase I\'ve made.',
    'Solid build quality. Does exactly what it\'s supposed to do.',
    'Very happy with this purchase. Will buy again.',
    'Great value for money. No complaints.',
  ];

  for (const product of products) {
    const reviewCount = Math.floor(Math.random() * 5) + 2;
    for (let i = 0; i < reviewCount; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      reviewsData.push({
        productId: product._id,
        userId: user._id,
        userName: `${user.firstName} ${user.lastName}`,
        orderId: new mongoose.Types.ObjectId(), // Placeholder order ID for seeding
        rating: Math.floor(Math.random() * 2) + 4,
        comment: comments[Math.floor(Math.random() * comments.length)],
        status: 'approved',
        isVerifiedPurchase: Math.random() > 0.3,
        helpfulCount: Math.floor(Math.random() * 20),
      });
    }
  }

  await Review.create(reviewsData);
  console.log(`✅ Created ${reviewsData.length} reviews`);
}

async function seedOrders(products: any[], users: any[], admins: { admin: any; superAdmin: any }): Promise<void> {
  console.log('📋 Seeding orders...');

  const statuses: Array<'new' | 'accepted' | 'in_progress' | 'out_for_delivery' | 'delivered' | 'cancelled'> = [
    'new',
    'accepted',
    'in_progress',
    'out_for_delivery',
    'delivered',
    'cancelled',
  ];

  const ordersData = [];

  for (let i = 0; i < 20; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const selectedProducts = products.sort(() => 0.5 - Math.random()).slice(0, itemCount);

    const items = selectedProducts.map((product: any) => ({
      productId: product._id,
      title: product.title,
      sku: product.sku,
      price: product.price,
      quantity: Math.floor(Math.random() * 2) + 1,
      image: product.images[0]?.url,
    }));

    const subtotal = items.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);
    const shippingCost = subtotal > 2000 ? 0 : 50;
    const discount = Math.random() > 0.7 ? Math.floor(subtotal * 0.1) : 0;
    const total = subtotal + shippingCost - discount;

    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const statusHistory: Array<{
      status: 'new' | 'accepted' | 'in_progress' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'failed';
      timestamp: Date;
      updatedBy: any;
      note?: string;
    }> = [
      {
        status: 'new',
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
        updatedBy: user._id,
      },
    ];

    if (status !== 'new') {
      const statusOrder = ['accepted', 'in_progress', 'out_for_delivery', 'delivered'];
      const cancelledIndex = statusOrder.indexOf(status);

      for (let j = 0; j <= cancelledIndex && j < statusOrder.length; j++) {
        if (status === 'cancelled' && j === cancelledIndex) {
          statusHistory.push({
            status: 'cancelled' as const,
            timestamp: new Date(Date.now() - Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000)),
            updatedBy: admins.admin._id,
          });
        } else if (statusOrder[j]) {
          statusHistory.push({
            status: statusOrder[j] as any,
            timestamp: new Date(Date.now() - Math.floor(Math.random() * (7 - j) * 24 * 60 * 60 * 1000)),
            updatedBy: admins.admin._id,
          });
        }
      }
    }

    ordersData.push({
      userId: user._id,
      items,
      subtotal,
      shippingCost,
      discount,
      discountCode: discount > 0 ? 'WELCOME10' : undefined,
      total,
      status,
      statusHistory,
      paymentMethod: Math.random() > 0.5 ? 'cash_on_delivery' : 'card',
      paymentStatus: status === 'delivered' ? 'paid' : status === 'cancelled' ? 'refunded' : 'pending',
      shippingAddress: {
        fullName: `${user.firstName} ${user.lastName}`,
        phone: user.phone || '+201234567890',
        email: user.email,
        fullAddress: user.addresses?.[0]?.fullAddress || '123 Sample Street',
        city: user.addresses?.[0]?.city || 'Cairo',
        area: user.addresses?.[0]?.area || 'Maadi',
      },
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      deliveredAt: status === 'delivered' ? new Date() : undefined,
      cancelledAt: status === 'cancelled' ? new Date() : undefined,
      cancelReason: status === 'cancelled' ? 'Customer requested cancellation' : undefined,
    });
  }

  await Order.create(ordersData);
  console.log(`✅ Created ${ordersData.length} orders`);
}

async function seedOffers(): Promise<void> {
  console.log('🏷️  Seeding offers...');

  const offers = await Offer.create([
    {
      title: 'Welcome Discount',
      description: 'Get 10% off your first order',
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      maxDiscount: 500,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      title: 'Summer Sale',
      description: 'Flat SAR 200 off on orders above SAR 5000',
      code: 'SUMMER200',
      type: 'fixed',
      value: 200,
      minOrderAmount: 5000,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      title: 'Weekend Special',
      description: '15% off on selected categories',
      code: 'WEEKEND15',
      type: 'percentage',
      value: 15,
      maxDiscount: 1000,
      usageLimit: 100,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  ]);

  console.log(`✅ Created ${offers.length} offers`);
}

async function seedBrands(): Promise<void> {
  console.log('🏷️  Seeding brands...');

  const brands = await Brand.create([
    {
      name: 'Samsung',
      logo: '/images/brands/samsung.svg',
      description: 'Global leader in electronics and home appliances, known for innovation and cutting-edge technology.',
      website: 'https://www.samsung.com',
      isActive: true,
      productCount: 2,
    },
    {
      name: 'LG',
      logo: '/images/brands/lg.png',
      description: 'South Korean electronics giant delivering quality home appliances and entertainment systems.',
      website: 'https://www.lg.com',
      isActive: true,
      productCount: 2,
    },
    {
      name: 'Bosch',
      logo: '/images/brands/bosch.svg',
      description: 'German engineering excellence in home appliances, known for durability and precision.',
      website: 'https://www.bosch-home.com',
      isActive: true,
      productCount: 1,
    },
    {
      name: 'Carrier',
      logo: '/images/brands/carrier.svg',
      description: 'World leader in air conditioning and climate control solutions for over a century.',
      website: 'https://www.carrier.com',
      isActive: true,
      productCount: 1,
    },
    {
      name: 'Dyson',
      logo: '/images/brands/dyson.webp',
      description: 'British technology company pioneering innovative vacuum cleaners and home care products.',
      website: 'https://www.dyson.com',
      isActive: true,
      productCount: 1,
    },
    {
      name: 'Panasonic',
      logo: '/images/brands/panasonic.png',
      description: 'Japanese multinational delivering reliable and innovative electronics and home appliances.',
      website: 'https://www.panasonic.com',
      isActive: true,
      productCount: 1,
    },
    {
      name: "De'Longhi",
      logo: '/images/brands/delonghi.png',
      description: 'Italian brand renowned for premium espresso machines and kitchen appliances.',
      website: 'https://www.delonghi.com',
      isActive: true,
      productCount: 1,
    },
    {
      name: 'Vitamix',
      description: 'American manufacturer of premium high-performance blending equipment since 1921.',
      website: 'https://www.vitamix.com',
      isActive: true,
      productCount: 1,
    },
    {
      name: 'Philips',
      logo: '/images/brands/philips.png',
      description: 'Dutch technology company specializing in health, consumer lifestyle, and lighting products.',
      website: 'https://www.philips.com',
      isActive: true,
      productCount: 0,
    },
    {
      name: 'Braun',
      logo: '/images/brands/braun.png',
      description: 'German consumer products company known for small kitchen and personal care appliances.',
      website: 'https://www.braun-household.com',
      isActive: true,
      productCount: 0,
    },
    {
      name: 'Kenwood',
      logo: '/images/brands/kenwood.svg',
      description: 'British kitchen appliance brand famous for stand mixers and food preparation products.',
      website: 'https://www.kenwoodworld.com',
      isActive: true,
      productCount: 0,
    },
    {
      name: 'Tefal',
      logo: '/images/brands/tefal.png',
      description: 'French cookware and small appliance company, pioneer of non-stick cooking.',
      website: 'https://www.tefal.com',
      isActive: true,
      productCount: 0,
    },
    {
      name: 'Bissell',
      logo: '/images/brands/bissell.png',
      description: 'American cleaning products company specializing in vacuum cleaners and carpet care.',
      website: 'https://www.bissell.com',
      isActive: true,
      productCount: 0,
    },
    {
      name: 'Ninja',
      logo: '/images/brands/ninja.webp',
      description: 'Innovative kitchen appliance brand known for blenders, food processors, and cooking systems.',
      website: 'https://www.ninjakitchen.com',
      isActive: true,
      productCount: 0,
    },
    {
      name: 'Black & Decker',
      logo: '/images/brands/blackanddecker.webp',
      description: 'Trusted American brand for power tools, home appliances, and outdoor products.',
      website: 'https://www.blackanddecker.com',
      isActive: true,
      productCount: 0,
    },
  ]);

  console.log(`✅ Created ${brands.length} brands`);
}

async function seedBanners(): Promise<void> {
  console.log('🖼️  Seeding banners...');

  const banners = await Banner.create([
    {
      title: 'Summer Sale - Up to 30% Off',
      subtitle: 'Cool deals on air conditioners and fans',
      image: bannerImages[0],
      link: '/products?category=climate-control',
      position: 'hero_main',
      order: 1,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      title: 'New Arrivals',
      subtitle: 'Check out the latest home appliances',
      image: bannerImages[1],
      link: '/products?sort=newest',
      position: 'hero_secondary',
      order: 2,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
    {
      title: 'Free Shipping',
      subtitle: 'On orders over SAR 2000',
      image: bannerImages[2],
      link: '/products',
      position: 'home_middle',
      order: 1,
      isActive: true,
    },
  ]);

  console.log(`✅ Created ${banners.length} banners`);
}

async function seedBlog(authorId: mongoose.Types.ObjectId): Promise<void> {
  console.log('📝 Seeding blog posts...');

  const posts = await BlogPost.create([
    {
      title: 'How to Choose the Perfect Refrigerator for Your Home',
      slug: 'how-to-choose-perfect-refrigerator',
      excerpt: 'A comprehensive guide to selecting the right refrigerator based on size, features, and energy efficiency.',
      authorId,
      content: `
# How to Choose the Perfect Refrigerator for Your Home

Choosing a refrigerator is an important decision that will affect your daily life for years to come. Here's what you need to consider:

## 1. Size Matters
Measure your space carefully, including doorways and the area where the fridge will sit. Don't forget to account for door swing clearance.

## 2. Capacity
A general rule is 4-6 cubic feet per adult in your household. Families typically need 18-25 cubic feet.

## 3. Configuration
- **French Door**: Best for wide kitchens, eye-level fresh food storage
- **Side-by-Side**: Good for narrow spaces, easy access to both compartments
- **Top Freezer**: Most economical, traditional design
- **Bottom Freezer**: Fresh food at eye level, freezer at bottom

## 4. Energy Efficiency
Look for ENERGY STAR certification. A more efficient fridge saves money long-term despite higher upfront costs.

## 5. Features to Consider
- Ice maker and water dispenser
- Smart connectivity
- Adjustable shelving
- Door-in-door design
- Temperature-controlled drawers
      `,
      image: blogImages[0],
      author: 'PRIMO Team',
      tags: ['refrigerator', 'buying-guide', 'home-appliances'],
      status: 'published',
      publishedAt: new Date(),
    },
    {
      title: '10 Tips for Maintaining Your Home Appliances',
      slug: 'tips-maintaining-home-appliances',
      excerpt: 'Keep your appliances running smoothly with these essential maintenance tips.',
      authorId,
      content: `
# 10 Tips for Maintaining Your Home Appliances

Regular maintenance can extend the life of your appliances and keep them running efficiently.

## 1. Clean Refrigerator Coils
Dirty coils make your fridge work harder. Clean them every 6-12 months.

## 2. Descale Your Coffee Maker
Mineral buildup affects taste and performance. Descale monthly with vinegar or a commercial descaler.

## 3. Clean the Dryer Vent
A clogged dryer vent is a fire hazard. Clean it at least once a year.

## 4. Check Washing Machine Hoses
Inspect for cracks or bulges and replace every 3-5 years.

## 5. Clean the Dishwasher Filter
Remove food particles monthly for optimal performance.

## 6. Replace HVAC Filters
Change every 1-3 months for better air quality and efficiency.

## 7. Clean the Microwave Interior
Wipe down after spills and deep clean weekly.

## 8. Vacuum Refrigerator Door Seals
Keep seals clean for proper closure and efficiency.

## 9. Run Empty Dishwasher with Vinegar
Monthly cleaning prevents odors and buildup.

## 10. Schedule Professional Maintenance
Annual checkups for major appliances can prevent costly repairs.
      `,
      image: blogImages[1],
      author: 'PRIMO Team',
      tags: ['maintenance', 'tips', 'home-appliances'],
      status: 'published',
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Smart Home Appliances: Are They Worth It?',
      slug: 'smart-home-appliances-worth-it',
      excerpt: 'Exploring the benefits and drawbacks of connected home appliances.',
      authorId,
      content: `
# Smart Home Appliances: Are They Worth It?

Smart appliances promise convenience, but are they really worth the premium price?

## The Benefits

### Remote Control
Start your robot vacuum from work, preheat your oven on your way home, or check if you left the refrigerator door open.

### Energy Monitoring
Track energy usage and optimize settings to reduce bills.

### Maintenance Alerts
Get notified when filters need changing or when something isn't working properly.

### Integration
Work with voice assistants and create automated routines.

## The Drawbacks

### Cost
Smart versions typically cost 20-50% more than standard models.

### Complexity
More technology means more potential points of failure.

### Privacy Concerns
Connected devices collect data about your usage patterns.

### Dependency on Apps
Features may become unavailable if the manufacturer stops supporting the app.

## Our Verdict

Smart appliances make sense for frequently used items where remote control adds real convenience. Start with a smart thermostat or robot vacuum before investing in a connected refrigerator.
      `,
      image: blogImages[2],
      author: 'PRIMO Team',
      tags: ['smart-home', 'technology', 'buying-guide'],
      status: 'published',
      publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
  ]);

  console.log(`✅ Created ${posts.length} blog posts`);
}

async function seedCMS(updatedBy: mongoose.Types.ObjectId): Promise<void> {
  console.log('📄 Seeding CMS content...');

  const cms = await CMSContent.create([
    {
      key: 'about',
      type: 'html',
      updatedBy,
      value: `
# About PRIMO

**PRIMO** is Saudi Arabia's premier destination for premium home appliances. Founded with a vision to bring the world's best appliances to Saudi homes, we've grown to become a trusted name in quality and service.

## Our Mission

To provide Saudi families with access to the finest home appliances, backed by exceptional customer service and expert guidance.

## Our Values

- **Quality First**: We partner only with trusted global brands
- **Customer Focus**: Your satisfaction is our priority
- **Expert Guidance**: Our team helps you make informed decisions
- **Reliable Service**: From delivery to after-sales support

## Why Choose PRIMO?

- Curated selection of premium brands
- Competitive prices with price match guarantee
- Free delivery on orders over SAR 2000
- Professional installation services
- Extended warranty options
- Dedicated customer support

Visit our showroom or browse online to discover the perfect appliances for your home.
      `,
    },
    {
      key: 'privacy-policy',
      type: 'html',
      updatedBy,
      value: `
# Privacy Policy

Last updated: ${new Date().toLocaleDateString()}

## Information We Collect

We collect information you provide directly, including:
- Name, email, phone number
- Shipping and billing addresses
- Payment information
- Order history

## How We Use Your Information

We use your information to:
- Process and fulfill orders
- Send order confirmations and updates
- Provide customer support
- Send marketing communications (with your consent)
- Improve our services

## Data Security

We implement industry-standard security measures to protect your data. Payment information is processed securely through our payment partners.

## Your Rights

You have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your data
- Opt-out of marketing communications

## Contact Us

For privacy-related inquiries, contact us at privacy@primo.com
      `,
    },
    {
      key: 'terms-conditions',
      type: 'html',
      updatedBy,
      value: `
# Terms & Conditions

## General

By using PRIMO's website and services, you agree to these terms and conditions.

## Orders

- All orders are subject to availability
- Prices are in Saudi Riyals (SAR) and include VAT
- We reserve the right to cancel orders due to pricing errors

## Delivery

- Standard delivery: 3-5 business days
- Express delivery available for select areas
- Free delivery on orders over SAR 2000

## Returns

- 14-day return policy for unopened items
- Items must be in original packaging
- Defective items will be replaced or refunded

## Warranty

- All products come with manufacturer warranty
- Extended warranty options available at checkout
- Warranty claims handled through our service center

## Limitation of Liability

PRIMO is not liable for indirect, incidental, or consequential damages arising from the use of our products or services.
      `,
    },
    {
      key: 'return-policy',
      type: 'html',
      updatedBy,
      value: `
# Return Policy

## Return Window

You have 14 days from delivery to return eligible items.

## Eligibility

Items must be:
- Unopened in original packaging, OR
- Defective or damaged on arrival

## Non-Returnable Items

- Installed appliances (once installed)
- Items without original packaging
- Items damaged by customer use

## How to Return

1. Contact customer service to initiate return
2. Receive return authorization number
3. Pack item securely in original packaging
4. Schedule pickup or drop off at our location

## Refunds

- Refunds processed within 7-10 business days
- Original shipping fees non-refundable
- Refund issued to original payment method
      `,
    },
    {
      key: 'shipping-info',
      type: 'html',
      updatedBy,
      value: `
# Shipping Information

## Delivery Areas

We deliver across Saudi Arabia, including:
- Riyadh (1-2 business days)
- Jeddah (1-2 business days)
- Dammam / Eastern Province (2-3 business days)
- Other cities (3-5 business days)

## Shipping Costs

- Orders over SAR 2,000: FREE delivery
- Orders under SAR 2,000: SAR 25 flat rate

## Large Appliances

Large appliances (refrigerators, washing machines, etc.) include:
- White glove delivery to room of choice
- Unboxing and inspection
- Removal of packaging materials
- Basic setup (leveling, connecting to power)

## Installation Services

Professional installation available for:
- Air conditioners
- Built-in appliances
- Complex setups

Installation fees vary by product and location.

## Tracking Your Order

Track your order status:
- In your account dashboard
- Via email updates
- By contacting customer service
      `,
    },
  ]);

  console.log(`✅ Created ${cms.length} CMS pages`);
}

async function main(): Promise<void> {
  console.log('\n🌱 PRIMO Database Seed Script\n');
  console.log('================================\n');

  try {
    // Connect to database
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    await clearDatabase();

    // Seed data
    const { superAdmin, admin, users } = await seedUsers();
    const categories = await seedCategories();
    const products = await seedProducts(categories);
    await seedReviews(products, users);
    await seedOrders(products, users, { admin, superAdmin });
    await seedOffers();
    await seedBrands();
    await seedBanners();
    await seedBlog(superAdmin._id);
    await seedCMS(superAdmin._id);

    console.log('\n================================');
    console.log('✅ Database seeded successfully!\n');
    console.log('Demo Accounts:');
    console.log('--------------------------------');
    console.log('Super Admin: admin@primo.com / admin123');
    console.log('Admin: staff@primo.com / staff123');
    console.log('User: user@primo.com / user123');
    console.log('================================\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

main();
