export type DocumentType = 'report' | 'quote' | 'agreement' | 'documentation';
export type DocumentStatus = 'draft' | 'sent' | 'signed';

export interface Document {
  id: string;
  type: DocumentType;
  customerId: string;
  status: DocumentStatus;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  uri: string;
  annotation?: string;
  documentId: string;
}

export interface Issue {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  documentId: string;
}

export interface Recommendation {
  id: string;
  text: string;
  price?: number;
  documentId: string;
}
