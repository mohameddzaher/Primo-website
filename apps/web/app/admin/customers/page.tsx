'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiOutlineSearch, HiOutlineMail, HiOutlinePhone, HiOutlineDownload, HiOutlinePencil } from 'react-icons/hi';
import { Button, Input, Card } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { exportToCSV, customerColumns } from '@/lib/export';
import toast from 'react-hot-toast';

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', page, search],
    queryFn: () => adminApi.getUsers({ page, limit: 20, search, role: 'user' }),
  });

  const customers = data?.users || [];
  const pagination = data?.pagination;

  const handleExport = () => {
    if (customers.length === 0) {
      toast.error('No customers to export');
      return;
    }
    exportToCSV(customers, customerColumns, `customers-${new Date().toISOString().split('T')[0]}`);
    toast.success('Customers exported successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Customers</h1>
          <p className="text-dark-500 mt-1">View and manage customer accounts</p>
        </div>
        <Button variant="outline" leftIcon={<HiOutlineDownload size={18} />} onClick={handleExport}>
          Export
        </Button>
      </div>

      <Card padding="md">
        <Input
          placeholder="Search customers by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<HiOutlineSearch size={18} />}
        />
      </Card>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Customer</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Contact</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Orders</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Total Spent</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Joined</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-200">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-6 py-4"><div className="h-8 bg-beige-200 rounded animate-pulse"></div></td></tr>
                ))
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-dark-500">No customers found</td></tr>
              ) : (
                customers.map((customer: any) => (
                  <motion.tr key={customer._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-beige-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-semibold">{(customer.firstName || customer.email || '?').charAt(0).toUpperCase()}</span>
                        </div>
                        <p className="font-medium text-dark-900">{customer.fullName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-dark-600 flex items-center gap-1 text-sm"><HiOutlineMail size={14} />{customer.email}</p>
                        {customer.phone && <p className="text-dark-500 flex items-center gap-1 text-sm"><HiOutlinePhone size={14} />{customer.phone}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-600">{customer.ordersCount || 0}</td>
                    <td className="px-6 py-4 font-medium text-dark-900">SAR {(customer.totalSpent || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-dark-600">{new Date(customer.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {customer.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/customers/${customer._id}`}>
                        <Button variant="ghost" size="sm">
                          <HiOutlinePencil size={16} />
                        </Button>
                      </Link>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-beige-200">
            <p className="text-sm text-dark-500">Page {page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page === pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
