import type { DocumentType } from '@dohot/shared';

// UI-level document type — separate from the DB DocumentType
export type DocType = 'report' | 'quote' | 'warranty';

// Wizard step identifiers — each maps 1-to-1 to a filename in app/(app)/wizard/
export type WizardStep =
  | 'customer'
  | 'issue'
  | 'photos'
  | 'voice-idle'
  | 'voice'
  | 'transcript'
  | 'processing'
  | 'recommendations'
  | 'quote-items'
  | 'warranty-terms'
  | 'preview'
  | 'send';

export interface DocumentTypeConfig {
  id: DocType;
  dbType: DocumentType;          // maps to DB documents.type
  label: string;
  desc: string;
  detail: string;
  hasAI: boolean;
  steps: WizardStep[];           // ordered wizard steps
  progressSteps: WizardStep[];   // steps shown in the progress bar (excludes transitions)
  titlePrefix: string;           // document title prefix (e.g. "דוח בדיקה –")
  filenameLabel: string;         // label used in generated PDF filename (e.g. "דוח בדיקה")
  customerNextLabel: string;     // CTA on customer screen
}

export const DOCUMENT_TYPES: Record<DocType, DocumentTypeConfig> = {
  report: {
    id: 'report',
    dbType: 'report',
    label: 'דוח מקצועי',
    desc: 'תיעוד ממצאים והמלצות',
    detail: 'בדיקת שטח, גילוי ליקויים, המלצות מקצועיות',
    hasAI: true,
    steps: ['customer', 'issue', 'photos', 'voice-idle', 'voice', 'transcript', 'processing', 'recommendations', 'preview', 'send'],
    progressSteps: ['customer', 'issue', 'photos', 'recommendations', 'preview'],
    titlePrefix: 'דוח בדיקה –',
    filenameLabel: 'דוח בדיקה',
    customerNextLabel: 'המשך לסוג תקלה',
  },
  quote: {
    id: 'quote',
    dbType: 'quote',
    label: 'הצעת מחיר',
    desc: 'פירוט עבודות ומחירים',
    detail: 'חישוב אוטומטי מע"מ וסה"כ',
    hasAI: false,
    steps: ['customer', 'quote-items', 'preview', 'send'],
    progressSteps: ['customer', 'quote-items', 'preview'],
    titlePrefix: 'הצעת מחיר –',
    filenameLabel: 'הצעת מחיר',
    customerNextLabel: 'המשך לפריטי עבודה',
  },
  warranty: {
    id: 'warranty',
    dbType: 'agreement',
    label: 'תעודת אחריות',
    desc: 'ערובה לעבודה שבוצעה',
    detail: 'הנפקת אחריות ללקוח עם תנאים',
    hasAI: false,
    steps: ['customer', 'warranty-terms', 'preview', 'send'],
    progressSteps: ['customer', 'warranty-terms', 'preview'],
    titlePrefix: 'תעודת אחריות –',
    filenameLabel: 'תעודת אחריות',
    customerNextLabel: 'המשך לתנאי אחריות',
  },
};

// Route paths for each step
export const STEP_ROUTES: Record<WizardStep, string> = {
  'customer':        '/(app)/wizard/customer',
  'issue':           '/(app)/wizard/issue',
  'photos':          '/(app)/wizard/photos',
  'voice-idle':      '/(app)/wizard/voice-idle',
  'voice':           '/(app)/wizard/voice',
  'transcript':      '/(app)/wizard/transcript',
  'processing':      '/(app)/wizard/processing',
  'recommendations': '/(app)/wizard/recommendations',
  'quote-items':     '/(app)/wizard/quote-items',
  'warranty-terms':  '/(app)/wizard/warranty-terms',
  'preview':         '/(app)/wizard/preview',
  'send':            '/(app)/wizard/send',
};
