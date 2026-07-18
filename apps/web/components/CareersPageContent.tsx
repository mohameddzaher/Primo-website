'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { cmsApi } from '@/lib/api';

const fallbackContent = `
<h2>Join Our Team</h2>
<p>At PRIMO, we're building the future of home appliance e-commerce in Saudi Arabia. We're looking for passionate, talented individuals who want to make a real impact.</p>

<h2>Why Work at PRIMO?</h2>
<ul>
<li><strong>Growth Opportunity</strong> - Join a fast-growing startup and grow your career with us</li>
<li><strong>Dynamic Environment</strong> - Work in an innovative and fast-paced setting</li>
<li><strong>Team Culture</strong> - Collaborate with a passionate and supportive team</li>
<li><strong>Competitive Benefits</strong> - Attractive salary packages and employee discounts</li>
<li><strong>Learning & Development</strong> - Continuous learning opportunities and professional development</li>
</ul>

<h2>Our Values</h2>
<p>We believe in putting customers first, embracing innovation, and fostering a culture of excellence and collaboration. Every team member plays a vital role in our mission to make premium home appliances accessible to everyone.</p>

<h2>Open Positions</h2>
<p>We're always looking for talented people to join our team. Even if there are no specific openings listed, we'd love to hear from you.</p>

<h3>How to Apply</h3>
<p>Send your resume and a brief cover letter to <a href="mailto:careers@primo.com">careers@primo.com</a>. Tell us about yourself and why you'd be a great fit for PRIMO.</p>

<h2>Departments We Hire For</h2>
<ul>
<li><strong>Engineering</strong> - Frontend, Backend, Mobile, DevOps</li>
<li><strong>Marketing</strong> - Digital Marketing, Content, Social Media, SEO</li>
<li><strong>Operations</strong> - Logistics, Supply Chain, Customer Service</li>
<li><strong>Business Development</strong> - Partnerships, Brand Relations</li>
<li><strong>Design</strong> - UI/UX, Product Design, Graphic Design</li>
</ul>

<h2>Contact Us</h2>
<p>For career inquiries, reach out to us at <a href="mailto:careers@primo.com">careers@primo.com</a>. We look forward to hearing from you!</p>
`;

export default function CareersPageContent() {
  const { data: content } = useQuery({
    queryKey: ['cms', 'careers'],
    queryFn: async () => {
      try {
        const data = await cmsApi.getContent('careers');
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
            Careers at PRIMO
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-dark-500 max-w-2xl mx-auto"
          >
            Join our team and help us deliver premium home appliances to customers across the region.
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
