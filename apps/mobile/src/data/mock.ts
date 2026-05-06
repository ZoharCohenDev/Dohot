import type { DocumentType, DocumentStatus } from '@/navigation/types';

export interface MockCustomer {
  id: string;
  name: string;
  phone: string;
  address: string;
  lastContact: string;
  tag: string;
}

export interface MockDocument {
  id: string;
  type: DocumentType;
  title: string;
  customer: string;
  date: string;
  status: DocumentStatus;
  amount?: number;
}

export const MOCK_CUSTOMERS: MockCustomer[] = [
  { id: '1', name: 'יוסי לוי', phone: '054-1234567', address: 'תל אביב, דיזנגוף 45', lastContact: 'היום', tag: 'פעיל' },
  { id: '2', name: 'שרה כהן', phone: '052-9876543', address: 'רמת גן, ביאליק 12', lastContact: 'אתמול', tag: 'חדש' },
  { id: '3', name: 'דוד מזרחי', phone: '050-1111222', address: 'פתח תקווה, בן גוריון 78', lastContact: '3 ימים', tag: 'פעיל' },
  { id: '4', name: 'רחל אברהם', phone: '053-3334444', address: 'הרצליה, סוקולוב 23', lastContact: 'שבוע', tag: 'ממתין' },
  { id: '5', name: 'אלון ברק', phone: '058-5556666', address: 'נתניה, הרצל 5', lastContact: '2 שבועות', tag: 'פעיל' },
  { id: '6', name: 'מיכל שמיר', phone: '054-7778888', address: 'חיפה, הנמל 3', lastContact: 'חודש', tag: 'ישן' },
];

export const MOCK_DOCUMENTS: MockDocument[] = [
  { id: '1', type: 'report', title: 'דוח גילוי נזילה — דירת קוטון', customer: 'יוסי לוי', date: 'היום', status: 'sent' },
  { id: '2', type: 'quote', title: 'הצעת מחיר — בניין מנשה 14', customer: 'שרה כהן', date: 'אתמול', status: 'pending', amount: 4200 },
  { id: '3', type: 'report', title: 'דוח איטום גג — משפחת לוי', customer: 'דוד מזרחי', date: '3 ימים', status: 'signed' },
  { id: '4', type: 'agreement', title: 'הסכם עבודה — שיפוץ חדר אמבטיה', customer: 'רחל אברהם', date: '5 ימים', status: 'draft' },
  { id: '5', type: 'quote', title: 'הצעת מחיר — צנרת ראשית', customer: 'אלון ברק', date: 'שבוע', status: 'approved', amount: 8900 },
  { id: '6', type: 'report', title: 'דוח בעיית צנרת — מגדל המים', customer: 'מיכל שמיר', date: '10 ימים', status: 'sent' },
  { id: '7', type: 'worklog', title: 'תיעוד עבודה — חדר מדרגות', customer: 'יוסי לוי', date: 'חודש', status: 'sent' },
];

export const MOCK_PROFESSIONAL = {
  name: 'דניאל כהן',
  businessName: 'כהן גילוי נזילות',
  phone: '054-2837461',
  profession: 'גילוי נזילות',
  licenseNumber: '514283746',
};
