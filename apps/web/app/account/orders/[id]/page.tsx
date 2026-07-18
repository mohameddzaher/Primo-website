'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineChevronRight,
  HiOutlineLocationMarker,
  HiOutlineCreditCard,
  HiOutlineClipboardList,
  HiOutlineXCircle,
  HiOutlineRefresh,
  HiOutlineDownload,
  HiOutlinePrinter,
  HiOutlineTruck,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import { Button, Card, ConfirmModal } from '@/components/ui';
import { ordersApi, cartApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { useCartStore } from '@/lib/store';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  accepted: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  out_for_delivery: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
};

const statusSteps = ['new', 'accepted', 'in_progress', 'out_for_delivery', 'delivered'];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orderId = params.id as string;
  const { addItem, openCart } = useCartStore();

  const [cancelModal, setCancelModal] = useState(false);
  const [reorderLoading, setReorderLoading] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId),
    enabled: !!orderId,
    refetchInterval: 10_000, // Poll every 10 seconds for real-time status updates
  });

  // Cancel order mutation
  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancel(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled successfully');
      setCancelModal(false);
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to cancel order')),
  });

  // Handle reorder - adds all items to cart
  const handleReorder = async () => {
    if (!order?.items?.length) return;

    setReorderLoading(true);
    try {
      for (const item of order.items) {
        const productId = item.productId || item.product?._id;
        if (productId) {
          // Sync with backend first
          await cartApi.addItem(productId, item.quantity);

          // Then update local state
          addItem({
            productId,
            product: {
              id: productId,
              title: item.product?.title || item.title || '',
              slug: item.product?.slug || '',
              price: item.product?.price || item.price || 0,
              discount: item.product?.discount || 0,
              images: item.product?.images || (item.image ? [{ url: item.image }] : []),
              stock: item.product?.stock || 100,
            },
            quantity: item.quantity || 1,
          });
        }
      }
      toast.success('Items added to cart');
      openCart();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to add items to cart'));
    } finally {
      setReorderLoading(false);
    }
  };

  // Generate professional invoice HTML
  const generateInvoiceHTML = () => {
    if (!order) return '';
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    const paymentMethodLabel =
      order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery'
        : order.paymentMethod === 'card' ? 'Credit/Debit Card'
        : order.paymentMethod === 'apple_pay' ? 'Apple Pay'
        : order.paymentMethod;

    const itemsHTML = order.items?.map((item: any) => {
      const hasDiscount = item.discount && item.discount > 0;
      const lineTotal = (item.price || 0) * (item.quantity || 1);
      return `
        <tr>
          <td style="padding:12px 8px;border-bottom:1px solid #eee;font-size:14px;color:#333;">
            ${item.product?.title || item.title}
            ${item.sku ? `<br><span style="color:#999;font-size:12px;">SKU: ${item.sku}</span>` : ''}
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:center;font-size:14px;color:#333;">${item.quantity}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:right;font-size:14px;color:#333;">
            ${hasDiscount
              ? `<span style="text-decoration:line-through;color:#999;font-size:12px;">SAR ${item.originalPrice?.toLocaleString()}</span><br>SAR ${item.price?.toLocaleString()} <span style="color:#dc2626;font-size:11px;">(-${item.discount}%)</span>`
              : `SAR ${item.price?.toLocaleString()}`
            }
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:right;font-size:14px;font-weight:600;color:#333;">SAR ${lineTotal.toLocaleString()}</td>
        </tr>`;
    }).join('') || '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PRIMO Invoice - ${order.orderNumber}</title>
  <style>
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin:0; padding:0; background:#f5f5f0; color:#333; }
    .invoice { max-width:800px; margin:20px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color:#fff; padding:32px 40px; display:flex; justify-content:space-between; align-items:flex-start; }
    .logo { font-size:32px; font-weight:800; letter-spacing:2px; }
    .logo-accent { color:#c9a96e; }
    .invoice-title { text-align:right; }
    .invoice-title h2 { margin:0; font-size:24px; font-weight:300; letter-spacing:1px; }
    .invoice-title p { margin:4px 0 0; opacity:0.8; font-size:14px; }
    .body { padding:32px 40px; }
    .info-row { display:flex; justify-content:space-between; margin-bottom:32px; gap:24px; }
    .info-block h4 { margin:0 0 8px; font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#c9a96e; font-weight:600; }
    .info-block p { margin:2px 0; font-size:14px; color:#555; line-height:1.6; }
    .info-block .name { font-weight:600; color:#333; font-size:15px; }
    table { width:100%; border-collapse:collapse; margin-bottom:24px; }
    thead th { background:#f8f7f4; padding:12px 8px; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; color:#666; font-weight:600; border-bottom:2px solid #e5e2db; }
    .summary { display:flex; justify-content:flex-end; }
    .summary-table { width:280px; }
    .summary-row { display:flex; justify-content:space-between; padding:8px 0; font-size:14px; color:#555; }
    .summary-row.total { border-top:2px solid #1a1a2e; margin-top:8px; padding-top:12px; font-size:18px; font-weight:700; color:#1a1a2e; }
    .summary-row.discount { color:#16a34a; }
    .footer { background:#f8f7f4; padding:24px 40px; text-align:center; border-top:1px solid #e5e2db; }
    .footer p { margin:4px 0; font-size:13px; color:#888; }
    .badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; }
    .badge-status { background:#e0f2fe; color:#0369a1; }
    .badge-payment { background:${order.paymentStatus === 'paid' ? '#dcfce7' : '#fef3c7'}; color:${order.paymentStatus === 'paid' ? '#166534' : '#92400e'}; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        <div class="logo">PRI<span class="logo-accent">MO</span></div>
        <p style="margin:4px 0 0;opacity:0.7;font-size:13px;">Premium Shopping Experience</p>
      </div>
      <div class="invoice-title">
        <h2>INVOICE</h2>
        <p>#${order.orderNumber}</p>
        <p>${orderDate}</p>
      </div>
    </div>
    <div class="body">
      <div class="info-row">
        <div class="info-block" style="flex:1;">
          <h4>Bill To</h4>
          <p class="name">${order.shippingAddress?.fullName || 'N/A'}</p>
          <p>${order.shippingAddress?.fullAddress || ''}</p>
          <p>${order.shippingAddress?.area || ''}, ${order.shippingAddress?.city || ''}</p>
          ${order.shippingAddress?.building ? `<p>Bldg: ${order.shippingAddress.building}${order.shippingAddress.floor ? `, Floor: ${order.shippingAddress.floor}` : ''}${order.shippingAddress.apartment ? `, Apt: ${order.shippingAddress.apartment}` : ''}</p>` : ''}
          <p>${order.shippingAddress?.phone || ''}</p>
          <p>${order.shippingAddress?.email || ''}</p>
        </div>
        <div class="info-block" style="text-align:right;">
          <h4>Order Details</h4>
          <p>Status: <span class="badge badge-status">${order.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</span></p>
          <p>Payment: <span class="badge badge-payment">${order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}</span></p>
          <p>Method: ${paymentMethodLabel}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Item</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Unit Price</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-table">
          <div class="summary-row"><span>Subtotal</span><span>SAR ${order.subtotal?.toLocaleString()}</span></div>
          ${order.discount > 0 ? `<div class="summary-row discount"><span>Discount${order.discountCode ? ` (${order.discountCode})` : ''}</span><span>-SAR ${order.discount?.toLocaleString()}</span></div>` : ''}
          <div class="summary-row"><span>Shipping</span><span>${order.shippingCost === 0 ? 'Free' : `SAR ${order.shippingCost?.toLocaleString()}`}</span></div>
          ${order.taxAmount > 0 ? `<div class="summary-row"><span>${order.taxLabel || 'VAT'} (${order.taxRate}%)</span><span>SAR ${order.taxAmount?.toLocaleString()}</span></div>` : ''}
          <div class="summary-row total"><span>Total</span><span>SAR ${order.total?.toLocaleString()}</span></div>
          ${order.taxAmount > 0 ? `<div style="text-align:right;font-size:11px;color:#888;margin-top:4px;">Includes ${order.taxLabel || 'VAT'} (${order.taxRate}%): SAR ${order.taxAmount?.toLocaleString()}</div>` : ''}
        </div>
      </div>
    </div>
    <div class="footer">
      <p style="font-weight:600;color:#666;">Thank you for shopping with PRIMO!</p>
      <p>For questions about your order, contact us at support@primoshops.com</p>
      <p style="margin-top:8px;font-size:11px;color:#aaa;">This is a computer-generated invoice and does not require a signature.</p>
    </div>
  </div>
</body>
</html>`;
  };

  // Download invoice as HTML file (opens in browser then can be saved as PDF)
  const handleDownloadInvoice = () => {
    if (!order) return;
    const html = generateInvoiceHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PRIMO-Invoice-${order.orderNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Invoice downloaded');
  };

  // Handle print - opens clean invoice in new window
  const handlePrint = () => {
    if (!order) return;
    const html = generateInvoiceHTML();
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print the invoice');
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-beige-200 rounded w-1/4 animate-pulse"></div>
        <div className="bg-white rounded-xl p-6 animate-pulse">
          <div className="h-4 bg-beige-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-beige-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-dark-900 mb-4">
          Order Not Found
        </h2>
        <Link href="/account/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const currentStepIndex = statusSteps.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const canCancel = ['new', 'accepted'].includes(order.status);
  const isCompleted = order.status === 'delivered';

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-dark-500 print:hidden">
        <Link href="/account/orders" className="hover:text-primary-600">
          My Orders
        </Link>
        <HiOutlineChevronRight size={16} />
        <span className="text-dark-900">Order #{order.orderNumber}</span>
      </nav>

      {/* Order Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card padding="lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-dark-900">
                Order #{order.orderNumber}
              </h1>
              <p className="text-dark-500 mt-1">
                Placed on{' '}
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex px-4 py-2 rounded-full text-sm font-medium border ${
                  statusColors[order.status] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6 print:hidden">
            {/* Reorder Button */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<HiOutlineRefresh size={16} />}
              onClick={handleReorder}
              isLoading={reorderLoading}
            >
              Reorder
            </Button>

            {/* Download Invoice */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<HiOutlineDownload size={16} />}
              onClick={handleDownloadInvoice}
            >
              Download Invoice
            </Button>

            {/* Print */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<HiOutlinePrinter size={16} />}
              onClick={handlePrint}
            >
              Print
            </Button>

            {/* Cancel Order */}
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<HiOutlineXCircle size={16} />}
                onClick={() => setCancelModal(true)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Cancel Order
              </Button>
            )}
          </div>

          {/* Order Progress */}
          {!isCancelled && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                {statusSteps.map((step, index) => (
                  <div key={step} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        index <= currentStepIndex
                          ? 'bg-primary-600 text-white'
                          : 'bg-beige-200 text-dark-400'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={`text-xs mt-1 capitalize hidden sm:block ${
                        index <= currentStepIndex ? 'text-primary-600' : 'text-dark-400'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
              <div className="relative h-2 bg-beige-200 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-primary-600 rounded-full transition-all"
                  style={{
                    width: `${((currentStepIndex + 1) / statusSteps.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
              This order has been cancelled.
              {order.cancelReason && <p className="mt-1 text-sm">Reason: {order.cancelReason}</p>}
            </div>
          )}

          {isCompleted && (
            <div className="p-4 bg-green-50 text-green-700 rounded-lg">
              <p className="font-medium">Order Delivered Successfully!</p>
              <p className="text-sm mt-1">Thank you for shopping with us. We hope you enjoy your purchase.</p>
            </div>
          )}
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">
                Order Items ({order.items?.length || 0})
              </h2>
              <div className="divide-y divide-beige-200">
                {order.items?.map((item: any) => (
                  <div key={item._id} className="py-4 flex gap-4">
                    <div className="w-20 h-20 bg-beige-100 rounded-lg overflow-hidden flex-shrink-0 print:w-16 print:h-16">
                      {(item.image || item.product?.images?.[0]?.url) ? (
                        <img
                          src={item.image || item.product?.images?.[0]?.url}
                          alt={item.product?.title || item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <HiOutlineClipboardList className="text-beige-400" size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.product?.slug || item.productId}`}
                        className="font-medium text-dark-900 hover:text-primary-600 line-clamp-2 print:text-sm"
                      >
                        {item.product?.title || item.title}
                      </Link>
                      <p className="text-sm text-dark-500 mt-1">
                        Quantity: {item.quantity}
                      </p>
                      <div className="text-sm text-dark-500">
                        {item.discount && item.discount > 0 ? (
                          <span>
                            Price: <span className="line-through text-dark-400">SAR {item.originalPrice?.toLocaleString()}</span>
                            {' '}
                            <span className="text-green-700 font-medium">SAR {item.price?.toLocaleString()}</span>
                            {' '}
                            <span className="text-xs px-1 py-0.5 bg-red-100 text-red-700 rounded">-{item.discount}%</span>
                          </span>
                        ) : (
                          <span>Price: SAR {item.price?.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-dark-900">
                        SAR {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                      </p>
                      {item.discount && item.discount > 0 && (
                        <p className="text-xs text-green-600">
                          Saved SAR {(((item.originalPrice || 0) - (item.price || 0)) * (item.quantity || 1)).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Order Summary & Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-dark-900 mb-4">
                Order Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-dark-600">
                  <span>Subtotal</span>
                  <span>SAR {order.subtotal?.toLocaleString()}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-success-600">
                    <span>
                      Discount
                      {order.discountCode && (
                        <span className="ml-1 text-xs bg-success-100 px-1.5 py-0.5 rounded">
                          {order.discountCode}
                        </span>
                      )}
                    </span>
                    <span>-SAR {order.discount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-dark-600">
                  <span>Shipping</span>
                  <span>
                    {order.shippingCost === 0
                      ? 'Free'
                      : `SAR ${order.shippingCost?.toLocaleString()}`}
                  </span>
                </div>
                {order.taxAmount > 0 && (
                  <div className="flex justify-between text-dark-600">
                    <span>
                      {order.taxLabel || 'VAT'} ({order.taxRate}%)
                    </span>
                    <span>SAR {order.taxAmount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-beige-200 pt-3">
                  <div className="flex justify-between text-lg font-semibold text-dark-900">
                    <span>Total</span>
                    <span>SAR {order.total?.toLocaleString()}</span>
                  </div>
                  {order.taxAmount > 0 && (
                    <p className="text-xs text-dark-400 mt-1">
                      Includes {order.taxLabel || 'VAT'} ({order.taxRate}%): SAR {order.taxAmount?.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Shipment Tracking */}
          {order.shipment?.trackingNumber && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card padding="lg">
                <div className="flex items-center gap-2 mb-4">
                  <HiOutlineTruck className="text-primary-600" size={20} />
                  <h2 className="text-lg font-semibold text-dark-900">
                    Shipment Tracking
                  </h2>
                </div>
                <div className="space-y-3">
                  {order.shipment.carrier && (
                    <div className="flex justify-between gap-3 text-dark-600">
                      <span>Carrier</span>
                      <span className="font-medium text-dark-900">
                        {order.shipment.carrier}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between gap-3 text-dark-600">
                    <span>Tracking Number</span>
                    <span className="font-medium text-dark-900 break-all text-right">
                      {order.shipment.trackingNumber}
                    </span>
                  </div>
                  {order.shipment.shippedAt && (
                    <div className="flex justify-between gap-3 text-dark-600">
                      <span>Shipped On</span>
                      <span className="font-medium text-dark-900">
                        {new Date(order.shipment.shippedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  {order.shipment.estimatedDelivery && (
                    <div className="flex justify-between gap-3 text-dark-600">
                      <span>Estimated Delivery</span>
                      <span className="font-medium text-dark-900">
                        {new Date(order.shipment.estimatedDelivery).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  {order.shipment.trackingUrl && (
                    <a
                      href={order.shipment.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block pt-1 print:hidden"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        rightIcon={<HiOutlineExternalLink size={16} />}
                      >
                        Track Shipment
                      </Button>
                    </a>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Shipping Address */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card padding="lg">
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineLocationMarker className="text-primary-600" size={20} />
                <h2 className="text-lg font-semibold text-dark-900">
                  Shipping Address
                </h2>
              </div>
              {order.shippingAddress && (
                <div className="text-dark-600 space-y-1">
                  <p className="font-medium text-dark-900">
                    {order.shippingAddress.fullName}
                  </p>
                  <p>{order.shippingAddress.fullAddress}</p>
                  <p>
                    {order.shippingAddress.area}, {order.shippingAddress.city}
                  </p>
                  {order.shippingAddress.building && (
                    <p>Building: {order.shippingAddress.building}</p>
                  )}
                  {order.shippingAddress.floor && (
                    <p>Floor: {order.shippingAddress.floor}, Apt: {order.shippingAddress.apartment}</p>
                  )}
                  <p>{order.shippingAddress.phone}</p>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Payment Method */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card padding="lg">
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineCreditCard className="text-primary-600" size={20} />
                <h2 className="text-lg font-semibold text-dark-900">
                  Payment Method
                </h2>
              </div>
              <p className="text-dark-600">
                {order.paymentMethod === 'cash_on_delivery'
                  ? 'Cash on Delivery'
                  : order.paymentMethod === 'card'
                  ? 'Credit/Debit Card'
                  : order.paymentMethod === 'apple_pay'
                  ? 'Apple Pay'
                  : order.paymentMethod}
              </p>
              <p className="text-sm text-dark-500 mt-1">
                Payment Status:{' '}
                <span
                  className={
                    order.paymentStatus === 'paid'
                      ? 'text-success-600'
                      : 'text-yellow-600'
                  }
                >
                  {order.paymentStatus?.charAt(0).toUpperCase() +
                    order.paymentStatus?.slice(1)}
                </span>
              </p>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Back Button */}
      <div className="flex justify-start print:hidden">
        <Button variant="outline" onClick={() => router.push('/account/orders')}>
          Back to Orders
        </Button>
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={cancelModal}
        onClose={() => setCancelModal(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Cancel Order"
        message={`Are you sure you want to cancel order #${order.orderNumber}? This action cannot be undone.`}
        confirmText="Cancel Order"
        variant="danger"
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
}
