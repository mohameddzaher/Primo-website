"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
} from "react-icons/hi";
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaWhatsapp,
  FaYoutube,
  FaLinkedinIn,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { categoriesApi } from "@/lib/api";
import { useSettings } from "@/lib/settings-context";

const supportLinks = [
  { name: "Contact Us", href: "/contact" },
  { name: "FAQs", href: "/faq" },
  { name: "Track Order", href: "/track-order" },
  { name: "Shipping Info", href: "/shipping" },
  { name: "Returns & Exchanges", href: "/returns" },
  { name: "Warranty", href: "/warranty" },
];

const companyLinks = [
  { name: "About Us", href: "/about" },
  { name: "Blog", href: "/blog" },
  { name: "Careers", href: "/careers" },
  { name: "Press", href: "/press" },
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms of Service", href: "/terms" },
];

export function Footer() {
  const { settings } = useSettings();

  const [shopLinks, setShopLinks] = useState([
    { name: "All Products", href: "/products" },
    { name: "Special Deals", href: "/products?onSale=true" },
  ]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await categoriesApi.getAll();
        const parentCategories = (categories || [])
          .filter((cat: any) => !cat.parentId)
          .slice(0, 4);

        const dynamicLinks = [
          { name: "All Products", href: "/products" },
          ...parentCategories.map((cat: any) => ({
            name: cat.name,
            href: `/categories/${cat.slug}`,
          })),
          { name: "Special Deals", href: "/products?onSale=true" },
        ];
        setShopLinks(dynamicLinks);
      } catch {
        // Keep default static links on error
      }
    };
    fetchCategories();
  }, []);

  // Build social links dynamically from settings
  const socialLinks = [
    settings.socialFacebook && {
      name: "Facebook",
      href: settings.socialFacebook,
      icon: FaFacebookF,
    },
    settings.socialInstagram && {
      name: "Instagram",
      href: settings.socialInstagram,
      icon: FaInstagram,
    },
    settings.socialTwitter && {
      name: "X",
      href: settings.socialTwitter,
      icon: FaXTwitter,
    },
    settings.socialYoutube && {
      name: "YouTube",
      href: settings.socialYoutube,
      icon: FaYoutube,
    },
    settings.socialTiktok && {
      name: "TikTok",
      href: settings.socialTiktok,
      icon: FaTiktok,
    },
    settings.socialLinkedin && {
      name: "LinkedIn",
      href: settings.socialLinkedin,
      icon: FaLinkedinIn,
    },
    settings.socialWhatsapp && {
      name: "WhatsApp",
      href: settings.socialWhatsapp.startsWith("http")
        ? settings.socialWhatsapp
        : `https://wa.me/${settings.socialWhatsapp.replace(/[^0-9]/g, "")}`,
      icon: FaWhatsapp,
    },
  ].filter(Boolean) as { name: string; href: string; icon: any }[];

  return (
    <footer className="bg-dark-950 text-white">
      {/* Main Footer */}
      <div className="container-custom py-10 md:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 md:gap-8">
          {/* Brand Column - wider */}
          <div className="col-span-2 sm:col-span-3 md:col-span-2">
            <Link href="/" className="inline-block">
              {settings.logo ? (
                <img
                  src={settings.logo}
                  alt={settings.siteName}
                  className="h-10 w-auto"
                />
              ) : (
                <Image
                  src="/images/logo.png"
                  alt={settings.siteName}
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                />
              )}
            </Link>
            {settings.siteDescription && (
              <p className="mt-3 text-sm text-dark-400 leading-relaxed">
                {settings.siteDescription}
              </p>
            )}
            {!settings.siteDescription && (
              <p className="mt-3 text-sm text-dark-400 leading-relaxed">
                Premium home appliances for modern living. Quality products,
                exceptional service, and unmatched value.
              </p>
            )}
            <div className="mt-4 space-y-2">
              {settings.sitePhone && (
                <a
                  href={`tel:${settings.sitePhone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 text-sm text-dark-400 hover:text-white transition-colors"
                >
                  <HiOutlinePhone size={16} />
                  <span>{settings.sitePhone}</span>
                </a>
              )}
              {settings.siteEmail && (
                <a
                  href={`mailto:${settings.siteEmail}`}
                  className="flex items-center gap-2 text-sm text-dark-400 hover:text-white transition-colors"
                >
                  <HiOutlineMail size={16} />
                  <span>{settings.siteEmail}</span>
                </a>
              )}
              {settings.siteAddress && (
                <div className="flex items-start gap-2 text-sm text-dark-400">
                  <HiOutlineLocationMarker
                    size={16}
                    className="flex-shrink-0 mt-0.5"
                  />
                  <span>{settings.siteAddress}</span>
                </div>
              )}
            </div>

            {/* Social Links - Dynamic from settings */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                    aria-label={social.name}
                  >
                    <social.icon size={16} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Shop
            </h4>
            <ul className="space-y-2">
              {shopLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-xs text-dark-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Support
            </h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-xs text-dark-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Company
            </h4>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-xs text-dark-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              Account
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/account/profile"
                  className="text-xs text-dark-400 hover:text-white transition-colors"
                >
                  My Account
                </Link>
              </li>
              <li>
                <Link
                  href="/account/orders"
                  className="text-xs text-dark-400 hover:text-white transition-colors"
                >
                  Order History
                </Link>
              </li>
              <li>
                <Link
                  href="/account/wishlist"
                  className="text-xs text-dark-400 hover:text-white transition-colors"
                >
                  Wishlist
                </Link>
              </li>
              <li>
                <Link
                  href="/account/cart"
                  className="text-xs text-dark-400 hover:text-white transition-colors"
                >
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link
                  href="/account/referrals"
                  className="text-xs text-dark-400 hover:text-white transition-colors"
                >
                  Refer & Earn
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-dark-800">
        <div className="container-custom py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Copyright */}
            <p className="text-xs text-dark-500">
              &copy; {new Date().getFullYear()} {settings.siteName}. All rights
              reserved.
            </p>

            {/* Payment Methods */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-dark-500">We accept:</span>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-5 bg-white rounded flex items-center justify-center">
                  <span className="text-[8px] font-bold text-blue-600">
                    VISA
                  </span>
                </div>
                <div className="w-8 h-5 bg-white rounded flex items-center justify-center">
                  <span className="text-[8px] font-bold text-orange-500">
                    MC
                  </span>
                </div>
                {settings.enableCOD && (
                  <div className="w-8 h-5 bg-white rounded flex items-center justify-center">
                    <span className="text-[8px] font-bold text-dark-700">
                      COD
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Legal Links */}
            <div className="flex items-center gap-3 text-xs text-dark-500">
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <span>&bull;</span>
              <Link
                href="/terms"
                className="hover:text-white transition-colors"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
