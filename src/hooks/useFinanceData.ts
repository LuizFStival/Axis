import { useState, useEffect, useCallback } from 'react';
import { Account, Category, CreditCard, Transaction } from '../types';
import { storage, generateId } from '../services/storage';

export function useFinanceData() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    setAccounts(storage.getAccounts());
    setCategories(storage.getCategories());
    setCreditCards(storage.getCreditCards());
    setTransactions(storage.getTransactions());
    setLoading(false);
  }, []);

  const addAccount = useCallback((account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAccount: Account = {
      ...account,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...accounts, newAccount];
    setAccounts(updated);
    storage.setAccounts(updated);
    return newAccount;
  }, [accounts]);

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    const updated = accounts.map(acc =>
      acc.id === id ? { ...acc, ...updates, updatedAt: new Date().toISOString() } : acc
    );
    setAccounts(updated);
    storage.setAccounts(updated);
  }, [accounts]);

  const deleteAccount = useCallback((id: string) => {
    const updated = accounts.filter(acc => acc.id !== id);
    setAccounts(updated);
    storage.setAccounts(updated);
  }, [accounts]);

  const addCategory = useCallback((category: Omit<Category, 'id' | 'createdAt'>) => {
    const newCategory: Category = {
      ...category,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...categories, newCategory];
    setCategories(updated);
    storage.setCategories(updated);
    return newCategory;
  }, [categories]);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    const updated = categories.map(cat =>
      cat.id === id ? { ...cat, ...updates } : cat
    );
    setCategories(updated);
    storage.setCategories(updated);
  }, [categories]);

  const deleteCategory = useCallback((id: string) => {
    const updated = categories.filter(cat => cat.id !== id);
    setCategories(updated);
    storage.setCategories(updated);
  }, [categories]);

  const addCreditCard = useCallback((card: Omit<CreditCard, 'id' | 'createdAt'>) => {
    const newCard: CreditCard = {
      ...card,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...creditCards, newCard];
    setCreditCards(updated);
    storage.setCreditCards(updated);
    return newCard;
  }, [creditCards]);

  const updateCreditCard = useCallback((id: string, updates: Partial<CreditCard>) => {
    const updated = creditCards.map(card =>
      card.id === id ? { ...card, ...updates } : card
    );
    setCreditCards(updated);
    storage.setCreditCards(updated);
  }, [creditCards]);

  const deleteCreditCard = useCallback((id: string) => {
    const updated = creditCards.filter(card => card.id !== id);
    setCreditCards(updated);
    storage.setCreditCards(updated);
  }, [creditCards]);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...transactions, newTransaction];
    setTransactions(updated);
    storage.setTransactions(updated);

    if (transaction.accountId && transaction.status === 'pago' && !transaction.isTransfer) {
      const account = accounts.find(a => a.id === transaction.accountId);
      if (account) {
        const category = categories.find(c => c.id === transaction.categoryId);
        const isIncome = category?.type === 'Receita';
        const newBalance = account.currentBalance + (isIncome ? transaction.amount : -transaction.amount);
        updateAccount(transaction.accountId, { currentBalance: newBalance });
      }
    }

    if (transaction.isTransfer && transaction.accountId && transaction.transferToAccountId) {
      const fromAccount = accounts.find(a => a.id === transaction.accountId);
      const toAccount = accounts.find(a => a.id === transaction.transferToAccountId);
      if (fromAccount && toAccount) {
        updateAccount(transaction.accountId, {
          currentBalance: fromAccount.currentBalance - transaction.amount
        });
        updateAccount(transaction.transferToAccountId, {
          currentBalance: toAccount.currentBalance + transaction.amount
        });
      }
    }

    return newTransaction;
  }, [transactions, accounts, categories, updateAccount]);

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    const updated = transactions.map(txn =>
      txn.id === id ? { ...txn, ...updates } : txn
    );
    setTransactions(updated);
    storage.setTransactions(updated);
  }, [transactions]);

  const deleteTransaction = useCallback((id: string) => {
    const updated = transactions.filter(txn => txn.id !== id);
    setTransactions(updated);
    storage.setTransactions(updated);
  }, [transactions]);

  const addInstallmentTransaction = useCallback((
    transaction: Omit<Transaction, 'id' | 'createdAt'>,
    installments: number
  ) => {
    const parentTransaction = addTransaction({
      ...transaction,
      totalInstallments: installments,
      installmentNumber: 1,
    });

    for (let i = 2; i <= installments; i++) {
      const installmentDate = new Date(transaction.date);
      installmentDate.setMonth(installmentDate.getMonth() + (i - 1));

      addTransaction({
        ...transaction,
        date: installmentDate.toISOString().split('T')[0],
        parentTransactionId: parentTransaction.id,
        installmentNumber: i,
        totalInstallments: installments,
        status: 'pendente',
      });
    }

    return parentTransaction;
  }, [addTransaction]);

  return {
    accounts,
    categories,
    creditCards,
    transactions,
    loading,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addInstallmentTransaction,
    refresh: loadData,
  };
}
