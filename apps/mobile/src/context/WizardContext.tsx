import React, { createContext, useContext, useState } from 'react';
import type { PropertyType, Recommendation } from '@dohot/shared';
import type { DocType } from '@/config/documentTypes';
import {
  upsertCustomer,
  createDraftDocument,
  upsertReport,
  upsertQuoteItems,
  type CustomerFields,
} from '@/services/documents';
import { DOCUMENT_TYPES } from '@/config/documentTypes';

export interface WizardQuoteItem {
  key: string;
  title: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export interface ReportIssue {
  id: string;
  issueType: string;
  issueLabel: string;
  issueNote: string;
  photos: string[];
  description: string; // voice transcript + manual edits (pre-AI)
  aiSummary: string;
  recommendations: Recommendation[];
}

export interface WaResident {
  id: string;
  fullName: string;
  phone: string;
  apartment: string;
  floor: string;
  notes: string;
}

export interface WaWorkClause {
  id: string;
  text: string;
}

export interface WaWorkItem {
  id: string;
  title: string;
  clauses: WaWorkClause[];
}

export interface WaPaymentTerm {
  id: string;
  text: string;
}

const DEFAULT_WARRANTY_CONDITIONS = [
  'האחריות חלה על עבודת ההתקנה / התיקון שבוצעה.',
  'האחריות אינה חלה על נזקים הנגרמים מכוח עליון, שימוש לרעה או פגיעה מכוונת.',
  'תיקונים שנעשו על ידי גורם שלישי מבטלים את האחריות.',
];

const DEFAULT_WA_PAYMENT_TERMS = [
  '50% מקדמה לפני תחילת העבודה.',
  '50% יתרה עם סיום העבודה ומסירתה.',
];

function todayString(): string {
  return new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function newIssue(id: string): ReportIssue {
  return {
    id,
    issueType: 'leak',
    issueLabel: 'גילוי נזילה',
    issueNote: '',
    photos: [],
    description: '',
    aiSummary: '',
    recommendations: [],
  };
}

function updateIssueAt(
  issues: ReportIssue[],
  index: number,
  patch: Partial<ReportIssue>
): ReportIssue[] {
  return issues.map((issue, i) => (i === index ? { ...issue, ...patch } : issue));
}

interface WizardState {
  docType: DocType;
  // Customer
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerCity: string;
  customerStreet: string;
  customerHouseNumber: string;
  customerApartment: string;
  customerFloor: string;
  customerAddress: string;
  // Report visit metadata
  propertyType: PropertyType;
  attendees: string;
  inspectionDate: string;
  // Multi-issue report data
  reportIssues: ReportIssue[];
  currentIssueIndex: number;
  // Temp: current recording (not per-issue — cleared when adding a new issue)
  recordedAudioUri: string;
  // Quote
  quoteItems: WizardQuoteItem[];
  quoteNotes: string;
  quoteValidityDate: string;
  // Warranty
  warrantyDuration: string;
  warrantyConditions: string[];
  warrantyWorkDescription: string;
  // Work Agreement
  waResidents: WaResident[];
  waWorkItems: WaWorkItem[];
  waTotalPrice: string;
  waPaymentTerms: WaPaymentTerm[];
  // Output
  documentId: string | null;
  pdfUrl: string | null;
}

type SaveDocumentOverrides = {
  quoteItems?: WizardQuoteItem[];
  quoteNotes?: string;
  quoteValidityDate?: string;
  warrantyDuration?: string;
  warrantyConditions?: string[];
  warrantyWorkDescription?: string;
  waPaymentTerms?: WaPaymentTerm[];
};

interface WizardContextValue {
  state: WizardState;
  currentIssue: ReportIssue;
  saving: boolean;
  setDocType: (t: DocType) => void;
  setCustomer: (fields: CustomerFields) => void;
  setPropertyType: (t: PropertyType) => void;
  setAttendees: (attendees: string) => void;
  setInspectionDate: (date: string) => void;
  // Current issue operations
  setIssueData: (type: string, label: string) => void;
  setIssueNote: (note: string) => void;
  addPhoto: (uri: string) => void;
  removePhoto: (uri: string) => void;
  replacePhoto: (oldUri: string, newUri: string) => void;
  setRecordedAudioUri: (uri: string) => void;
  setVoiceTranscript: (text: string) => void;
  setAiResult: (summary: string, recommendations: Recommendation[]) => void;
  setRecommendations: (recs: Recommendation[]) => void;
  // Multi-issue
  addNewIssue: () => void;
  setAiResultForIssue: (index: number, aiSummary: string, recs: Recommendation[]) => void;
  setAllAiResults: (
    results: { index: number; aiSummary: string; recommendations: Recommendation[] }[]
  ) => void;
  setAllIssueRecommendations: (
    updates: { index: number; aiSummary: string; recs: Recommendation[] }[]
  ) => void;
  // Quote
  setQuoteItems: (items: WizardQuoteItem[]) => void;
  setQuoteNotes: (n: string) => void;
  setQuoteValidityDate: (date: string) => void;
  // Warranty
  setWarrantyData: (duration: string, conditions: string[], workDescription: string) => void;
  // Work Agreement
  setWaResidents: (residents: WaResident[]) => void;
  setWaWorkItems: (items: WaWorkItem[]) => void;
  setWaTotalPrice: (price: string) => void;
  setWaPaymentTerms: (terms: WaPaymentTerm[]) => void;
  // Document
  initDraft: (professionalId: string, fields: CustomerFields) => Promise<void>;
  saveDocument: (professionalId: string, overrides?: SaveDocumentOverrides) => Promise<void>;
  setPdfUrl: (url: string) => void;
  reset: () => void;
}

const DEFAULT_STATE: WizardState = {
  docType: 'report',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerCity: '',
  customerStreet: '',
  customerHouseNumber: '',
  customerApartment: '',
  customerFloor: '',
  customerAddress: '',
  propertyType: 'apartment',
  attendees: '',
  inspectionDate: todayString(),
  reportIssues: [newIssue('1')],
  currentIssueIndex: 0,
  recordedAudioUri: '',
  quoteItems: [],
  quoteNotes: '',
  quoteValidityDate: '',
  warrantyDuration: '12 חודשים',
  warrantyConditions: DEFAULT_WARRANTY_CONDITIONS,
  warrantyWorkDescription: '',
  waResidents: [],
  waWorkItems: [{ id: '1', title: '', clauses: [{ id: '1-1', text: '' }] }],
  waTotalPrice: '',
  waPaymentTerms: DEFAULT_WA_PAYMENT_TERMS.map((text, i) => ({ id: String(i + 1), text })),
  documentId: null,
  pdfUrl: null,
};

const WizardContext = createContext<WizardContextValue>({
  state: DEFAULT_STATE,
  currentIssue: newIssue('1'),
  saving: false,
  setDocType: () => {},
  setCustomer: () => {},
  setPropertyType: () => {},
  setAttendees: () => {},
  setInspectionDate: () => {},
  setIssueData: () => {},
  setIssueNote: () => {},
  addPhoto: () => {},
  removePhoto: () => {},
  replacePhoto: () => {},
  setRecordedAudioUri: () => {},
  setVoiceTranscript: () => {},
  setAiResult: () => {},
  setRecommendations: () => {},
  addNewIssue: () => {},
  setAiResultForIssue: () => {},
  setAllAiResults: () => {},
  setAllIssueRecommendations: () => {},
  setQuoteItems: () => {},
  setQuoteNotes: () => {},
  setQuoteValidityDate: () => {},
  setWarrantyData: () => {},
  setWaResidents: () => {},
  setWaWorkItems: () => {},
  setWaTotalPrice: () => {},
  setWaPaymentTerms: () => {},
  initDraft: async () => {},
  saveDocument: async () => {},
  setPdfUrl: () => {},
  reset: () => {},
});

function docTitle(docType: DocType, customerName: string): string {
  return `${DOCUMENT_TYPES[docType].titlePrefix} ${customerName}`;
}

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WizardState>(DEFAULT_STATE);
  const [saving, setSaving] = useState(false);

  const currentIssue = state.reportIssues[state.currentIssueIndex] ?? newIssue('1');

  const setDocType = (docType: DocType) => setState((s) => ({ ...s, docType }));

  const setCustomer = (fields: CustomerFields) =>
    setState((s) => ({
      ...s,
      customerName: fields.name,
      customerPhone: fields.phone,
      customerEmail: fields.email,
      customerCity: fields.city,
      customerStreet: fields.street,
      customerHouseNumber: fields.houseNumber,
      customerApartment: fields.apartment,
      customerFloor: fields.floor,
      customerAddress: [[fields.street, fields.houseNumber].filter(Boolean).join(' '), fields.city]
        .filter(Boolean)
        .join(', '),
    }));

  const setPropertyType = (propertyType: PropertyType) => setState((s) => ({ ...s, propertyType }));

  const setAttendees = (attendees: string) => setState((s) => ({ ...s, attendees }));

  const setInspectionDate = (inspectionDate: string) => setState((s) => ({ ...s, inspectionDate }));

  // ── Current issue operations ──────────────────────────────────────────────

  const setIssueData = (issueType: string, issueLabel: string) =>
    setState((s) => ({
      ...s,
      reportIssues: updateIssueAt(s.reportIssues, s.currentIssueIndex, { issueType, issueLabel }),
    }));

  const setIssueNote = (issueNote: string) =>
    setState((s) => ({
      ...s,
      reportIssues: updateIssueAt(s.reportIssues, s.currentIssueIndex, { issueNote }),
    }));

  const addPhoto = (uri: string) =>
    setState((s) => ({
      ...s,
      reportIssues: updateIssueAt(s.reportIssues, s.currentIssueIndex, {
        photos: [...(s.reportIssues[s.currentIssueIndex]?.photos ?? []), uri],
      }),
    }));

  const removePhoto = (uri: string) =>
    setState((s) => ({
      ...s,
      reportIssues: updateIssueAt(s.reportIssues, s.currentIssueIndex, {
        photos: (s.reportIssues[s.currentIssueIndex]?.photos ?? []).filter((p) => p !== uri),
      }),
    }));

  const replacePhoto = (oldUri: string, newUri: string) =>
    setState((s) => ({
      ...s,
      reportIssues: updateIssueAt(s.reportIssues, s.currentIssueIndex, {
        photos: (s.reportIssues[s.currentIssueIndex]?.photos ?? []).map((p) =>
          p === oldUri ? newUri : p
        ),
      }),
    }));

  const setRecordedAudioUri = (recordedAudioUri: string) =>
    setState((s) => ({ ...s, recordedAudioUri }));

  const setVoiceTranscript = (description: string) =>
    setState((s) => ({
      ...s,
      reportIssues: updateIssueAt(s.reportIssues, s.currentIssueIndex, { description }),
    }));

  const setAiResult = (aiSummary: string, recommendations: Recommendation[]) =>
    setState((s) => ({
      ...s,
      reportIssues: updateIssueAt(s.reportIssues, s.currentIssueIndex, {
        aiSummary,
        recommendations,
      }),
    }));

  const setRecommendations = (recommendations: Recommendation[]) =>
    setState((s) => ({
      ...s,
      reportIssues: updateIssueAt(s.reportIssues, s.currentIssueIndex, { recommendations }),
    }));

  // ── Multi-issue operations ────────────────────────────────────────────────

  const addNewIssue = () =>
    setState((s) => {
      const newIndex = s.reportIssues.length;
      return {
        ...s,
        reportIssues: [...s.reportIssues, newIssue(String(newIndex + 1))],
        currentIssueIndex: newIndex,
        recordedAudioUri: '',
      };
    });

  const setAiResultForIssue = (
    index: number,
    aiSummary: string,
    recommendations: Recommendation[]
  ) =>
    setState((s) => ({
      ...s,
      reportIssues: updateIssueAt(s.reportIssues, index, { aiSummary, recommendations }),
    }));

  const setAllAiResults = (
    results: { index: number; aiSummary: string; recommendations: Recommendation[] }[]
  ) =>
    setState((s) => {
      let issues = s.reportIssues;
      for (const { index, aiSummary, recommendations } of results) {
        issues = updateIssueAt(issues, index, { aiSummary, recommendations });
      }
      return { ...s, reportIssues: issues };
    });

  const setAllIssueRecommendations = (
    updates: { index: number; aiSummary: string; recs: Recommendation[] }[]
  ) =>
    setState((s) => {
      let issues = s.reportIssues;
      for (const { index, aiSummary, recs } of updates) {
        issues = updateIssueAt(issues, index, { aiSummary, recommendations: recs });
      }
      return { ...s, reportIssues: issues };
    });

  // ── Quote operations ──────────────────────────────────────────────────────

  const setQuoteItems = (quoteItems: WizardQuoteItem[]) => setState((s) => ({ ...s, quoteItems }));

  const setQuoteNotes = (quoteNotes: string) => setState((s) => ({ ...s, quoteNotes }));

  const setQuoteValidityDate = (quoteValidityDate: string) =>
    setState((s) => ({ ...s, quoteValidityDate }));

  // ── Warranty operations ───────────────────────────────────────────────────

  const setWarrantyData = (
    warrantyDuration: string,
    warrantyConditions: string[],
    warrantyWorkDescription: string
  ) => setState((s) => ({ ...s, warrantyDuration, warrantyConditions, warrantyWorkDescription }));

  // ── Work Agreement operations ─────────────────────────────────────────────

  const setWaResidents = (waResidents: WaResident[]) => setState((s) => ({ ...s, waResidents }));

  const setWaWorkItems = (waWorkItems: WaWorkItem[]) => setState((s) => ({ ...s, waWorkItems }));

  const setWaTotalPrice = (waTotalPrice: string) => setState((s) => ({ ...s, waTotalPrice }));

  const setWaPaymentTerms = (waPaymentTerms: WaPaymentTerm[]) =>
    setState((s) => ({ ...s, waPaymentTerms }));

  // ── Document operations ───────────────────────────────────────────────────

  const setPdfUrl = (pdfUrl: string) => setState((s) => ({ ...s, pdfUrl }));

  const reset = () => setState({ ...DEFAULT_STATE, inspectionDate: todayString() });

  const initDraft = async (professionalId: string, fields: CustomerFields): Promise<void> => {
    try {
      const customer = await upsertCustomer(professionalId, {
        ...fields,
        name: fields.name || 'לא צוין',
      });
      const title = docTitle(state.docType, customer.name);
      const dbType = DOCUMENT_TYPES[state.docType].dbType;
      const doc = await createDraftDocument(professionalId, customer.id, title, dbType);
      setState((s) => ({ ...s, documentId: doc.id }));
    } catch (error) {
      console.error('[Wizard] initDraft failed:', error);
    }
  };

  const saveDocument = async (
    professionalId: string,
    overrides: SaveDocumentOverrides = {}
  ): Promise<void> => {
    if (saving) return;
    setSaving(true);
    try {
      let docId = state.documentId;

      if (!docId) {
        const customer = await upsertCustomer(professionalId, {
          name: state.customerName || 'לא צוין',
          phone: state.customerPhone,
          email: state.customerEmail,
          city: state.customerCity,
          street: state.customerStreet,
          houseNumber: state.customerHouseNumber,
          apartment: state.customerApartment,
          floor: state.customerFloor,
        });
        const title = docTitle(state.docType, customer.name);
        const dbType = DOCUMENT_TYPES[state.docType].dbType;
        const doc = await createDraftDocument(professionalId, customer.id, title, dbType);
        docId = doc.id;
      }

      if (state.docType === 'report') {
        const issues = state.reportIssues;
        const first = issues[0] ?? newIssue('1');
        await upsertReport(docId, {
          propertyType: state.propertyType,
          issueType: first.issueType,
          issueNote: [
            state.attendees ? `נוכחים: ${state.attendees}` : '',
            ...issues.map((issue) => `[${issue.issueLabel}]\n${issue.issueNote}`.trim()),
          ]
            .filter(Boolean)
            .join('\n\n'),
          photos: issues.flatMap((issue) => issue.photos),
          voiceTranscript: issues
            .map((issue) => `[${issue.issueLabel}]\n${issue.description}`)
            .join('\n\n---\n\n'),
          aiSummary: issues
            .map((issue) => `[${issue.issueLabel}]\n${issue.aiSummary || issue.description}`)
            .join('\n\n---\n\n'),
          recommendations: issues.flatMap((issue) => issue.recommendations),
        });
      } else if (state.docType === 'quote') {
        const quoteItems = overrides.quoteItems ?? state.quoteItems;
        const total = quoteItems.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
        await upsertQuoteItems(docId, quoteItems, total);
      } else if (state.docType === 'warranty') {
        const issue = state.reportIssues[0] ?? newIssue('1');

        await upsertReport(docId, {
          propertyType: state.propertyType,
          issueType: overrides.warrantyDuration ?? state.warrantyDuration,
          issueNote: (overrides.warrantyConditions ?? state.warrantyConditions).join('\n'),
          photos: issue.photos,
          voiceTranscript: '',
          aiSummary: overrides.warrantyWorkDescription ?? state.warrantyWorkDescription,
          recommendations: [],
        });
      } else if (state.docType === 'work-agreement') {
        const itemCount = state.waWorkItems.filter((i) => i.title.trim()).length;
        await upsertReport(docId, {
          propertyType: state.propertyType,
          issueType: 'other',
          issueNote: JSON.stringify({
            residents: state.waResidents,
            workItems: state.waWorkItems,
            totalPrice: state.waTotalPrice,
            paymentTerms: overrides.waPaymentTerms ?? state.waPaymentTerms,
          }),
          photos: [],
          voiceTranscript: '',
          aiSummary: `הסכם עבודה | ${itemCount} עבודות | סה"כ: ₪${state.waTotalPrice || '0'}`,
          recommendations: [],
        });
      }

      setState((s) => ({ ...s, documentId: docId! }));
    } catch (error) {
      console.error('[Wizard] saveDocument failed:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return (
    <WizardContext.Provider
      value={{
        state,
        currentIssue,
        saving,
        setDocType,
        setCustomer,
        setPropertyType,
        setAttendees,
        setInspectionDate,
        setIssueData,
        setIssueNote,
        addPhoto,
        removePhoto,
        replacePhoto,
        setRecordedAudioUri,
        setVoiceTranscript,
        setAiResult,
        setRecommendations,
        addNewIssue,
        setAiResultForIssue,
        setAllAiResults,
        setAllIssueRecommendations,
        setQuoteItems,
        setQuoteNotes,
        setQuoteValidityDate,
        setWarrantyData,
        setWaResidents,
        setWaWorkItems,
        setWaTotalPrice,
        setWaPaymentTerms,
        initDraft,
        saveDocument,
        setPdfUrl,
        reset,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  return useContext(WizardContext);
}
