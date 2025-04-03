export interface Transaction {
  id: string;
  date: Date;
  type: 'input' | 'output' | 'transfer';
  quantity: number;
  description: string;
  filmType: 'virgin' | 'colored';
  fromSection?: string;
  toSection?: string;
  processId?: string;
}

export interface Stock {
  rawMaterial: {
    virgin: number;
    colored: number;
  };
  inProcess: {
    virgin: number;
    colored: number;
  };
  outsourcing: {
    virgin: number;
    colored: number;
  };
  finished: {
    virgin: number;
    colored: number;
  };
}

export interface RecyclingProcess {
  id: string;
  startDate: Date;
  endDate?: Date;
  inputQuantity: number;
  outputQuantity?: number;
  status: 'pending' | 'processing' | 'completed';
  outsourced: boolean;
  outsourcingPartner?: string | null;
  filmType: 'virgin' | 'colored';
  cycleNumber: string;
  expectedCompletion?: Date;
  yieldRate?: number;
  source: string;
}

export interface Product {
  id: string;
  startDate: Date;
  source: 'inProcess' | 'outsourcing';
  filmType: 'virgin' | 'colored';
  inputQuantity: number;
  name?: string;
  price?: number;
  quantity?: number;
  sourceType?: 'virgin' | 'colored';
}

export interface Sale {
  id: string;
  date: Date;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  name: string;
}