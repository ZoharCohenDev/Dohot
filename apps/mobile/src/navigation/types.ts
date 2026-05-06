export type DocumentType = 'report' | 'quote' | 'worklog' | 'agreement';
export type DocumentStatus = 'draft' | 'sent' | 'pending' | 'signed' | 'approved';

export interface AuthStackParams {
  login: undefined;
  register: undefined;
  welcome: undefined;
  profile: undefined;
  trust: undefined;
}

export interface OnboardingStackParams {
  'business-setup': undefined;
}

export interface AppTabParams {
  index: undefined;
  documents: undefined;
  customers: undefined;
  create: { documentType?: DocumentType };
  me: undefined;
}

export interface WizardStackParams {
  'voice-idle': undefined;
  customer: { documentType?: DocumentType };
  issue: undefined;
  photos: undefined;
  annotate: { photoUri?: string };
  voice: undefined;
  processing: undefined;
  recommendations: undefined;
  preview: undefined;
  send: undefined;
}
