// ============================================
// PRIMO API - Blog Seed (buying guides)
// ============================================
// The blog page had zero posts, so it rendered an empty shell. These are real
// buying guides for the Saudi home-appliance market — the kind of content that
// earns organic search traffic and gives the storefront something to cross-link
// products from.
//
// Run with: npm run seed:blog   (or: npx tsx src/scripts/seed-blog.ts)
// ============================================

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { BlogCategory, BlogPost } from '../models/Blog';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { User } from '../models/User';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/primo';

interface PostSeed {
  title: string;
  category: string;
  excerpt: string;
  /** Cover is taken from a real product in this subcategory. */
  imageFromSubcategory: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  content: string;
}

const CATEGORIES = [
  { name: 'Buying Guides', description: 'How to choose the right appliance for your home.' },
  { name: 'Care & Maintenance', description: 'Keep your appliances running like new.' },
  { name: 'Energy & Savings', description: 'Cut your electricity bill without cutting comfort.' },
];

const POSTS: PostSeed[] = [
  {
    title: 'How to Choose the Right Refrigerator for Your Home',
    category: 'Buying Guides',
    excerpt:
      'Capacity, cooling technology, and energy rating matter more than brand. Here is how to pick a fridge that fits your kitchen and your family.',
    imageFromSubcategory: 'Refrigerators',
    tags: ['refrigerators', 'buying guide', 'kitchen'],
    metaTitle: 'How to Choose a Refrigerator — Size, Type & Energy Guide',
    metaDescription:
      'A practical refrigerator buying guide for Saudi homes: capacity per family size, inverter vs conventional compressors, and what the energy label really means.',
    content: `
<h2>Start with capacity, not price</h2>
<p>The most common mistake is buying a fridge that is too small and then living with an overstuffed shelf for the next ten years. As a rule of thumb, allow roughly <strong>100–150 litres for the first two people</strong>, then add about <strong>50 litres per additional person</strong>.</p>
<ul>
  <li><strong>1–2 people:</strong> 200–300 L</li>
  <li><strong>3–4 people:</strong> 300–450 L</li>
  <li><strong>5+ people:</strong> 500 L and above</li>
</ul>

<h2>Choose the door layout that matches how you cook</h2>
<p><strong>Top-mount freezer</strong> models are the most affordable and the most space-efficient. <strong>Side-by-side</strong> units give you tall, narrow compartments — excellent for frozen goods, less friendly to a wide platter. <strong>French door</strong> models put fresh food at eye level and are the best choice if you shop fresh more often than frozen.</p>

<h2>Inverter compressors are worth the premium</h2>
<p>A conventional compressor runs at full power then switches off. An <strong>inverter compressor</strong> varies its speed to hold a steady temperature, which means less noise, more stable cooling, and noticeably lower running costs. In a climate where the fridge works hard year-round, the price difference usually pays for itself.</p>

<h2>Read the energy label properly</h2>
<p>The Saudi Energy Efficiency label gives a star rating and an estimated annual consumption in kWh. Compare the <strong>kWh figure</strong>, not just the stars — two fridges with the same rating can differ meaningfully once capacity is taken into account.</p>

<h2>Do not forget the installation clearances</h2>
<p>Leave at least <strong>5 cm at the back and sides</strong> and around 10 cm above for heat to escape. Measure your doorway too — a 90 cm wide fridge will not pass through an 85 cm door.</p>

<h2>Quick checklist before you buy</h2>
<ol>
  <li>Measure the alcove <em>and</em> the route into the kitchen.</li>
  <li>Match capacity to household size.</li>
  <li>Prefer an inverter compressor.</li>
  <li>Compare annual kWh, not just star count.</li>
  <li>Check the compressor warranty — 10 years is common on good units.</li>
</ol>
`.trim(),
  },
  {
    title: 'Front Load vs Top Load Washing Machines: Which Should You Buy?',
    category: 'Buying Guides',
    excerpt:
      'Front loaders wash better and use less water. Top loaders are cheaper and easier on your back. Here is the honest trade-off.',
    imageFromSubcategory: 'Washing Machines',
    tags: ['washing machines', 'laundry', 'buying guide'],
    metaTitle: 'Front Load vs Top Load Washing Machine — Full Comparison',
    metaDescription:
      'Compare front load and top load washing machines on wash quality, water use, running cost, cycle time and maintenance to decide which suits your home.',
    content: `
<h2>The short answer</h2>
<p>If you want the <strong>best wash quality and the lowest running costs</strong>, buy a front loader. If you want the <strong>lowest purchase price and the shortest cycles</strong>, buy a top loader.</p>

<h2>Wash performance and fabric care</h2>
<p>Front loaders tumble clothes through the water instead of dragging them around an agitator. That is gentler on fabric and generally cleans better, particularly on heavier loads. Top loaders are more aggressive, which is fine for durable cottons but harder on delicates.</p>

<h2>Water and electricity</h2>
<p>A front loader typically uses <strong>substantially less water per cycle</strong> because the drum only partially fills. Less water also means less water to heat, which is where most of the electricity in a wash cycle actually goes.</p>

<h2>Cycle time is the real trade-off</h2>
<p>Front loaders take longer — a standard cotton cycle can run well over an hour, versus roughly 40 minutes on many top loaders. If you do several loads back to back, that difference adds up.</p>

<h2>Maintenance matters more on front loaders</h2>
<p>The door gasket on a front loader traps moisture. Leave the door ajar between washes, wipe the seal occasionally, and run a hot maintenance cycle monthly to prevent odours. Top loaders are far more forgiving here.</p>

<h2>Capacity guidance</h2>
<ul>
  <li><strong>1–2 people:</strong> 6–7 kg</li>
  <li><strong>3–4 people:</strong> 8–9 kg</li>
  <li><strong>5+ people or bulky bedding:</strong> 10 kg and above</li>
</ul>

<h2>Verdict</h2>
<p>For most households buying a machine they intend to keep for a decade, a front loader with an inverter motor is the better long-term purchase. Choose a top loader if budget is tight, cycle speed matters, or loading height is a physical concern.</p>
`.trim(),
  },
  {
    title: 'Split AC Buying Guide for Saudi Summers',
    category: 'Buying Guides',
    excerpt:
      'BTU sizing, inverter vs non-inverter, and the maintenance habits that keep an air conditioner efficient through a 45°C afternoon.',
    imageFromSubcategory: 'Air Conditioners',
    tags: ['air conditioners', 'cooling', 'buying guide'],
    metaTitle: 'Split AC Buying Guide — BTU Sizing & Inverter Technology',
    metaDescription:
      'How to size a split air conditioner in BTU for your room, why inverter units cut running costs in Saudi summers, and the maintenance that preserves efficiency.',
    content: `
<h2>Size it in BTU before anything else</h2>
<p>An undersized unit runs constantly and never quite cools; an oversized one short-cycles, leaving the room cold but humid. A reasonable starting point is <strong>600–700 BTU per square metre</strong> in a hot climate, adjusted upward for direct sun, poor insulation, large windows or a top-floor room.</p>
<ul>
  <li><strong>Up to 18 m²:</strong> ~12,000 BTU (1 ton)</li>
  <li><strong>18–28 m²:</strong> ~18,000 BTU (1.5 ton)</li>
  <li><strong>28–40 m²:</strong> ~24,000 BTU (2 ton)</li>
</ul>

<h2>Inverter units are the default choice here</h2>
<p>A non-inverter compressor is either fully on or fully off. An <strong>inverter</strong> modulates its speed, holding the target temperature instead of overshooting it. In a climate where the AC runs for most of the year, the reduction in electricity consumption is the single biggest factor in total cost of ownership.</p>

<h2>Look for a high SEER</h2>
<p>SEER measures cooling delivered per unit of energy across a season. A higher SEER costs more up front and less every month. Given how long the cooling season lasts in the Kingdom, prioritise it.</p>

<h2>Installation quality decides real-world performance</h2>
<p>More units underperform because of poor installation than because of poor specification. Insist on correct refrigerant charge, properly insulated line sets, a short pipe run where possible, and an outdoor unit mounted in shade with clear airflow.</p>

<h2>Maintenance that actually matters</h2>
<ol>
  <li>Clean or rinse the indoor filters <strong>every 2–4 weeks</strong> during heavy use — a clogged filter is the most common cause of weak cooling.</li>
  <li>Keep the outdoor condenser clear of dust and sand.</li>
  <li>Have the refrigerant and coils checked annually before summer.</li>
</ol>
`.trim(),
  },
  {
    title: 'Air Fryer vs Convection Oven: What Is the Real Difference?',
    category: 'Buying Guides',
    excerpt:
      'They cook using the same principle. The difference is size, speed and how often you will actually use them.',
    imageFromSubcategory: 'Air Fryers',
    tags: ['air fryers', 'kitchen appliances', 'cooking'],
    metaTitle: 'Air Fryer vs Convection Oven — Which Do You Actually Need?',
    metaDescription:
      'An air fryer is a compact, fast convection oven. Compare capacity, preheat time, crispiness and energy use to decide which belongs on your counter.',
    content: `
<h2>They are the same technology at different scales</h2>
<p>An air fryer is, functionally, <strong>a small convection oven with an aggressive fan</strong>. Both circulate hot air; the air fryer just does it in a much smaller chamber, which is why it preheats in a couple of minutes and crisps food faster.</p>

<h2>Where the air fryer wins</h2>
<ul>
  <li><strong>Speed:</strong> minimal preheat, shorter cook times.</li>
  <li><strong>Crispiness:</strong> the compact basket and high airflow produce a better crust on chips, wings and frozen foods.</li>
  <li><strong>Energy:</strong> heating a small chamber costs far less than heating a full oven for a portion or two.</li>
</ul>

<h2>Where the convection oven wins</h2>
<ul>
  <li><strong>Capacity:</strong> a whole tray, a roast, or a family-sized bake.</li>
  <li><strong>Even results across a large batch.</strong></li>
  <li><strong>Versatility:</strong> baking, roasting and grilling in one appliance.</li>
</ul>

<h2>Choosing a capacity</h2>
<p>Air fryer baskets are usually quoted in litres. Around <strong>3–4 L</strong> suits one or two people; <strong>5–7 L</strong> covers a family of four; above 7 L you are into dual-basket or oven-style models.</p>

<h2>Practical verdict</h2>
<p>If you cook small portions frequently and value speed, the air fryer will earn its counter space. If you regularly cook for four or more, the oven remains the primary appliance — and many households end up using both, for different jobs.</p>
`.trim(),
  },
  {
    title: 'Choosing an Espresso Machine for Your Home',
    category: 'Buying Guides',
    excerpt:
      'Pressure, grinder quality and milk frothing decide the cup — not the price tag. Here is what to look for.',
    imageFromSubcategory: 'Coffee Makers',
    tags: ['coffee machines', 'espresso', 'buying guide'],
    metaTitle: 'Home Espresso Machine Buying Guide — Pressure, Grinders & Frothing',
    metaDescription:
      'Manual, automatic or capsule? Understand bar pressure, grind quality, thermoblock heating and milk frothing before buying a home espresso machine.',
    content: `
<h2>Pick the type that matches your patience</h2>
<ul>
  <li><strong>Capsule machines</strong> — most consistent, least effort, highest cost per cup.</li>
  <li><strong>Semi-automatic</strong> — you control the grind and the shot. Best flavour for the money if you enjoy the process.</li>
  <li><strong>Bean-to-cup automatics</strong> — grind, brew and froth at a button press. Convenient and expensive.</li>
</ul>

<h2>Nine bars is the number that matters</h2>
<p>Proper espresso extracts at around <strong>9 bars</strong> of pressure. Machines advertising 15 or 20 bars are quoting the pump's maximum, not the pressure at the coffee puck — a higher number on the box is marketing, not quality.</p>

<h2>The grinder matters more than the machine</h2>
<p>If you are buying a semi-automatic, budget for a <strong>burr grinder</strong>. Pre-ground coffee goes stale quickly and cannot be dialled in. A modest machine with a good grinder beats an expensive machine with bad coffee, every time.</p>

<h2>Heating system</h2>
<p>A <strong>thermoblock</strong> heats quickly and suits occasional use. A <strong>boiler</strong> holds temperature more steadily and is preferable if you pull several shots in a row. Temperature stability is what separates a sweet shot from a sour one.</p>

<h2>Milk frothing</h2>
<p>A <strong>manual steam wand</strong> gives you proper microfoam and full control — the right choice for flat whites and latte art. An automatic frother is more convenient but produces stiffer, airier foam.</p>

<h2>Maintenance</h2>
<p>Descale on the schedule your water hardness demands, backflush if the machine supports it, and purge the wand immediately after every use. Neglect here is the main reason home machines fail early.</p>
`.trim(),
  },
  {
    title: 'Robot vs Cordless Vacuum: Which Cleans Your Home Better?',
    category: 'Buying Guides',
    excerpt:
      'One maintains, the other deep-cleans. Understanding that difference stops you buying the wrong one.',
    imageFromSubcategory: 'Vacuum Cleaners',
    tags: ['vacuum cleaners', 'cleaning', 'buying guide'],
    metaTitle: 'Robot vs Cordless Vacuum — A Practical Comparison',
    metaDescription:
      'Robot vacuums maintain daily cleanliness; cordless sticks deep-clean on demand. Compare suction, navigation, battery life and upkeep.',
    content: `
<h2>They solve different problems</h2>
<p>A <strong>robot vacuum</strong> is a maintenance tool: it keeps floors consistently tidy with no effort from you. A <strong>cordless stick vacuum</strong> is a cleaning tool: far more suction, and it reaches sofas, stairs, corners and the car.</p>

<h2>Robot vacuums — what to look for</h2>
<ul>
  <li><strong>LiDAR or camera navigation</strong> beats random bouncing. It maps the home, cleans in orderly rows and resumes where it stopped.</li>
  <li><strong>Self-emptying base</strong> turns emptying from a daily chore into a monthly one.</li>
  <li><strong>Mopping</strong> is useful for light dust on hard floors — it will not replace a proper mop.</li>
</ul>

<h2>Cordless vacuums — what to look for</h2>
<ul>
  <li><strong>Runtime at the power level you will actually use.</strong> Quoted maximums are usually measured on the lowest setting with a non-motorised head.</li>
  <li><strong>Removable battery</strong> — it is the first component to age, and being able to swap it doubles the useful life of the machine.</li>
  <li><strong>Sealed HEPA filtration</strong> matters if anyone in the home has allergies.</li>
</ul>

<h2>The honest recommendation</h2>
<p>If you can only buy one and you have pets, children, or mostly hard floors, start with the robot — it does the repetitive work. If you have carpets, stairs, or need genuine deep-cleaning power, start with the cordless.</p>
`.trim(),
  },
  {
    title: 'Cutting Your Electricity Bill Without Sacrificing Comfort',
    category: 'Energy & Savings',
    excerpt:
      'Air conditioning and water heating dominate a Saudi household bill. A handful of changes make a measurable difference.',
    imageFromSubcategory: 'Air Conditioners',
    tags: ['energy saving', 'efficiency', 'tips'],
    metaTitle: 'How to Reduce Your Home Electricity Bill in Saudi Arabia',
    metaDescription:
      'Practical, measurable ways to cut household electricity consumption — thermostat settings, appliance habits, maintenance and efficient replacements.',
    content: `
<h2>Cooling is where the money goes</h2>
<p>Air conditioning is the largest single line item in most Saudi households. Every degree lower on the thermostat increases consumption noticeably, so setting <strong>24°C instead of 20°C</strong> is one of the highest-impact changes available — and, with decent airflow, barely perceptible in comfort.</p>

<h2>Maintenance is free efficiency</h2>
<ul>
  <li>Clean AC filters every few weeks in summer — a blocked filter forces the unit to run longer for the same result.</li>
  <li>Keep the outdoor condenser shaded and free of dust.</li>
  <li>Vacuum the refrigerator condenser coils once or twice a year.</li>
</ul>

<h2>Use appliances at full load</h2>
<p>Washing machines and dishwashers consume nearly the same energy whether half full or full. Running full loads, and using the eco or cold programme where the soil level allows, cuts consumption without cutting cleanliness.</p>

<h2>Replace the worst offenders first</h2>
<p>A fifteen-year-old fridge or a non-inverter AC can consume several times what a modern equivalent does. When replacing, compare the <strong>annual kWh figure</strong> on the energy label rather than the star rating alone, and treat the purchase as a multi-year running-cost decision.</p>

<h2>Small habits that add up</h2>
<ol>
  <li>Let hot food cool before refrigerating it.</li>
  <li>Do not leave the fridge door open while deciding.</li>
  <li>Use the microwave or air fryer instead of the full oven for small portions.</li>
  <li>Switch off standby loads on devices you rarely use.</li>
</ol>
`.trim(),
  },
  {
    title: 'Appliance Care: Simple Habits That Add Years of Life',
    category: 'Care & Maintenance',
    excerpt:
      'Most appliances do not fail — they are neglected. A few minutes of routine care prevents the majority of service calls.',
    imageFromSubcategory: 'Washing Machines',
    tags: ['maintenance', 'care', 'tips'],
    metaTitle: 'Home Appliance Maintenance Guide — Extend Their Lifespan',
    metaDescription:
      'Routine maintenance for refrigerators, washing machines, air conditioners, dishwashers and coffee machines to prevent breakdowns and preserve efficiency.',
    content: `
<h2>Refrigerator</h2>
<ul>
  <li>Vacuum the condenser coils once or twice a year — dust there makes the compressor work harder.</li>
  <li>Check the door seal: if a sheet of paper slides out easily when closed, the gasket needs replacing.</li>
  <li>Do not block the internal vents with packed shelves; air has to circulate.</li>
</ul>

<h2>Washing machine</h2>
<ul>
  <li>Leave the door and detergent drawer ajar between washes so the drum dries.</li>
  <li>Wipe the door gasket — this is where odour and mould begin on front loaders.</li>
  <li>Run a hot maintenance cycle monthly, and clean the drain filter regularly.</li>
  <li>Use the correct detergent dose. More is not cleaner; it leaves residue.</li>
</ul>

<h2>Air conditioner</h2>
<ul>
  <li>Rinse the indoor filters every 2–4 weeks during heavy use.</li>
  <li>Keep the outdoor unit clear of sand and debris.</li>
  <li>Book a professional check before each summer.</li>
</ul>

<h2>Dishwasher</h2>
<ul>
  <li>Clean the filter at the base — it is the most-skipped and most-important step.</li>
  <li>Keep rinse aid and dishwasher salt topped up in hard-water areas.</li>
  <li>Scrape plates, but do not pre-rinse them spotless; detergent needs something to work on.</li>
</ul>

<h2>Coffee machine</h2>
<ul>
  <li>Descale on schedule — scale is the leading cause of failure in home machines.</li>
  <li>Purge and wipe the steam wand immediately after every use.</li>
  <li>Use filtered water if your supply is hard.</li>
</ul>

<h2>When to call a technician</h2>
<p>Unusual noise, burning smells, water pooling, tripping breakers, or a sudden drop in performance are not "wait and see" symptoms. Addressing them early is almost always cheaper than replacing a compressor or motor.</p>
`.trim(),
  },
];

