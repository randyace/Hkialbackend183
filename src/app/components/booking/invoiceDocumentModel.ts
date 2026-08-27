/**
 * Helpers for the official Service Summary / Invoice document preview.
 * Mirrors `ReceiptPdfService` grouping + `DocumentInvoiceLineMapper` columns
 * so the in-modal preview matches the PDF/Excel export layout.
 *
 * Discount column = monetary amount saved: (unit × qty) − net subtotal,
 * formatted as −HK$… — never percentage strings or label parsing.
 */

export interface InvoiceBreakdownLine {
  key: string;
  label: string;
  qty: number;
  unit_price: number;
  subtotal: number;
  product?: string;
  note?: string;
  quantity?: number;
  /** Catalog unit before staff override (preferred for Unit Price column). */
  original_unit_price?: number | null;
  /** Staff line discount as HK$ (from advanced_details.line_discounts). */
  line_discount?: number | null;
  discount_pct?: number | null;
  discount_percent?: number | null;
  pct?: number | null;
}

export interface InvoicePreviewLine {
  description: string;
  qty: number;
  unitPrice: number | null;
  discountText: string;
  total: number;
  detail?: string | null;
}

export interface InvoicePreviewGroup {
  title: string;
  product: string;
  lines: InvoicePreviewLine[];
}

export function formatDocumentMoney(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) {
    return '—';
  }
  const rounded = Math.round(amount);
  const absLabel = Math.abs(rounded).toLocaleString('en-US');
  return rounded < 0 ? `-$${absLabel}` : `$${absLabel}`;
}

/**
 * Discount column: −HK$9,000 when amount saved &gt; 0, else —.
 */
export function formatInvoiceDiscountAmount(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount) || amount <= 0) {
    return '—';
  }
  const rounded = Math.round(amount);
  return `-HK$${Math.abs(rounded).toLocaleString('en-US')}`;
}

