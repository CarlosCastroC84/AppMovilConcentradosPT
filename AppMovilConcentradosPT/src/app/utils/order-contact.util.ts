import { Order } from '../models/order.model';

interface LegacyCustomerData {
  name: string;
  phone?: string;
  location?: string;
}

function sanitizePhone(rawPhone: string): string {
  return rawPhone.replace(/\D/g, '');
}

function extractRawPhone(order: Pick<Order, 'customerPhone' | 'customerName'>): string | null {
  const directPhone = order.customerPhone?.trim();
  if (directPhone) {
    return directPhone;
  }

  return parseLegacyCustomerName(order.customerName).phone?.trim() || null;
}

export function parseLegacyCustomerName(customerName?: string | null): LegacyCustomerData {
  const trimmedName = customerName?.trim() || '';
  if (!trimmedName) {
    return { name: '' };
  }

  const legacyMatch = /^(.*?)\s*-\s*([+\d\s-]+?)(?:\s*\((.*?)\))?$/.exec(trimmedName);

  if (!legacyMatch) {
    return { name: trimmedName };
  }

  const [, name, phone, location] = legacyMatch;
  return {
    name: name.trim(),
    phone: phone?.trim(),
    location: location?.trim()
  };
}

export function getOrderDisplayName(order: Pick<Order, 'customerName'>): string {
  const directName = order.customerName?.trim();
  if (directName) {
    return parseLegacyCustomerName(directName).name || 'Cliente sin nombre';
  }

  return 'Cliente sin nombre';
}

export function getOrderDisplayPhone(order: Pick<Order, 'customerPhone' | 'customerName'>): string | null {
  const rawPhone = extractRawPhone(order);
  if (!rawPhone) {
    return null;
  }

  const digits = sanitizePhone(rawPhone);
  return digits || null;
}

export function getOrderWhatsAppPhone(order: Pick<Order, 'customerPhone' | 'customerName'>): string | null {
  const rawPhone = extractRawPhone(order);
  if (!rawPhone) {
    return null;
  }

  const digits = sanitizePhone(rawPhone);

  if (digits.length === 10 && digits.startsWith('3')) {
    return `57${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('57') && digits[2] === '3') {
    return digits;
  }

  return null;
}

export function getOrderLocation(order: Pick<Order, 'customerLocation' | 'customerName'>): string | null {
  const directLocation = order.customerLocation?.trim();
  if (directLocation) {
    return directLocation;
  }

  return parseLegacyCustomerName(order.customerName).location?.trim() || null;
}
