import { Account, Category, CreditCard, Transaction } from '../types';

const STORAGE_KEYS = {
  ACCOUNTS: 'finance_accounts',
  CATEGORIES: 'finance_categories',
  CREDIT_CARDS: 'finance_credit_cards',
  TRANSACTIONS: 'finance_transactions',
  USER: 'finance_user',
};

export const storage = {
  getAccounts: (): Account[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return data ? JSON.parse(data) : [];
  },

  setAccounts: (accounts: Account[]): void => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  getCategories: (): Category[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : getDefaultCategories();
  },

  setCategories: (categories: Category[]): void => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  getCreditCards: (): CreditCard[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CREDIT_CARDS);
    return data ? JSON.parse(data) : [];
  },

  setCreditCards: (cards: CreditCard[]): void => {
    localStorage.setItem(STORAGE_KEYS.CREDIT_CARDS, JSON.stringify(cards));
  },

  getTransactions: (): Transaction[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },

  setTransactions: (transactions: Transaction[]): void => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  getUser: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.USER);
  },

  setUser: (userId: string): void => {
    localStorage.setItem(STORAGE_KEYS.USER, userId);
  },

  clearUser: (): void => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  clearAll: (): void => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};

function getDefaultCategories(): Category[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'cat-1',
      name: 'Alimentação',
      icon: 'utensils',
      color: '#ef4444',
      type: 'Despesa',
      logicTag: 'Essencial',
      createdAt: now,
    },
    {
      id: 'cat-2',
      name: 'Transporte',
      icon: 'car',
      color: '#f97316',
      type: 'Despesa',
      logicTag: 'Essencial',
      createdAt: now,
    },
    {
      id: 'cat-3',
      name: 'Moradia',
      icon: 'home',
      color: '#8b5cf6',
      type: 'Despesa',
      logicTag: 'Essencial',
      createdAt: now,
    },
    {
      id: 'cat-4',
      name: 'Lazer',
      icon: 'smile',
      color: '#ec4899',
      type: 'Despesa',
      logicTag: 'Supérfluo',
      createdAt: now,
    },
    {
      id: 'cat-5',
      name: 'Compras',
      icon: 'shopping-bag',
      color: '#a855f7',
      type: 'Despesa',
      logicTag: 'Supérfluo',
      createdAt: now,
    },
    {
      id: 'cat-6',
      name: 'Investimentos',
      icon: 'trending-up',
      color: '#10b981',
      type: 'Despesa',
      logicTag: 'Investimento',
      createdAt: now,
    },
    {
      id: 'cat-7',
      name: 'Salário',
      icon: 'dollar-sign',
      color: '#22c55e',
      type: 'Receita',
      createdAt: now,
    },
    {
      id: 'cat-8',
      name: 'Freelance',
      icon: 'briefcase',
      color: '#14b8a6',
      type: 'Receita',
      createdAt: now,
    },
  ];
}

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
