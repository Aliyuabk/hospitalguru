export type Drug = { id: number; name: string; category: string; sku: string; price: number; stock: number; unit: string; color: string };
export const drugs: Drug[] = [
  { id: 1, name: 'Paracetamol 500mg', category: 'Pain relief', sku: 'MED-0001', price: 850, stock: 140, unit: 'Tablet', color: 'bg-rose-50 text-rose-700' },
  { id: 2, name: 'Amoxicillin 250mg', category: 'Antibiotic', sku: 'MED-0002', price: 1600, stock: 86, unit: 'Capsule', color: 'bg-amber-50 text-amber-700' },
  { id: 3, name: 'Vitamin C 1000mg', category: 'Supplements', sku: 'MED-0003', price: 6000, stock: 34, unit: 'Pack', color: 'bg-emerald-50 text-emerald-700' },
  { id: 4, name: 'Artemether/Lumefantrine', category: 'Antimalarial', sku: 'MED-0004', price: 3500, stock: 63, unit: 'Pack', color: 'bg-blue-50 text-blue-700' },
  { id: 5, name: 'Cetirizine 10mg', category: 'Allergy', sku: 'MED-0005', price: 1200, stock: 9, unit: 'Tablet', color: 'bg-violet-50 text-violet-700' },
  { id: 6, name: 'Omeprazole 20mg', category: 'Digestive health', sku: 'MED-0006', price: 2200, stock: 56, unit: 'Capsule', color: 'bg-orange-50 text-orange-700' },
  { id: 7, name: 'ORS Sachets', category: 'Rehydration', sku: 'MED-0007', price: 500, stock: 112, unit: 'Sachet', color: 'bg-cyan-50 text-cyan-700' },
  { id: 8, name: 'Ibuprofen 400mg', category: 'Pain relief', sku: 'MED-0008', price: 1100, stock: 74, unit: 'Tablet', color: 'bg-pink-50 text-pink-700' }
];
export const patients = [{ folder: 'BKD/2024/00123', name: 'Amina Yusuf', phone: '0803 456 7890', nhis: 'NHIS-008194' }, { folder: 'BKD/2024/00124', name: 'Chinedu Okafor', phone: '0806 321 5501', nhis: 'NHIS-008207' }, { folder: 'BKD/2023/00981', name: 'Fatima Ibrahim', phone: '0701 890 4412', nhis: 'NHIS-006543' }];
export const formatNaira = (amount: number) => `₦${Number(amount || 0).toLocaleString('en-NG')}`;