async function main() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.\n');

  // Posts need an author — reuse an existing admin.
  const author = await User.findOne({ role: { $in: ['super_admin', 'admin'] } });
  if (!author) {
    throw new Error('No admin user found — run the main seed first so posts have an author.');
  }

  console.log('🗑️  Clearing existing blog posts and categories...');
  const delPosts = await BlogPost.deleteMany({});
  await BlogCategory.deleteMany({});
  console.log(`   Removed ${delPosts.deletedCount} posts.\n`);

  // Covers come from an actual product in the matching subcategory. Guessing
  // stock-photo IDs is how an article about air conditioners ended up with a
  // photo of a dog — the URL returned 200, but nobody verified the subject.
  console.log('🖼️  Resolving cover images from the catalogue...');
  const coverBySubcategory = new Map<string, string>();
  const subcategories = await Category.find({ parentId: { $exists: true } })
    .select('_id name')
    .lean();
  for (const sub of subcategories) {
    const product = await Product.findOne({ subcategoryId: sub._id, isActive: true })
      .select('images')
      .lean();
    const url = (product as any)?.images?.[0]?.url;
    if (url) coverBySubcategory.set((sub as any).name, url);
  }
  const coverFor = (subcategory: string): string | undefined =>
    coverBySubcategory.get(subcategory);

  console.log('📁 Creating blog categories...');
  const categoryId = new Map<string, mongoose.Types.ObjectId>();
  for (const cat of CATEGORIES) {
    const doc = new BlogCategory({ name: cat.name, description: cat.description, isActive: true });
    await doc.save(); // triggers slug generation
    categoryId.set(cat.name, doc._id);
    console.log(`   + ${cat.name}`);
  }

  console.log('\n📝 Creating posts...');
  let created = 0;
  // Spread publish dates over the last ~4 months so the blog looks maintained.
  let daysAgo = 7;

  for (const p of POSTS) {
    const publishedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const post = new BlogPost({
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      featuredImage: coverFor(p.imageFromSubcategory),
      categoryId: categoryId.get(p.category),
      tags: p.tags,
      authorId: author._id,
      isPublished: true,
      publishedAt,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      viewCount: Math.floor(Math.random() * 900) + 60,
    });
    await post.save(); // triggers slug generation
    created++;
    daysAgo += Math.floor(Math.random() * 12) + 8;
    console.log(`   + ${p.title}`);
  }

  console.log('\n🎉 Done!');
  console.log(`   Categories: ${CATEGORIES.length}`);
  console.log(`   Posts:      ${created} (all published, all with cover images)\n`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
