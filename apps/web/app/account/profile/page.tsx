'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HiOutlinePencil, HiOutlineCheck } from 'react-icons/hi';
import { Button, Input } from '@/components/ui';
import { Card } from '@/components/ui';
import { useAuthStore } from '@/lib/store';
import { userApi } from '@/lib/api';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch fresh profile data with stats
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userApi.getProfile(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    },
  });

  // Update local user state and form when fetched data changes
  useEffect(() => {
    if (profileData) {
      setUser({ ...user, ...profileData });
      reset({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        phone: profileData.phone || '',
      });
    }
  }, [profileData]);

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      const updatedUser = await userApi.updateProfile(data);
      setUser({ ...user, ...updatedUser, firstName: data.firstName, lastName: data.lastName });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-dark-900">My Profile</h1>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            leftIcon={<HiOutlinePencil size={16} />}
          >
            Edit Profile
          </Button>
        )}
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="First Name"
              placeholder="Enter your first name"
              disabled={!isEditing}
              error={errors.firstName?.message}
              {...register('firstName')}
            />

            <Input
              label="Last Name"
              placeholder="Enter your last name"
              disabled={!isEditing}
              error={errors.lastName?.message}
              {...register('lastName')}
            />

            <Input
              label="Email"
              type="email"
              value={user?.email || ''}
              disabled
              hint="Email cannot be changed"
            />

            <Input
              label="Phone Number"
              placeholder="Enter your phone number"
              disabled={!isEditing}
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          {isEditing && (
            <div className="flex items-center gap-3 pt-4 border-t border-beige-200">
              <Button
                type="submit"
                isLoading={isLoading}
                leftIcon={<HiOutlineCheck size={16} />}
              >
                Save Changes
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          )}
        </form>
      </Card>

      {/* Account Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="md" className="text-center">
          <p className="text-3xl font-bold text-primary-600">
            {user?.ordersCount || 0}
          </p>
          <p className="text-sm text-dark-500 mt-1">Total Orders</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-3xl font-bold text-primary-600">
            {user?.wishlistCount || 0}
          </p>
          <p className="text-sm text-dark-500 mt-1">Wishlist Items</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-3xl font-bold text-primary-600">
            {user?.reviewsCount || 0}
          </p>
          <p className="text-sm text-dark-500 mt-1">Reviews Written</p>
        </Card>
      </div>
    </div>
  );
}
