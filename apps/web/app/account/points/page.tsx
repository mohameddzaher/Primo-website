'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { HiOutlineStar, HiOutlineShoppingBag, HiOutlineUserAdd, HiOutlineArrowSmRight } from 'react-icons/hi';
import { loyaltyApi } from '@/lib/api';
import { Card, Skeleton } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

export default function PointsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['loyalty-points'],
    queryFn: () => loyaltyApi.getMyPoints(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" height={32} width="40%" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton variant="rounded" className="h-32" />
          <Skeleton variant="rounded" className="h-32" />
          <Skeleton variant="rounded" className="h-32" />
        </div>
        <Skeleton variant="rounded" className="h-64" />
      </div>
    );
  }

  if (!data?.programEnabled) {
    return (
      <div className="text-center py-16">
        <HiOutlineStar className="mx-auto text-dark-300" size={48} />
        <h2 className="mt-4 text-xl font-semibold text-dark-900">Loyalty Program Coming Soon</h2>
        <p className="mt-2 text-dark-500">Stay tuned for our rewards program where you can earn and redeem points.</p>
      </div>
    );
  }

  const typeLabels: Record<string, { label: string; color: string }> = {
    earned_purchase: { label: 'Purchase', color: 'text-green-600' },
    earned_referral: { label: 'Referral', color: 'text-blue-600' },
    redeemed: { label: 'Redeemed', color: 'text-red-600' },
    adjusted: { label: 'Adjustment', color: 'text-orange-600' },
    expired: { label: 'Expired', color: 'text-dark-400' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-dark-900">My Points</h1>
        <p className="text-dark-500 mt-1">Earn points on purchases and referrals, redeem them for discounts</p>
      </div>

      {/* Points Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="lg" className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="text-center">
            <HiOutlineStar className="mx-auto text-primary-600" size={32} />
            <p className="mt-2 text-sm text-primary-700">Available Points</p>
            <p className="text-4xl font-bold text-primary-900 mt-1">{data.balance.toLocaleString()}</p>
            {data.pointsRedemptionRate > 0 && data.balance > 0 && (
              <p className="text-xs text-primary-600 mt-2">
                Worth {formatCurrency(Math.floor(data.balance / data.pointsRedemptionRate))} discount
              </p>
            )}
          </div>
        </Card>

        <Card padding="lg">
          <div className="text-center">
            <HiOutlineShoppingBag className="mx-auto text-green-600" size={32} />
            <p className="mt-2 text-sm text-dark-500">Total Earned</p>
            <p className="text-3xl font-bold text-dark-900 mt-1">{data.totalEarned.toLocaleString()}</p>
            <div className="mt-2 text-xs text-dark-400 space-y-0.5">
              <p>Purchases: {(data.breakdown.fromPurchases || 0).toLocaleString()}</p>
              <p>Referrals: {(data.breakdown.fromReferrals || 0).toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <div className="text-center">
            <HiOutlineUserAdd className="mx-auto text-blue-600" size={32} />
            <p className="mt-2 text-sm text-dark-500">Total Redeemed</p>
            <p className="text-3xl font-bold text-dark-900 mt-1">{data.totalRedeemed.toLocaleString()}</p>
            {data.pointsRedemptionRate > 0 && data.totalRedeemed > 0 && (
              <p className="text-xs text-dark-400 mt-2">
                Saved {formatCurrency(Math.floor(data.totalRedeemed / data.pointsRedemptionRate))} total
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* How it Works */}
      <Card padding="lg">
        <h3 className="font-semibold text-dark-900 mb-3">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold">1</span>
            <div>
              <p className="font-medium text-dark-900">Earn Points</p>
              <p className="text-dark-500">Get points on every delivered order and successful referral</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">2</span>
            <div>
              <p className="font-medium text-dark-900">Accumulate</p>
              <p className="text-dark-500">Minimum {data.minPointsToRedeem} points needed to redeem</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">3</span>
            <div>
              <p className="font-medium text-dark-900">Redeem</p>
              <p className="text-dark-500">{data.pointsRedemptionRate} points = {formatCurrency(1)} discount at checkout</p>
            </div>
          </div>
        </div>
        {data.balance >= data.minPointsToRedeem && (
          <Link
            href="/checkout"
            className="mt-4 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Use your points at checkout <HiOutlineArrowSmRight size={16} />
          </Link>
        )}
      </Card>

      {/* Frozen Notice */}
      {data.isFrozen && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">Your loyalty points are currently frozen. Please contact support for assistance.</p>
        </div>
      )}

      {/* Transaction History */}
      <Card padding="lg">
        <h3 className="font-semibold text-dark-900 mb-4">Transaction History</h3>
        {data.transactions && data.transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-beige-200">
                  <th className="text-left py-2 text-dark-500 font-medium">Date</th>
                  <th className="text-left py-2 text-dark-500 font-medium">Type</th>
                  <th className="text-left py-2 text-dark-500 font-medium">Description</th>
                  <th className="text-right py-2 text-dark-500 font-medium">Points</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tx: any) => {
                  const typeInfo = typeLabels[tx.type] || { label: tx.type, color: 'text-dark-600' };
                  return (
                    <tr key={tx._id} className="border-b border-beige-100">
                      <td className="py-3 text-dark-600">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3">
                        <span className={`font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                      </td>
                      <td className="py-3 text-dark-600 max-w-[200px] truncate">{tx.description}</td>
                      <td className={`py-3 text-right font-semibold ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.points > 0 ? '+' : ''}{tx.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-dark-400 text-center py-8">No transactions yet. Start earning points by making purchases!</p>
        )}
      </Card>
    </div>
  );
}
