// ============================================
// PRIMO API - Add Blog Posts and Banners Script
// ============================================

import mongoose from 'mongoose';
import { config } from '../config';
import { User } from '../models/User';
import { Banner } from '../models/Banner';
import { BlogPost, BlogCategory } from '../models/Blog';

const blogImages = [
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
  'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=800',
];

const bannerImages = [
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600',
];

async function main(): Promise<void> {
  console.log('\n🌱 Adding Blog Posts and Banners\n');

  try {
    // Connect to database
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get super admin user for authorId
    const superAdmin = await User.findOne({ role: 'super_admin' });
    if (!superAdmin) {
      console.log('❌ No super admin found. Run the main seed script first.');
      process.exit(1);
    }

    // Delete existing banners
    console.log('🗑️  Deleting existing banners...');
    await Banner.deleteMany({});
    console.log('✅ Banners deleted');

    // Create new banners with hero_main position
    console.log('🖼️  Creating new banners...');
    const banners = await Banner.create([
      {
        title: 'Premium Home Appliances',
        subtitle: 'Up to 30% Off Summer Sale',
        image: bannerImages[0],
        link: '/products',
        linkText: 'Shop Now',
        position: 'hero_main',
        order: 1,
        isActive: true,
      },
      {
        title: 'Smart Kitchen Solutions',
        subtitle: 'Transform Your Cooking Experience',
        image: bannerImages[1],
        link: '/categories/small-appliances',
        linkText: 'Explore Kitchen',
        position: 'hero_main',
        order: 2,
        isActive: true,
      },
    ]);
    console.log(`✅ Created ${banners.length} banners`);

    // Check existing blog posts
    const existingPosts = await BlogPost.countDocuments();
    console.log(`📝 Found ${existingPosts} existing blog posts`);

    if (existingPosts === 0) {
      // Create blog posts
      console.log('📝 Creating blog posts...');
      const posts = await BlogPost.create([
        {
          title: 'How to Choose the Perfect Refrigerator for Your Home',
          excerpt: 'A comprehensive guide to selecting the right refrigerator based on size, features, and energy efficiency.',
          authorId: superAdmin._id,
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
          featuredImage: blogImages[0],
          tags: ['refrigerator', 'buying-guide', 'home-appliances'],
          isPublished: true,
          publishedAt: new Date(),
        },
        {
          title: '10 Tips for Maintaining Your Home Appliances',
          excerpt: 'Keep your appliances running smoothly with these essential maintenance tips.',
          authorId: superAdmin._id,
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
          featuredImage: blogImages[1],
          tags: ['maintenance', 'tips', 'home-appliances'],
          isPublished: true,
          publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      ]);
      console.log(`✅ Created ${posts.length} blog posts`);
    } else {
      console.log('ℹ️  Blog posts already exist, skipping creation');
    }

    console.log('\n================================');
    console.log('✅ Content added successfully!');
    console.log('================================\n');
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

main();
