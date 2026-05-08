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
  key: string;       // local React key (not saved to DB)
  title: string;
  description: string;
  qty: number;
  unitPrice: number;
}

interface WizardState {
  docType: DocType;
  // Customer (shared)
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerCity: string;
  customerStreet: string;
  customerHouseNumber: string;
  customerApartment: string;
  customerFloor: string;
  customerAddress: string;  // legacy formatted string
  // Report-specific
  propertyType: PropertyType;
  issueType: string;      // profession-specific issue ID
  issueLabel: string;     // Hebrew label used in AI prompt + PDF
  issueNote: string;
  photos: string[];
  voiceTranscript: string;
  aiSummary: string;
  recommendations: Recommendation[];
  // Quote-specific
  quoteItems: WizardQuoteItem[];
  quoteNotes: string;
  // Warranty-specific
  warrantyDuration: string;
  warrantyConditions: string;
  warrantyWorkDescription: string;
  // Shared output
  documentId: string | null;
  pdfUrl: string | null;
}

interface WizardContextValue {
  state: WizardState;
  saving: boolean;
  setDocType: (t: DocType) => void;
  setCustomer: (fields: CustomerFields) => void;
  setPropertyType: (t: PropertyType) => void;
  setIssueData: (id: string, label: string) => void;
  setIssueNote: (n: string) => void;
  addPhoto: (uri: string) => void;
  removePhoto: (uri: string) => void;
  setVoiceTranscript: (t: string) => void;
  setAiResult: (summary: string, recommendations: Recommendation[]) => void;
  setRecommendations: (recs: Recommendation[]) => void;
  setQuoteItems: (items: WizardQuoteItem[]) => void;
  setQuoteNotes: (n: string) => void;
  setWarrantyData: (duration: string, conditions: string, workDescription: string) => void;
  initDraft: (professionalId: string, fields: CustomerFields) => Promise<void>;
  saveDocument: (professionalId: string) => Promise<void>;
  setPdfUrl: (url: string) => void;
  reset: () => void;
}

const DEFAULT: WizardState = {
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
  issueType: 'leak',
  issueLabel: 'גילוי נזילה',
  issueNote: '',
  photos: [],
  voiceTranscript: '',
  aiSummary: '',
  recommendations: [],
  quoteItems: [],
  quoteNotes: '',
  warrantyDuration: '12 חודשים',
  warrantyConditions: '',
  warrantyWorkDescription: '',
  documentId: null,
  pdfUrl: null,
};

const WizardContext = createContext<WizardContextValue>({
  state: DEFAULT,
  saving: false,
  setDocType: () => {},
  setCustomer: (_f: CustomerFields) => {},
  setPropertyType: () => {},
  setIssueData: () => {},
  setIssueNote: () => {},
  addPhoto: () => {},
  removePhoto: () => {},
  setVoiceTranscript: () => {},
  setAiResult: () => {},
  setRecommendations: () => {},
  setQuoteItems: () => {},
  setQuoteNotes: () => {},
  setWarrantyData: () => {},
  initDraft: async () => {},
  saveDocument: async () => {},
  setPdfUrl: () => {},
  reset: () => {},
});

function docTitle(docType: DocType, customerName: string): string {
  return `${DOCUMENT_TYPES[docType].titlePrefix} ${customerName}`;
}

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WizardState>(DEFAULT);
  const [saving, setSaving] = useState(false);

  const setDocType = (docType: DocType) =>
    setState((s) => ({ ...s, docType }));

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
      customerAddress: [
        [fields.street, fields.houseNumber].filter(Boolean).join(' '),
        fields.city,
      ].filter(Boolean).join(', '),
    }));

  const setPropertyType = (propertyType: PropertyType) =>
    setState((s) => ({ ...s, propertyType }));

  const setIssueData = (issueType: string, issueLabel: string) =>
    setState((s) => ({ ...s, issueType, issueLabel }));

  const setIssueNote = (issueNote: string) =>
    setState((s) => ({ ...s, issueNote }));

  const addPhoto = (uri: string) =>
    setState((s) => ({ ...s, photos: [...s.photos, uri] }));

  const removePhoto = (uri: string) =>
    setState((s) => ({ ...s, photos: s.photos.filter((p) => p !== uri) }));

  const setVoiceTranscript = (voiceTranscript: string) =>
    setState((s) => ({ ...s, voiceTranscript }));

  const setAiResult = (aiSummary: string, recommendations: Recommendation[]) =>
    setState((s) => ({ ...s, aiSummary, recommendations }));

  const setRecommendations = (recommendations: Recommendation[]) =>
    setState((s) => ({ ...s, recommendations }));

  const setQuoteItems = (quoteItems: WizardQuoteItem[]) =>
    setState((s) => ({ ...s, quoteItems }));

  const setQuoteNotes = (quoteNotes: string) =>
    setState((s) => ({ ...s, quoteNotes }));

  const setWarrantyData = (warrantyDuration: string, warrantyConditions: string, warrantyWorkDescription: string) =>
    setState((s) => ({ ...s, warrantyDuration, warrantyConditions, warrantyWorkDescription }));

  const setPdfUrl = (pdfUrl: string) =>
    setState((s) => ({ ...s, pdfUrl }));

  const reset = () => setState(DEFAULT);

  const initDraft = async (
    professionalId: string,
    fields: CustomerFields,
  ): Promise<void> => {
    try {
      const customer = await upsertCustomer(professionalId, { ...fields, name: fields.name || 'לא צוין' });
      const title = docTitle(state.docType, customer.name);
      const dbType = DOCUMENT_TYPES[state.docType].dbType;
      const doc = await createDraftDocument(professionalId, customer.id, title, dbType);
      setState((s) => ({ ...s, documentId: doc.id }));
    } catch {
      // Silently swallow — saveDocument will retry
    }
  };

  const saveDocument = async (professionalId: string): Promise<void> => {
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
        await upsertReport(docId, {
          propertyType: state.propertyType,
          issueType: state.issueType,
          issueNote: state.issueNote,
          photos: state.photos,
          voiceTranscript: state.voiceTranscript,
          aiSummary: state.aiSummary,
          recommendations: state.recommendations,
        });
      } else if (state.docType === 'quote') {
        const total = state.quoteItems.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
        await upsertQuoteItems(docId, state.quoteItems, total);
      } else if (state.docType === 'warranty') {
        await upsertReport(docId, {
          propertyType: state.propertyType,
          issueType: state.warrantyDuration,
          issueNote: state.warrantyConditions,
          photos: state.photos,
          voiceTranscript: '',
          aiSummary: state.warrantyWorkDescription,
          recommendations: [],
        });
      }

      setState((s) => ({ ...s, documentId: docId! }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <WizardContext.Provider value={{
      state,
      saving,
      setDocType,
      setCustomer,
      setPropertyType,
      setIssueData,
      setIssueNote,
      addPhoto,
      removePhoto,
      setVoiceTranscript,
      setAiResult,
      setRecommendations,
      setQuoteItems,
      setQuoteNotes,
      setWarrantyData,
      initDraft,
      saveDocument,
      setPdfUrl,
      reset,
    }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  return useContext(WizardContext);
}
