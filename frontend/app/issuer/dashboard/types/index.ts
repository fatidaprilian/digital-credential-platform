export interface DynamicField {
  name: string;
  label: string;
  type: 'dynamic-field' | 'image-placeholder';
  x: number;
  y: number;
  width?: number;
  height?: number;
  placeholder?: string;
  isRequired?: boolean;
}

export interface Template {
  id: number;
  name: string;
  description: string | null;
  ipfsTemplateHash: string | null;
  dynamicFields: DynamicField[] | null;
  templateData?: any;
}

export interface UserProfile {
  email: string;
  institution: {
    id: number;
    name: string;
    issuanceCredits: number;
    subscriptionExpiresAt: string | null;
  } | null;
}

export interface IssuanceLog {
  id: number;
  credentialId: string | null; // Pastikan string untuk BigInt
  recipientAddress: string;
  transactionHash: string;
  status: string;
  issuedAt: string; // Ganti createdAt menjadi issuedAt
  template: { name: string };
}