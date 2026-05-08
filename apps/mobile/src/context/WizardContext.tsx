import React, { createContext, useContext, useState } from 'react';
import type {
  DocumentType,
  PropertyType,
  IssueType,
  Recommendation,
} from '@dohot/shared';
import {
  upsertCustomer,
  createDraftDocument,
  upsertReport,
} from '@/services/documents';

interface WizardState {
  documentType: DocumentType;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  propertyType: PropertyType;
  issueType: IssueType;
  issueNote: string;
  photos: string[];
  voiceTranscript: string;
  /** AI-generated professional summary text (from /api/ai/clean-report-text) */
  aiSummary: string;
  recommendations: Recommendation[];
  documentId: string | null;
  pdfUrl: string | null;
}

interface WizardContextValue {
  state: WizardState;
  saving: boolean;
  setDocumentType: (t: DocumentType) => void;
  setCustomer: (name: string, phone: string, address: string) => void;
  setPropertyType: (t: PropertyType) => void;
  setIssueType: (t: IssueType) => void;
  setIssueNote: (n: string) => void;
  addPhoto: (uri: string) => void;
  setVoiceTranscript: (t: string) => void;
  /** Called by the processing screen once the AI response arrives */
  setAiResult: (summary: string, recommendations: Recommendation[]) => void;
  setRecommendations: (recs: Recommendation[]) => void;
  /** Creates customer + document draft after step 1, fires in the background */
  initDraft: (professionalId: string, data: { name: string; phone: string; address: string }) => Promise<void>;
  saveDocument: (professionalId: string) => Promise<void>;
  setPdfUrl: (url: string) => void;
  reset: () => void;
}

const DEFAULT: WizardState = {
  documentType: 'report',
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  propertyType: 'apartment',
  issueType: 'leak',
  issueNote: '',
  photos: [],
  voiceTranscript: '',
  aiSummary: '',
  recommendations: [],
  documentId: null,
  pdfUrl: null,
};

const WizardContext = createContext<WizardContextValue>({
  state: DEFAULT,
  saving: false,
  setDocumentType: () => {},
  setCustomer: () => {},
  setPropertyType: () => {},
  setIssueType: () => {},
  setIssueNote: () => {},
  addPhoto: () => {},
  setVoiceTranscript: () => {},
  setAiResult: () => {},
  setRecommendations: () => {},
  initDraft: async () => {},
  saveDocument: async () => {},
  setPdfUrl: () => {},
  reset: () => {},
});

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WizardState>(DEFAULT);
  const [saving, setSaving] = useState(false);

  const setDocumentType = (documentType: DocumentType) =>
    setState((s) => ({ ...s, documentType }));

  const setCustomer = (customerName: string, customerPhone: string, customerAddress: string) =>
    setState((s) => ({ ...s, customerName, customerPhone, customerAddress }));

  const setPropertyType = (propertyType: PropertyType) =>
    setState((s) => ({ ...s, propertyType }));

  const setIssueType = (issueType: IssueType) =>
    setState((s) => ({ ...s, issueType }));

  const setIssueNote = (issueNote: string) =>
    setState((s) => ({ ...s, issueNote }));

  const addPhoto = (uri: string) =>
    setState((s) => ({ ...s, photos: [...s.photos, uri] }));

  const setVoiceTranscript = (voiceTranscript: string) =>
    setState((s) => ({ ...s, voiceTranscript }));

  const setAiResult = (aiSummary: string, recommendations: Recommendation[]) =>
    setState((s) => ({ ...s, aiSummary, recommendations }));

  const setRecommendations = (recommendations: Recommendation[]) =>
    setState((s) => ({ ...s, recommendations }));

  const setPdfUrl = (pdfUrl: string) =>
    setState((s) => ({ ...s, pdfUrl }));

  const reset = () => setState(DEFAULT);

  const initDraft = async (
    professionalId: string,
    data: { name: string; phone: string; address: string },
  ): Promise<void> => {
    try {
      const customer = await upsertCustomer(
        professionalId,
        data.name || 'לא צוין',
        data.phone,
        data.address,
      );
      const title = `דוח בדיקה – ${customer.name}`;
      const doc = await createDraftDocument(professionalId, customer.id, title);
      setState((s) => ({ ...s, documentId: doc.id }));
    } catch {
      // Silently swallow — saveDocument will retry the full create if documentId is missing
    }
  };

  const saveDocument = async (professionalId: string): Promise<void> => {
    setSaving(true);
    try {
      let docId = state.documentId;

      if (!docId) {
        const customer = await upsertCustomer(
          professionalId,
          state.customerName || 'לא צוין',
          state.customerPhone,
          state.customerAddress,
        );
        const title = `דוח בדיקה – ${customer.name}`;
        const doc = await createDraftDocument(professionalId, customer.id, title);
        docId = doc.id;
      }

      await upsertReport(docId, {
        propertyType: state.propertyType,
        issueType: state.issueType,
        issueNote: state.issueNote,
        photos: state.photos,
        voiceTranscript: state.voiceTranscript,
        aiSummary: state.aiSummary,
        recommendations: state.recommendations,
      });

      setState((s) => ({ ...s, documentId: docId! }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <WizardContext.Provider value={{
      state,
      saving,
      setDocumentType,
      setCustomer,
      setPropertyType,
      setIssueType,
      setIssueNote,
      addPhoto,
      setVoiceTranscript,
      setAiResult,
      setRecommendations,
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
