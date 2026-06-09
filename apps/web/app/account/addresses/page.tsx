'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineLocationMarker,
  HiOutlineCheck,
} from 'react-icons/hi';
import { Button, Input, Card } from '@/components/ui';
import { userApi } from '@/lib/api';
import toast from 'react-hot-toast';

const addressSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional(),
});

type AddressForm = z.infer<typeof addressSchema>;

export default function AddressesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => userApi.getAddresses(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      isDefault: false,
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: AddressForm) => userApi.addAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address added successfully');
      handleCloseForm();
    },
    onError: () => {
      toast.error('Failed to add address');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddressForm }) =>
      userApi.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address updated successfully');
      handleCloseForm();
    },
    onError: () => {
      toast.error('Failed to update address');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete address');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => userApi.setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Default address updated');
    },
    onError: () => {
      toast.error('Failed to set default address');
    },
  });

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    reset();
  };

  const handleEdit = (address: any) => {
    setEditingId(address._id);
    setValue('label', address.label);
    setValue('fullName', address.fullName);
    setValue('phone', address.phone);
    setValue('address', address.address);
    setValue('city', address.city);
    setValue('state', address.state);
    setValue('postalCode', address.postalCode || '');
    setValue('isDefault', address.isDefault);
    setShowForm(true);
  };

  const onSubmit = (data: AddressForm) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      addMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-dark-900">My Addresses</h1>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-beige-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-beige-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const addressList = addresses || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark-900">My Addresses</h1>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            leftIcon={<HiOutlinePlus size={16} />}
          >
            Add New Address
          </Button>
        )}
      </div>

      {/* Address Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card padding="lg">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Label (e.g., Home, Office)"
                    placeholder="Home"
                    error={errors.label?.message}
                    {...register('label')}
                  />
                  <Input
                    label="Full Name"
                    placeholder="Enter full name"
                    error={errors.fullName?.message}
                    {...register('fullName')}
                  />
                  <Input
                    label="Phone Number"
                    placeholder="Enter phone number"
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                  <Input
                    label="City"
                    placeholder="Enter city"
                    error={errors.city?.message}
                    {...register('city')}
                  />
                </div>
                <Input
                  label="Address"
                  placeholder="Enter street address"
                  error={errors.address?.message}
                  {...register('address')}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="State/Governorate"
                    placeholder="Enter state"
                    error={errors.state?.message}
                    {...register('state')}
                  />
                  <Input
                    label="Postal Code (Optional)"
                    placeholder="Enter postal code"
                    error={errors.postalCode?.message}
                    {...register('postalCode')}
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-beige-300 text-primary-600"
                    {...register('isDefault')}
                  />
                  <span className="text-sm text-dark-700">
                    Set as default address
                  </span>
                </label>
                <div className="flex items-center gap-3 pt-4 border-t border-beige-200">
                  <Button
                    type="submit"
                    isLoading={addMutation.isPending || updateMutation.isPending}
                  >
                    {editingId ? 'Update Address' : 'Save Address'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCloseForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Address List */}
      {addressList.length === 0 && !showForm ? (
        <Card padding="lg" className="text-center py-12">
          <HiOutlineLocationMarker className="mx-auto h-16 w-16 text-beige-400 mb-4" />
          <h3 className="text-lg font-medium text-dark-900 mb-2">
            No addresses saved
          </h3>
          <p className="text-dark-500 mb-6">
            Add an address for faster checkout
          </p>
          <Button
            onClick={() => setShowForm(true)}
            leftIcon={<HiOutlinePlus size={16} />}
          >
            Add Address
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addressList.map((address: any) => (
            <Card
              key={address._id}
              padding="md"
              className={`relative ${
                address.isDefault ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              {address.isDefault && (
                <span className="absolute top-2 right-2 px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                  Default
                </span>
              )}
              <div className="space-y-2">
                <h4 className="font-semibold text-dark-900">{address.label}</h4>
                <p className="text-dark-700">{address.fullName}</p>
                <p className="text-dark-500 text-sm">
                  {address.address}, {address.city}, {address.state}
                  {address.postalCode && `, ${address.postalCode}`}
                </p>
                <p className="text-dark-500 text-sm">{address.phone}</p>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-beige-200">
                {!address.isDefault && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDefaultMutation.mutate(address._id)}
                    leftIcon={<HiOutlineCheck size={14} />}
                  >
                    Set Default
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(address)}
                  leftIcon={<HiOutlinePencil size={14} />}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(address._id)}
                  className="text-error-600 hover:bg-error-50"
                  leftIcon={<HiOutlineTrash size={14} />}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
