import React, { createContext, useContext, useState } from 'react';
import type { DocumentType } from '@/navigation/types';

interface WizardState {
  documentType: DocumentType;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  propertyType: string;
  issueType: string;
  issueNote: string;
  photos: string[];
  voiceTranscript: string;
}

interface WizardContextValue {
  state: WizardState;
  setDocumentType: (t: DocumentType) => void;
  setCustomer: (name: string, phone: string, address: string) => void;
  setPropertyType: (t: string) => void;
  setIssueType: (t: string) => void;
  setIssueNote: (n: string) => void;
  addPhoto: (uri: string) => void;
  setVoiceTranscript: (t: string) => void;
  reset: () => void;
}

const DEFAULT: WizardState = {
  documentType: 'report',
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  propertyType: 'דירה',
  issueType: 'leak',
  issueNote: '',
  photos: [],
  voiceTranscript: '',
};

const WizardContext = createContext<WizardContextValue>({
  state: DEFAULT,
  setDocumentType: () => {},
  setCustomer: () => {},
  setPropertyType: () => {},
  setIssueType: () => {},
  setIssueNote: () => {},
  addPhoto: () => {},
  setVoiceTranscript: () => {},
  reset: () => {},
});

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WizardState>(DEFAULT);

  const setDocumentType = (documentType: DocumentType) =>
    setState((s) => ({ ...s, documentType }));

  const setCustomer = (customerName: string, customerPhone: string, customerAddress: string) =>
    setState((s) => ({ ...s, customerName, customerPhone, customerAddress }));

  const setPropertyType = (propertyType: string) =>
    setState((s) => ({ ...s, propertyType }));

  const setIssueType = (issueType: string) =>
    setState((s) => ({ ...s, issueType }));

  const setIssueNote = (issueNote: string) =>
    setState((s) => ({ ...s, issueNote }));

  const addPhoto = (uri: string) =>
    setState((s) => ({ ...s, photos: [...s.photos, uri] }));

  const setVoiceTranscript = (voiceTranscript: string) =>
    setState((s) => ({ ...s, voiceTranscript }));

  const reset = () => setState(DEFAULT);

  return (
    <WizardContext.Provider value={{
      state,
      setDocumentType,
      setCustomer,
      setPropertyType,
      setIssueType,
      setIssueNote,
      addPhoto,
      setVoiceTranscript,
      reset,
    }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  return useContext(WizardContext);
}
