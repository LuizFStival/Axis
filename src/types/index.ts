export interface Account {
  id: string;
  name: string;
  type: 'Corrente' | 'Investimento' | 'Dinheiro';
  currentBalance: number;
  includeInTotal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'Receita' | 'Despesa';
  logicTag?: 'Essencial' | 'Supérfluo' | 'Investimento';
  monthlyBudget?: number;
  createdAt: string;
}

export interface CreditCard {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
  totalLimit: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  status: 'pago' | 'pendente';
  accountId?: string;
  cardId?: string;
  categoryId?: string;
  isRecurring: boolean;
  isTransfer: boolean;
  transferToAccountId?: string;
  parentTransactionId?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  createdAt: string;
}

export interface Invoice {
  month: string;
  year: number;
  cardId: string;
  transactions: Transaction[];
  total: number;
  closingDate: Date;
  dueDate: Date;
}

export type TransactionType = 'Despesa' | 'Receita' | 'Transferencia';
