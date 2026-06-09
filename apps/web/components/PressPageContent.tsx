'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { cmsApi } from '@/lib/api';

const fallbackContent = `
<h2>About PRIMO</h2>
<p>PRIMO is a leading e-commerce platform specializing in premium home appliances in Egypt. Founded in 2020, we partner with over 100 trusted brands to deliver quality kitchen appliances, coffee machines, small appliances, and home essentials to customers across the country.</p>

<h2>Company Facts</h2>
<ul>
<li><strong>Founded:</strong> 2020</li>
<li><strong>Headquarters:</strong> Cairo, Egypt</li>
<li><strong>Team Size:</strong> 50+ employees</li>
<li><strong>Products:</strong> 10,000+ SKUs</li>
<li><strong>Brands:</strong> 100+ trusted partners</li>
<li><strong>Customers:</strong> 50,000+ happy customers</li>
</ul>

<h2>Our Mission</h2>
<p>To make premium home appliances accessible and affordable for every household in Egypt, providing exceptional customer service and a seamless shopping experience.</p>

<h2>Press Releases</h2>
<p>For the latest news and announcements from PRIMO, follow us on our social media channels or subscribe to our newsletter.</p>

<h2>Media Resources</h2>
<p>For press kits, brand assets, and high-resolution logos, please contact our communications team. We're happy to provide materials for editorial use.</p>

<h2>Press Inquiries</h2>
<p>Members of the media are welcome to reach out for:</p>
<ul>
<li>Interview requests with our leadership team</li>
<li>Product information and reviews</li>
<li>Partnership announcements</li>
<li>Company milestones and updates</li>
<li>Industry insights and commentary</li>
</ul>

<h2>Contact Our Press Team</h2>
<p>For all press and media inquiries, please contact us at <a href="mailto:press@primo.com">press@primo.com</a>. We aim to respond to all media requests within 24 hours.</p>
`;

export default function PressPageContent() {
  const { data: content } = useQuery({
    queryKey: ['cms', 'press'],
    queryFn: async () => {
      try {
        const data = await cmsApi.getContent('press');
        return data;
      } catch {
        return null;
      }
    },
  });

  const htmlContent = content?.value || fallbackContent;

  return (
    <div className="min-h-screen bg-beige-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-display font-semibold text-dark-900 mb-3"
          >
            Press & Media
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-dark-500 max-w-2xl mx-auto"
          >
            Latest news and media resources from PRIMO.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 md:p-8 shadow-sm prose prose-sm max-w-none prose-headings:text-dark-900 prose-p:text-dark-600 prose-a:text-primary-600 prose-li:text-dark-600"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
}