export function formatDocumentDate(value?: string | null): string {
  if (!value) {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  const datePart = value.split(/[,\s]/)[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [y, m, d] = datePart.split('-');
    return `${d}/${m}/${y}`;
  }
  return datePart || value;
}

function extractAirportCode(value?: string | null): string | null {
  if (!value || !String(value).trim()) return null;
  const trimmed = String(value).trim();
  const paren = trimmed.match(/\(([A-Z]{3})\)/);
  if (paren) return paren[1];
  if (/^[A-Z]{3}$/.test(trimmed)) return trimmed;
  const cn = trimmed.match(/^CN-([A-Z]{3})$/);
  if (cn) return cn[1];
  return trimmed.length <= 8 ? trimmed : null;
}

export function formatFlightDisplay(input: {
  flightNo?: string | null;
  flightOrigin?: string | null;
  flightDestination?: string | null;
}): string {
  const origin = extractAirportCode(input.flightOrigin);
  const destination = extractAirportCode(input.flightDestination);
  const flightNo = String(input.flightNo ?? '').trim();
  let route = '';
  if (origin && destination) route = `${origin}/${destination}`;
  else if (origin || destination) route = origin || destination || '';
  return [route, flightNo].filter(Boolean).join(' ').trim() || 'N/A';
}

/**
 * Resolve the billed quantity for a line. Prefer positive `qty` /
 * `quantity`; if both are missing/zero but unit×amount imply a count,
 * derive it. Never display `0` next to a non-zero amount.
 */
export function resolveBilledQuantity(line: InvoiceBreakdownLine): number {
  const candidates = [line.qty, line.quantity];
  for (const raw of candidates) {
    const n = typeof raw === 'number' ? raw : Number(raw);
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }

  const unit = Number(line.unit_price);
  const subtotal = Number(line.subtotal);
  if (Number.isFinite(unit) && unit > 0 && Number.isFinite(subtotal) && subtotal !== 0) {
    const derived = Math.abs(Math.round(subtotal / unit));
    if (derived > 0) return derived;
  }

  return 1;
}

/** Catalog / charged unit for the Unit Price column (positive only). */
export function resolveInvoiceUnitPrice(line: InvoiceBreakdownLine): number | null {
  for (const raw of [line.original_unit_price, line.unit_price]) {
    const n = typeof raw === 'number' ? raw : Number(raw);
    if (Number.isFinite(n) && n > 0) {
      return Math.round(n * 100) / 100;
    }
  }
  return null;
}

/** Net Total = final line subtotal after discounts. */
export function resolveInvoiceNetTotal(
  line: InvoiceBreakdownLine,
  unit: number | null = resolveInvoiceUnitPrice(line),
  qty: number = resolveBilledQuantity(line),
): number {
  const sub = Number(line.subtotal);
  if (Number.isFinite(sub)) {
    return Math.round(sub * 100) / 100;
  }
  if (unit != null && unit > 0) {
    return Math.round(unit * qty * 100) / 100;
  }
  return 0;
}

/** Discount Amount = (Unit Price × Qty) − Net Total. */
export function resolveInvoiceDiscountAmount(
  unit: number | null,
  qty: number,
  netTotal: number,
): number {
  if (unit == null || unit <= 0) return 0;
  const gross = Math.round(unit * qty * 100) / 100;
  const saved = Math.round((gross - netTotal) * 100) / 100;
  return saved > 0 ? saved : 0;
}

/** Map one breakdown line to invoice preview columns (no merge / no label parsing). */
export function mapInvoiceLineColumns(line: InvoiceBreakdownLine): {
  qty: number;
  unitPrice: number | null;
  discountText: string;
  total: number;
} {
  const qty = resolveBilledQuantity(line);
  const unitPrice = resolveInvoiceUnitPrice(line);
  const total = resolveInvoiceNetTotal(line, unitPrice, qty);
  const discountAmount = resolveInvoiceDiscountAmount(unitPrice, qty, total);
  return {
    qty,
    unitPrice,
    discountText: formatInvoiceDiscountAmount(discountAmount),
    total,
  };
}

export function mapReceiptDescription(line: InvoiceBreakdownLine): string {
  const key = String(line.key ?? '');
  const label = String(line.label ?? key).trim();
  const product = String(line.product ?? '');

  if (key === 'base' && product === 'premiere_suite') {
    return 'Basic Suite Service Rate';
  }
  if (key === 'base' && product === 'lounge_deluxe') {
    return 'VIP Passenger ( Adult )';
  }
  if (/child/i.test(key) || /child/i.test(label)) {
    return 'VIP Passenger ( Children )';
  }
  // Only rename limousine rows — other add-ons keep their own label
  // (Wheelchair, Champagne, etc. must not become "Airport Limousine Service").
  if (key === 'add_on_limousine' || /limousine/i.test(key) || /limousine/i.test(label)) {
    return 'Airport Limousine Service';
  }
  return label || 'Item';
}

export function productGroupTitle(product: string): string {
  if (product === 'premiere_suite') return 'Premiere Suite';
  if (product === 'lounge_deluxe') return 'Lounge Deluxe';
  if (product === 'pos_fnb' || product === '') return 'Others';
  return product
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildVipPassengerSummary(
  passengers?: Array<{
    title?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }> | null,
): string | null {
  if (!Array.isArray(passengers) || passengers.length === 0) return null;
  const names = passengers
    .map((p) => {
      const parts = [p.title, p.firstName, p.lastName]
        .map((part) => (typeof part === 'string' ? part.trim() : ''))
        .filter(Boolean);
      return parts.join(' ');
    })
    .filter(Boolean);
  if (names.length === 0) return null;
  return `(VIP: ${names.join(', ')})`;
}

/**
 * Group invoice snapshot lines by product category, matching the
 * PDF `buildReceiptSuiteGroupsFromProducts` fallback order.
 */
export function groupInvoiceBreakdownLines(
  breakdown: InvoiceBreakdownLine[] | undefined,
  options?: { vipSummary?: string | null; invoiceType?: string },
): InvoicePreviewGroup[] {
  const lines = Array.isArray(breakdown) ? breakdown : [];
  if (lines.length === 0) {
    return [];
  }

  const toPreview = (line: InvoiceBreakdownLine): InvoicePreviewLine => {
    const columns = mapInvoiceLineColumns(line);
    return {
      description: mapReceiptDescription(line),
      qty: columns.qty,
      unitPrice: columns.unitPrice,
      discountText: columns.discountText,
      total: columns.total,
      detail: null,
    };
  };

  if (options?.invoiceType === 'pos_fnb') {
    return [{
      title: 'Food & Beverage',
      product: 'pos_fnb',
      lines: lines.map(toPreview),
    }];
  }

  const groups: InvoicePreviewGroup[] = [
    { title: 'Premiere Suite', product: 'premiere_suite', lines: [] },
    { title: 'Lounge Deluxe', product: 'lounge_deluxe', lines: [] },
  ];
  const others: InvoicePreviewLine[] = [];

  for (const line of lines) {
    const product = String(line.product ?? '');
    const mapped = toPreview(line);
    if (product === 'premiere_suite') {
      groups[0].lines.push(mapped);
    } else if (product === 'lounge_deluxe') {
      groups[1].lines.push(mapped);
    } else {
      others.push(mapped);
    }
  }

  const result = groups.filter((g) => g.lines.length > 0);
  if (others.length > 0) {
    result.push({ title: 'Others', product: '', lines: others });
  }
  return result;
}
