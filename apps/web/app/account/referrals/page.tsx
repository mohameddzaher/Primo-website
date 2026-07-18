'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineUserAdd,
  HiOutlineGift,
  HiOutlineClipboard,
  HiOutlineShare,
  HiOutlineCheck,
  HiOutlineCurrencyDollar,
} from 'react-icons/hi';
import { FaFacebook, FaTwitter, FaWhatsapp } from 'react-icons/fa';
import { Card, Button, Skeleton } from '@/components/ui';
import { useAuthStore } from '@/lib/store';
import { referralsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ReferralsPage() {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const { data: referralData, isLoading } = useQuery({
    queryKey: ['referrals', user?._id],
    queryFn: () => referralsApi.getMyReferrals(),
    enabled: !!user,
  });

  // Generate referral link using user ID or referral code
  const referralCode = referralData?.referralCode || user?._id?.slice(-8).toUpperCase() || 'PRIMO100';
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/register?ref=${referralCode}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success('Referral code copied!');
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const shareOnFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      '_blank'
    );
  };

  const shareOnTwitter = () => {
    const text = 'Shop premium home appliances at PRIMO and get exclusive discounts!';
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`,
      '_blank'
    );
  };

  const shareOnWhatsApp = () => {
    const text = `Hey! Use my referral link to get SAR 100 off your first order at PRIMO: ${referralLink}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  const stats = [
    {
      icon: HiOutlineUserAdd,
      value: referralData?.totalReferrals || 0,
      label: 'Total Referrals',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: HiOutlineCheck,
      value: referralData?.successfulReferrals || 0,
      label: 'Successful',
      color: 'text-green-600 bg-green-50',
    },
    {
      icon: HiOutlineCurrencyDollar,
      value: `SAR ${referralData?.totalEarnings || 0}`,
      label: 'Total Earnings',
      color: 'text-primary-600 bg-primary-50',
    },
    {
      icon: HiOutlineGift,
      value: `SAR ${referralData?.pendingRewards || 0}`,
      label: 'Pending Rewards',
      color: 'text-yellow-600 bg-yellow-50',
    },
  ];

  const recentReferrals = referralData?.referrals || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-dark-900">Refer & Earn</h1>
        <p className="text-dark-500 mt-1">
          Share PRIMO with friends and earn rewards for every successful referral
        </p>
      </div>

      {/* How It Works */}
      <Card padding="lg">
        <h2 className="text-lg font-semibold text-dark-900 mb-4">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mb-3">
              <span className="text-xl font-bold">1</span>
            </div>
            <h3 className="font-medium text-dark-900">Share Your Link</h3>
            <p className="text-sm text-dark-500 mt-1">
              Copy your unique referral link and share it with friends
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mb-3">
              <span className="text-xl font-bold">2</span>
            </div>
            <h3 className="font-medium text-dark-900">Friend Signs Up</h3>
            <p className="text-sm text-dark-500 mt-1">
              They register using your link and get SAR 100 off their first order
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 mb-3">
              <span className="text-xl font-bold">3</span>
            </div>
            <h3 className="font-medium text-dark-900">You Earn Rewards</h3>
            <p className="text-sm text-dark-500 mt-1">
              Get SAR 100 credit when they complete their first purchase
            </p>
          </div>
        </div>
      </Card>

      {/* Referral Link Card */}
      <Card padding="lg" className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Your Referral Code</h2>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl font-bold tracking-wider">{referralCode}</span>
              <button
                onClick={handleCopyCode}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <HiOutlineClipboard size={20} />
              </button>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="text-white/80 text-sm">Give SAR 100, Get SAR 100</p>
            <p className="text-2xl font-bold mt-1">SAR 100</p>
            <p className="text-white/80 text-xs">per successful referral</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="mt-6 p-4 bg-white/10 rounded-lg">
          <label className="text-sm text-white/80 block mb-2">Your Referral Link</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm"
            />
            <Button
              onClick={handleCopyLink}
              className="bg-white text-primary-600 hover:bg-white/90"
            >
              {copied ? <HiOutlineCheck size={20} /> : <HiOutlineClipboard size={20} />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="mt-6">
          <p className="text-sm text-white/80 mb-3">Share on social media</p>
          <div className="flex gap-3">
            <button
              onClick={shareOnFacebook}
              className="p-3 bg-[#1877F2] rounded-lg hover:opacity-90 transition-opacity"
            >
              <FaFacebook size={20} />
            </button>
            <button
              onClick={shareOnTwitter}
              className="p-3 bg-[#1DA1F2] rounded-lg hover:opacity-90 transition-opacity"
            >
              <FaTwitter size={20} />
            </button>
            <button
              onClick={shareOnWhatsApp}
              className="p-3 bg-[#25D366] rounded-lg hover:opacity-90 transition-opacity"
            >
              <FaWhatsapp size={20} />
            </button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? [...Array(4)].map((_, i) => (
              <Card key={i} padding="md">
                <Skeleton variant="circular" className="w-10 h-10 mb-3" />
                <Skeleton variant="text" className="w-16 h-8 mb-1" />
                <Skeleton variant="text" className="w-24 h-4" />
              </Card>
            ))
          : stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card padding="md">
                  <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                    <stat.icon size={20} />
                  </div>
                  <p className="text-2xl font-bold text-dark-900">{stat.value}</p>
                  <p className="text-sm text-dark-500">{stat.label}</p>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* Recent Referrals */}
      <Card padding="none">
        <div className="p-6 border-b border-beige-200">
          <h2 className="text-lg font-semibold text-dark-900">Recent Referrals</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-dark-500 uppercase">
                  Friend
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-dark-500 uppercase">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-dark-500 uppercase">
                  Reward
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-dark-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-200">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-6 py-4">
                      <Skeleton variant="text" className="w-full h-6" />
                    </td>
                  </tr>
                ))
              ) : recentReferrals.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-beige-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HiOutlineUserAdd className="text-beige-400" size={32} />
                    </div>
                    <p className="text-dark-500">No referrals yet</p>
                    <p className="text-sm text-dark-400 mt-1">
                      Share your link to start earning rewards!
                    </p>
                  </td>
                </tr>
              ) : (
                recentReferrals.map((referral: any) => (
                  <tr key={referral._id} className="hover:bg-beige-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {referral.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-dark-900">{referral.name || 'Unknown'}</p>
                          <p className="text-sm text-dark-500">{referral.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          referral.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : referral.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {referral.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-dark-600">
                      {referral.status === 'completed' ? 'SAR 100' : '-'}
                    </td>
                    <td className="px-6 py-4 text-dark-600">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Terms */}
      <Card padding="md" className="bg-beige-50 border-beige-200">
        <h3 className="font-semibold text-dark-900 mb-2">Referral Program Terms</h3>
        <ul className="text-sm text-dark-500 space-y-1">
          <li>• Referral rewards are credited after the referred friend completes their first purchase</li>
          <li>• Minimum order value of SAR 500 required for the referral to be valid</li>
          <li>• Rewards can be used on future purchases and cannot be exchanged for cash</li>
          <li>• PRIMO reserves the right to modify or cancel the referral program at any time</li>
        </ul>
      </Card>
    </div>
  );
}
