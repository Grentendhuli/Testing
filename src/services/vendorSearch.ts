export type VendorCategory =
  | 'plumber'
  | 'electrician'
  | 'hvac'
  | 'locksmith'
  | 'exterminator'
  | 'roofer'
  | 'contractor'
  | 'painter';

const LABELS: Record<VendorCategory, string> = {
  plumber: 'plumber',
  electrician: 'electrician',
  hvac: 'hvac contractor',
  locksmith: 'locksmith',
  exterminator: 'pest control',
  roofer: 'roofing contractor',
  contractor: 'general contractor',
  painter: 'house painter',
};

export function openVendorSearch(
  category: VendorCategory,
  address: string
): void {
  const q = encodeURIComponent(`${LABELS[category]} near ${address} NYC`);
  window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
}
