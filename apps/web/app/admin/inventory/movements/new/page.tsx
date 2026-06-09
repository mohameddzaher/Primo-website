'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineSearch,
  HiOutlineArrowLeft,
  HiOutlineCube,
} from 'react-icons/hi';
import { Card, Button, Badge, Select, Skeleton, Input, Textarea } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const movementTypeOptions = [
  { value: '', label: 'Select Type' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'sale', label: 'Sale' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'return', label: 'Return' },
  { value: 'damaged', label: 'Damaged' },
];

export default function NewMovementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [type, setType] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search products for selection
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['admin-inventory-product-search', productSearch],
    queryFn: () => adminApi.getInventoryProducts({ search: productSearch, limit: 10 }),
    enabled: productSearch.length >= 2 && !selectedProduct,
  });

  const createMovementMutation = useMutation({
    mutationFn: (data: any) => adminApi.createStockMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Stock movement recorded successfully');
      router.push('/admin/inventory/movements');
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to record stock movement'));
    },
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setProductSearch(product.title);
    setShowDropdown(false);
  };

  const handleClearProduct = () => {
    setSelectedProduct(null);
    setProductSearch('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }
    if (!type) {
      toast.error('Please select a movement type');
      return;
    }
    if (!quantity || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    createMovementMutation.mutate({
      productId: selectedProduct._id,
      type,
      quantity: Number(quantity),
      reason,
      reference,
      notes,
    });
  };

  const searchedProducts = searchResults?.products || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-dark-900">Record New Movement</h1>
          <p className="text-dark-500 mt-1">Record a new stock movement for a product</p>
        </div>
        <Link href="/admin/inventory/movements">
          <Button variant="outline" leftIcon={<HiOutlineArrowLeft size={18} />}>
            Back to Movements
          </Button>
        </Link>
      </div>

      {/* Form */}
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          {/* Product Search/Select */}
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Product <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={dropdownRef}>
              {selectedProduct ? (
                <div className="flex items-center justify-between p-3 border border-beige-300 rounded-lg bg-beige-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-beige-200 rounded-lg overflow-hidden flex-shrink-0">
                      {selectedProduct.images?.[0]?.url ? (
                        <img
                          src={selectedProduct.images[0].url}
                          alt={selectedProduct.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-beige-400">
                          <HiOutlineCube size={18} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-900">{selectedProduct.title}</p>
                      <p className="text-xs text-dark-500">
                        SKU: {selectedProduct.sku || '---'} | Stock: {selectedProduct.stockQuantity ?? selectedProduct.stock ?? 0}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearProduct}
                    className="text-dark-400 hover:text-dark-600"
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <Input
                    placeholder="Search for a product..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => productSearch.length >= 2 && setShowDropdown(true)}
                    leftIcon={<HiOutlineSearch size={18} />}
                  />
                  {showDropdown && productSearch.length >= 2 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-beige-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                      {isSearching ? (
                        <div className="p-4 space-y-2">
                          {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                          ))}
                        </div>
                      ) : searchedProducts.length === 0 ? (
                        <div className="p-4 text-center text-dark-500 text-sm">
                          No products found for &quot;{productSearch}&quot;
                        </div>
                      ) : (
                        searchedProducts.map((product: any) => (
                          <button
                            key={product._id}
                            type="button"
                            onClick={() => handleSelectProduct(product)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-beige-50 transition-colors text-left border-b border-beige-100 last:border-0"
                          >
                            <div className="w-8 h-8 bg-beige-100 rounded overflow-hidden flex-shrink-0">
                              {product.images?.[0]?.url ? (
                                <img
                                  src={product.images[0].url}
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-beige-400">
                                  <HiOutlineCube size={14} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-dark-900 truncate">
                                {product.title}
                              </p>
                              <p className="text-xs text-dark-500">
                                SKU: {product.sku || '---'} | Stock: {product.stockQuantity ?? product.stock ?? 0}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Movement Type <span className="text-red-500">*</span>
            </label>
            <Select
              options={movementTypeOptions}
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
            {type && (
              <p className="text-xs text-dark-500 mt-1">
                {type === 'purchase' && 'Stock incoming from supplier - will increase stock quantity.'}
                {type === 'sale' && 'Stock sold to customer - will decrease stock quantity.'}
                {type === 'adjustment' && 'Manual correction to stock levels after count or audit.'}
                {type === 'return' && 'Stock returned by customer - will increase stock quantity.'}
                {type === 'damaged' && 'Stock damaged or lost - will decrease stock quantity.'}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value ? parseInt(e.target.value) : '')}
              placeholder="Enter quantity"
              className="w-full px-4 py-2.5 border border-beige-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-dark-900 placeholder:text-dark-400"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Reason
            </label>
            <Input
              placeholder="Brief reason for this movement"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Reference
            </label>
            <Input
              placeholder="Order number, PO number, etc."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">
              Notes
            </label>
            <Textarea
              placeholder="Additional notes about this movement..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-4 border-t border-beige-200">
            <Button
              type="submit"
              disabled={createMovementMutation.isPending || !selectedProduct || !type || !quantity}
              className="min-w-[140px]"
            >
              {createMovementMutation.isPending ? 'Recording...' : 'Record Movement'}
            </Button>
            <Link href="/admin/inventory/movements">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
