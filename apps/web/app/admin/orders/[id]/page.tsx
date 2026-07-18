'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  HiOutlineArrowLeft,
  HiOutlinePrinter,
  HiOutlineLocationMarker,
  HiOutlineCreditCard,
  HiOutlineUser,
} from 'react-icons/hi';
import { Button, Card, Select, Textarea } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { useSettings } from '@/lib/settings-context';
import { buildZatcaTlvBase64, renderQrSvg } from '@/lib/zatca-qr';
import toast from 'react-hot-toast';
import { useState } from 'react';

/**
 * ZATCA (Saudi tax authority) requires a tax invoice to carry the seller's
 * legal name, address and VAT registration number.
 *
 * These now live in Settings > Payment > Tax / Invoicing so the store owner can
 * maintain them. The values below are only shown when a field is still unset,
 * and are deliberately marked so an unconfigured invoice is obviously invalid.
 */
const SELLER_PLACEHOLDERS = {
  name: 'NOT SET — configure legal name in Settings',
  address: 'NOT SET — configure registered address in Settings',
  vatNumber: 'NOT SET — configure VAT number in Settings',
  crNumber: 'NOT SET',
};

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  accepted: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  out_for_delivery: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orderId = params.id as string;
  const [note, setNote] = useState('');
  const { settings } = useSettings();

  const handlePrint = () => {
    if (!order) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // --- ZATCA tax invoice figures (presentation only, no pricing math changed) ---
    const money = (n: number) =>
      `SAR ${n.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const items: any[] = order.items || [];
    const vatRate = order.taxRate ?? 15;
    const totalVat = order.taxAmount || 0;
    const orderDiscount = order.discount || 0;
    const shippingCost = order.shippingCost || 0;
    const totalIncludingVat = order.total || 0;
    const totalExcludingVat = Math.round((totalIncludingVat - totalVat) * 100) / 100;

    const lineGross = items.map((i: any) => (i.price || 0) * (i.quantity || 1));
    const grossSum = lineGross.reduce((a: number, b: number) => a + b, 0);

    // Spread the order-level discount and the order-level VAT across the lines
    // proportionally so the per-line figures add up to the invoice totals.
    let discountAllocated = 0;
    let vatAllocated = 0;
    const lineFigures = lineGross.map((gross: number, idx: number) => {
      const isLast = idx === lineGross.length - 1;
      const share = grossSum > 0 ? gross / grossSum : 0;
      const lineDiscount = isLast
        ? Math.round((orderDiscount - discountAllocated) * 100) / 100
        : Math.round(orderDiscount * share * 100) / 100;
      discountAllocated += lineDiscount;
      const taxable = Math.round((gross - lineDiscount) * 100) / 100;
      const lineVat = isLast
        ? Math.round((totalVat - vatAllocated) * 100) / 100
        : Math.round(totalVat * share * 100) / 100;
      vatAllocated += lineVat;
      return { taxable, lineVat };
    });

    const itemsRows = items.map((item: any, idx: number) => {
      const hasItemDiscount = item.discount && item.discount > 0;
      const priceCell = hasItemDiscount
        ? `<span style="text-decoration:line-through;color:#999;font-size:12px;">${money(item.originalPrice || 0)}</span><br>${money(item.price || 0)} <span style="color:#dc2626;font-size:11px;">(-${item.discount}%)</span>`
        : money(item.price || 0);
      const fig = lineFigures[idx] || { taxable: 0, lineVat: 0 };
      return `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;font-size:14px;color:#333;">
          ${item.product?.title || item.title || 'Product'}
          ${item.sku ? `<br><span style="color:#999;font-size:12px;">SKU: ${item.sku}</span>` : ''}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:center;font-size:14px;color:#333;">${item.quantity}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:right;font-size:14px;color:#333;">${priceCell}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:right;font-size:14px;color:#333;">${money(fig.taxable)}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:center;font-size:14px;color:#333;">${vatRate}%</td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:right;font-size:14px;color:#333;">${money(fig.lineVat)}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:right;font-size:14px;font-weight:600;color:#333;">${money(fig.taxable + fig.lineVat)}</td>
      </tr>`;
    }).join('');

    const sellerName = settings.sellerName || settings.siteName || SELLER_PLACEHOLDERS.name;
    const sellerAddress =
      settings.sellerAddress || settings.siteAddress || SELLER_PLACEHOLDERS.address;
    const sellerVatNumber = settings.sellerVatNumber || SELLER_PLACEHOLDERS.vatNumber;
    const sellerCrNumber = settings.sellerCrNumber || SELLER_PLACEHOLDERS.crNumber;

    const addr = order.shippingAddress || {};
    const issuedAt = new Date(order.createdAt);

    // --- ZATCA Phase 2 QR: Base64(TLV) rendered as an inline (CSP-safe) SVG ---
    const zatcaBase64 = buildZatcaTlvBase64({
      sellerName,
      sellerVatNumber,
      // ISO 8601 UTC, seconds precision (e.g. 2026-07-18T20:30:00Z)
      timestamp: issuedAt.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      totalWithVat: totalIncludingVat.toFixed(2),
      vatTotal: totalVat.toFixed(2),
    });
    let zatcaQr = '';
    try {
      zatcaQr = renderQrSvg(zatcaBase64);
    } catch {
      zatcaQr = '';
    }
    const orderDate = issuedAt.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    const orderTime = issuedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const paymentMethodLabel =
      order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery'
        : order.paymentMethod === 'card' ? 'Credit/Debit Card'
        : order.paymentMethod === 'apple_pay' ? 'Apple Pay'
        : order.paymentMethod || 'N/A';

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Invoice ${order.orderNumber} - ${sellerName}</title>
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
    .summary-table { width:320px; }
    .summary-row.subtotal-excl { border-top:1px solid #e5e2db; margin-top:8px; padding-top:10px; font-weight:600; color:#333; }
    .arabic { font-family:'Segoe UI', Tahoma, Arial, sans-serif; direction:rtl; unicode-bidi:isolate; }
    .seller-vat { display:inline-block; margin-top:6px; padding:3px 10px; border:1px solid #c9a96e; border-radius:4px; font-size:13px; font-weight:600; color:#1a1a2e; }
    .summary-row { display:flex; justify-content:space-between; padding:8px 0; font-size:14px; color:#555; }
    .summary-row.total { border-top:2px solid #1a1a2e; margin-top:8px; padding-top:12px; font-size:18px; font-weight:700; color:#1a1a2e; }
    .summary-row.discount { color:#16a34a; }
    .zatca { display:flex; align-items:center; gap:16px; margin-top:28px; padding-top:20px; border-top:1px solid #e5e2db; }
    .zatca-label { font-size:12px; color:#888; line-height:1.6; }
    .zatca-label strong { display:block; color:#333; font-size:13px; margin-bottom:2px; }
    .zatca-payload { margin:6px 0 0; font-family:'Courier New', Courier, monospace; font-size:10px; color:#aaa; word-break:break-all; max-width:420px; }
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
        <h2>Tax Invoice</h2>
        <h2 class="arabic" style="font-size:20px;">فاتورة ضريبية</h2>
        <p>Invoice No: ${order.orderNumber}</p>
        <p>Issued: ${orderDate} ${orderTime}</p>
      </div>
    </div>
    <div class="body">
      <div class="info-row">
        <div class="info-block" style="flex:1;">
          <h4>Seller / البائع</h4>
          <p class="name">${sellerName}</p>
          <p>${sellerAddress}</p>
          ${settings.sitePhone ? `<p>${settings.sitePhone}</p>` : ''}
          ${settings.siteEmail ? `<p>${settings.siteEmail}</p>` : ''}
          <p class="seller-vat">VAT Reg. No. / الرقم الضريبي: ${sellerVatNumber}</p>
          <p style="font-size:12px;color:#888;">CR No.: ${sellerCrNumber}</p>
        </div>
        <div class="info-block" style="flex:1;">
          <h4>Buyer / المشتري</h4>
          <p class="name">${addr.fullName || (order.userId?.firstName ? `${order.userId.firstName} ${order.userId.lastName}` : 'Customer')}</p>
          <p>${addr.fullAddress || ''}</p>
          <p>${addr.area ? addr.area + ', ' : ''}${addr.city || ''}</p>
          ${addr.building ? `<p>Bldg: ${addr.building}${addr.floor ? `, Floor: ${addr.floor}` : ''}${addr.apartment ? `, Apt: ${addr.apartment}` : ''}</p>` : ''}
          <p>${addr.phone || ''}</p>
          <p>${addr.email || ''}</p>
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
            <th style="text-align:right;">Taxable Amount</th>
            <th style="text-align:center;">VAT Rate</th>
            <th style="text-align:right;">VAT Amount</th>
            <th style="text-align:right;">Total Incl. VAT</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-table">
          <div class="summary-row"><span>Subtotal</span><span>${money(order.subtotal || 0)}</span></div>
          ${orderDiscount > 0 ? `<div class="summary-row discount"><span>Discount${order.discountCode ? ` (${order.discountCode})` : ''}</span><span>-${money(orderDiscount)}</span></div>` : ''}
          <div class="summary-row"><span>Shipping</span><span>${shippingCost === 0 ? 'Free' : money(shippingCost)}</span></div>
          <div class="summary-row subtotal-excl"><span>Total excluding VAT<br><span class="arabic" style="font-size:11px;color:#888;">الإجمالي غير شامل الضريبة</span></span><span>${money(totalExcludingVat)}</span></div>
          <div class="summary-row"><span>Total VAT (${vatRate}%)<br><span class="arabic" style="font-size:11px;color:#888;">مجموع ضريبة القيمة المضافة</span></span><span>${money(totalVat)}</span></div>
          <div class="summary-row total"><span>Total including VAT<br><span class="arabic" style="font-size:11px;color:#888;font-weight:400;">الإجمالي شامل الضريبة</span></span><span>${money(totalIncludingVat)}</span></div>
        </div>
      </div>

      <div class="zatca">
        ${zatcaQr}
        <div class="zatca-label">
          <strong>ZATCA e-invoice QR / رمز الفاتورة الضريبية</strong>
          Scan to verify the seller name, VAT registration number, invoice timestamp,
          total including VAT and VAT amount.
          ${zatcaQr ? '' : `<p class="zatca-payload">${zatcaBase64}</p>`}
        </div>
      </div>
    </div>
    <div class="footer">
      <p style="font-weight:600;color:#666;">Thank you for shopping with ${sellerName}!</p>
      <p>For questions about your order, contact us at ${settings.siteEmail || 'support@primoshops.com'}</p>
      <p style="margin-top:8px;font-size:11px;color:#aaa;">Tax invoice issued under VAT registration ${sellerVatNumber} in accordance with the KSA VAT Law.</p>
      <p style="font-size:11px;color:#aaa;">This is a computer-generated invoice and does not require a signature.</p>
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', orderId],
    queryFn: () => adminApi.getOrder(orderId),
    enabled: !!orderId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, note }: { status: string; note?: string }) =>
      adminApi.updateOrderStatus(orderId, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-movements'] });
      toast.success('Order status updated');
      setNote('');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.response?.data?.error || 'Failed to update order status';
      toast.error(message, { duration: 5000 });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-beige-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card padding="lg" className="animate-pulse">
              <div className="h-40 bg-beige-200 rounded"></div>
            </Card>
          </div>
          <div className="space-y-6">
            <Card padding="lg" className="animate-pulse">
              <div className="h-32 bg-beige-200 rounded"></div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-dark-900 mb-4">Order Not Found</h2>
        <Link href="/admin/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm">
              <HiOutlineArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-dark-900">
              Order #{order.orderNumber}
            </h1>
            <p className="text-dark-500 mt-1">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium border ${
              statusColors[order.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
          <Button variant="outline" leftIcon={<HiOutlinePrinter size={18} />} onClick={handlePrint}>
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-dark-900 mb-4">
              Order Items ({order.items?.length || 0})
            </h2>
            <div className="divide-y divide-beige-200">
              {order.items?.map((item: any) => (
                <div key={item._id} className="py-4 flex gap-4">
                  <div className="w-16 h-16 bg-beige-100 rounded-lg overflow-hidden flex-shrink-0">
                    {(item.image || item.product?.images?.[0]?.url) ? (
                      <img
                        src={item.image || item.product?.images?.[0]?.url}
                        alt={item.product?.title || item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-beige-400 text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark-900">
                      {item.product?.title || item.title}
                    </p>
                    <p className="text-sm text-dark-500">
                      SKU: {item.product?.sku || item.sku || 'N/A'}
                    </p>
                    <div className="text-sm text-dark-500">
                      Qty: {item.quantity} ×{' '}
                      {item.discount && item.discount > 0 ? (
                        <>
                          <span className="line-through text-dark-400">SAR {item.originalPrice?.toLocaleString()}</span>
                          {' '}
                          <span className="text-green-700 font-medium">SAR {item.price?.toLocaleString()}</span>
                          {' '}
                          <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">-{item.discount}%</span>
                        </>
                      ) : (
                        <span>SAR {item.price?.toLocaleString()}</span>
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

            {/* Order Summary */}
            <div className="mt-6 pt-6 border-t border-beige-200 space-y-2">
              <div className="flex justify-between text-dark-600">
                <span>Subtotal</span>
                <span>SAR {order.subtotal?.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-success-600">
                  <span>Discount{order.discountCode ? ` (${order.discountCode})` : ''}</span>
                  <span>-SAR {order.discount?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-dark-600">
                <span>Shipping</span>
                <span>
                  {order.shippingCost === 0 ? 'Free' : `SAR ${order.shippingCost?.toLocaleString()}`}
                </span>
              </div>
              {order.taxAmount > 0 && (
                <div className="flex justify-between text-dark-600">
                  <span>{order.taxLabel || 'VAT'} ({order.taxRate}%)</span>
                  <span>SAR {order.taxAmount?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold text-dark-900 pt-2 border-t border-beige-200">
                <span>Total</span>
                <span>SAR {order.total?.toLocaleString()}</span>
              </div>
              {order.taxAmount > 0 && (
                <p className="text-xs text-dark-400">
                  Includes {order.taxLabel || 'VAT'} ({order.taxRate}%): SAR {order.taxAmount?.toLocaleString()}
                </p>
              )}
            </div>
          </Card>

          {/* Timeline / Notes */}
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-dark-900 mb-4">Order Notes</h2>
            {order.notes ? (
              <p className="text-dark-600 mb-4">{order.notes}</p>
            ) : (
              <p className="text-dark-400 mb-4">No notes for this order</p>
            )}

            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="mt-4 pt-4 border-t border-beige-200">
                <h3 className="text-sm font-semibold text-dark-700 mb-3">Status History</h3>
                <div className="space-y-3">
                  {order.statusHistory.map((history: any, index: number) => (
                    <div key={index} className="flex gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5"></div>
                      <div>
                        <p className="text-dark-900">
                          Status changed to <span className="font-medium">{history.status}</span>
                        </p>
                        {history.note && (
                          <p className="text-dark-500">{history.note}</p>
                        )}
                        <p className="text-dark-400 text-xs">
                          {new Date(history.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Update Status */}
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-dark-900 mb-4">Update Status</h2>
            <div className="space-y-4">
              <Select
                label="Status"
                options={statusOptions}
                value={order.status}
                onChange={(e) =>
                  updateStatusMutation.mutate({ status: e.target.value, note })
                }
              />
              <Textarea
                label="Note (optional)"
                placeholder="Add a note about this status change..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
          </Card>

          {/* Customer Info */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <HiOutlineUser className="text-primary-600" size={20} />
              <h2 className="text-lg font-semibold text-dark-900">Customer</h2>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-dark-900">
                {order.userId?.firstName ? `${order.userId.firstName} ${order.userId.lastName}` : order.shippingAddress?.fullName || 'Customer'}
              </p>
              <p className="text-dark-600">{order.userId?.email}</p>
              <p className="text-dark-600">{order.userId?.phone || order.shippingAddress?.phone}</p>
            </div>
          </Card>

          {/* Shipping Address */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <HiOutlineLocationMarker className="text-primary-600" size={20} />
              <h2 className="text-lg font-semibold text-dark-900">Shipping Address</h2>
            </div>
            {order.shippingAddress && (
              <div className="text-dark-600 space-y-1">
                <p className="font-medium text-dark-900">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.fullAddress}</p>
                <p>{order.shippingAddress.area}, {order.shippingAddress.city}</p>
                {order.shippingAddress.building && <p>Building: {order.shippingAddress.building}</p>}
                {order.shippingAddress.floor && <p>Floor: {order.shippingAddress.floor}, Apt: {order.shippingAddress.apartment}</p>}
                {order.shippingAddress.landmark && <p>Landmark: {order.shippingAddress.landmark}</p>}
                <p>{order.shippingAddress.phone}</p>
              </div>
            )}
          </Card>

          {/* Payment */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <HiOutlineCreditCard className="text-primary-600" size={20} />
              <h2 className="text-lg font-semibold text-dark-900">Payment</h2>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-dark-600">Method</span>
                <span className="text-dark-900">
                  {order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' :
                   order.paymentMethod === 'card' ? 'Credit/Debit Card' : 'Apple Pay'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-600">Status</span>
                <span className={order.paymentStatus === 'paid' ? 'text-success-600' : 'text-yellow-600'}>
                  {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
