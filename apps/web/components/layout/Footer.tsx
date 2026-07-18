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
import { PaymentMethods } from "@/components/PaymentMethods";
import { useT, type TranslationKey } from "@/lib/i18n";

// Static links are stored as translation keys and resolved at render time so
// they follow the active locale.
const supportLinks: { key: TranslationKey; href: string }[] = [
  { key: "footer.contactUs", href: "/contact" },
  { key: "footer.faqs", href: "/faq" },
  { key: "nav.trackOrder", href: "/track-order" },
  { key: "footer.shippingInfo", href: "/shipping" },
  { key: "footer.returnsExchanges", href: "/returns" },
  { key: "footer.warranty", href: "/warranty" },
];

const companyLinks: { key: TranslationKey; href: string }[] = [
  { key: "footer.aboutUs", href: "/about" },
  { key: "nav.blog", href: "/blog" },
  { key: "footer.careers", href: "/careers" },
  { key: "footer.press", href: "/press" },
  { key: "footer.privacyPolicy", href: "/privacy" },
  { key: "footer.terms", href: "/terms" },
];

const accountLinks: { key: TranslationKey; href: string }[] = [
  { key: "footer.myAccount", href: "/account/profile" },
  { key: "footer.orderHistory", href: "/account/orders" },
  { key: "nav.wishlist", href: "/account/wishlist" },
  { key: "cart.title", href: "/cart" },
  { key: "account.referrals", href: "/account/referrals" },
];

export function Footer() {
  const { settings } = useSettings();
  const t = useT();

  // Category names come from the database and stay as the admin entered them;
  // only the two static entries around them are translated.
  const [categoryLinks, setCategoryLinks] = useState<
    { name: string; href: string }[]
  >([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await categoriesApi.getAll();
        const parentCategories = (categories || [])
          .filter((cat: any) => !cat.parentId)
          .slice(0, 4);

        setCategoryLinks(
          parentCategories.map((cat: any) => ({
            name: cat.name,
            href: `/categories/${cat.slug}`,
          }))
        );
      } catch {
        // Keep the static links only on error
      }
    };
    fetchCategories();
  }, []);

  const shopLinks = [
    { name: t("home.allProducts"), href: "/products" },
    ...categoryLinks,
    { name: t("home.specialDeals"), href: "/products?onSale=true" },
  ];

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
                {t("footer.tagline")}
              </p>
            )}
            <div className="mt-4 space-y-2">
              {settings.sitePhone && (
                <a
                  href={`tel:${settings.sitePhone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 text-sm text-dark-400 hover:text-white transition-colors"
                >
                  <HiOutlinePhone size={16} />
                  <span className="ltr-nums">{settings.sitePhone}</span>
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
              {t("footer.shop")}
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
              {t("footer.support")}
            </h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-xs text-dark-400 hover:text-white transition-colors"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              {t("footer.company")}
            </h4>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-xs text-dark-400 hover:text-white transition-colors"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
              {t("footer.account")}
            </h4>
            <ul className="space-y-2">
              {accountLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-xs text-dark-400 hover:text-white transition-colors"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
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
              &copy; <span className="ltr-nums">{new Date().getFullYear()}</span>{" "}
              {settings.siteName}. {t("footer.rightsReserved")}.
            </p>

            {/* Payment Methods */}
            <PaymentMethods
              includeCOD={settings.enableCOD}
              labelClassName="text-dark-500"
            />

            {/* Legal Links */}
            <div className="flex items-center gap-3 text-xs text-dark-500">
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                {t("footer.privacyShort")}
              </Link>
              <span>&bull;</span>
              <Link
                href="/terms"
                className="hover:text-white transition-colors"
              >
                {t("footer.termsShort")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
