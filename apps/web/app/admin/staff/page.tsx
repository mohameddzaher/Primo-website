'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineShieldCheck, HiOutlineUser, HiOutlineDownload } from 'react-icons/hi';
import { Button, Input, Card, ConfirmModal } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { exportToCSV, staffColumns } from '@/lib/export';
import toast from 'react-hot-toast';

export default function AdminStaffPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: '',
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-staff', page, search],
    queryFn: () => adminApi.getStaffPaginated({ page, limit: 20, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] });
      toast.success('Staff member removed');
      setDeleteModal({ isOpen: false, id: '', name: '' });
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to remove staff member')),
  });

  const handleDelete = (id: string, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(deleteModal.id);
  };

  const staff = data?.users || [];
  const pagination = data?.pagination;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium flex items-center gap-1">
            <HiOutlineShieldCheck size={14} />
            Super Admin
          </span>
        );
      case 'admin':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            Admin
          </span>
        );
      case 'staff':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Staff
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            {role}
          </span>
        );
    }
  };

  const handleExport = () => {
    if (staff.length === 0) {
      toast.error('No staff members to export');
      return;
    }
    exportToCSV(staff, staffColumns, `staff-${new Date().toISOString().split('T')[0]}`);
    toast.success('Staff members exported successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Staff Management</h1>
          <p className="text-dark-500 mt-1">Manage admin users and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<HiOutlineDownload size={18} />} onClick={handleExport}>
            Export
          </Button>
          <Link href="/admin/staff/new">
            <Button leftIcon={<HiOutlinePlus size={18} />}>Add Staff</Button>
          </Link>
        </div>
      </div>

      <Card padding="md">
        <Input
          placeholder="Search staff by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-beige-50 border-b border-beige-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Staff Member</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Email</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Role</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Last Login</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-dark-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige-200">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-8 bg-beige-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-dark-500">
                    No staff members found
                  </td>
                </tr>
              ) : (
                staff.map((member: any) => (
                  <motion.tr
                    key={member._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-beige-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.fullName || `${member.firstName} ${member.lastName}`}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <HiOutlineUser className="text-primary-600" size={20} />
                          )}
                        </div>
                        <p className="font-medium text-dark-900">{member.fullName || `${member.firstName || ''} ${member.lastName || ''}`.trim()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-dark-600">{member.email}</td>
                    <td className="px-6 py-4">{getRoleBadge(member.role)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-dark-600">
                      {member.lastLogin
                        ? new Date(member.lastLogin).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/staff/${member._id}`}>
                          <Button variant="ghost" size="sm">
                            <HiOutlinePencil size={18} />
                          </Button>
                        </Link>
                        {member.role !== 'super_admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(member._id, member.fullName || `${member.firstName || ''} ${member.lastName || ''}`.trim())}
                          >
                            <HiOutlineTrash size={18} className="text-red-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-beige-200">
            <p className="text-sm text-dark-500">
              Page {page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: '', name: '' })}
        onConfirm={confirmDelete}
        title="Remove Staff Member"
        message={`Are you sure you want to remove "${deleteModal.name}"? This action cannot be undone.`}
        confirmText="Remove"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
