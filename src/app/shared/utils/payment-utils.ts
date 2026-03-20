/**
 * Centralize payment status labels and styling
 */

export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PAID';

export function normalizeStatus(status: string | null | undefined): PaymentStatus {
  const s = (status || '').toString().trim().toUpperCase();
  if (s === 'PAID' || s === 'ĐÃ THANH TOÁN') return 'PAID';
  if (s === 'PENDING') return 'PENDING';
  return 'UNPAID';
}

export function getDisplayStatus(fee: { status?: string | null, payment_status?: string | null }): string {
  const status = normalizeStatus(fee.status || fee.payment_status);
  
  if (status === 'PAID') return 'Đã thanh toán';
  if (status === 'PENDING') return 'Chờ xác nhận';
  return 'Chưa thanh toán';
}

export function getDisplaySeverity(fee: { status?: string | null, payment_status?: string | null }): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" {
  const status = normalizeStatus(fee.status || fee.payment_status);

  if (status === 'PAID') return 'success';
  if (status === 'PENDING') return 'warn';
  return 'danger';
}

export function getPaymentStatusLabel(status: PaymentStatus | string | null | undefined): string {
  return getDisplayStatus({ status: status as any });
}

export function getPaymentStatusSeverity(status: PaymentStatus | string | null | undefined): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" {
  return getDisplaySeverity({ status: status as any });
}
