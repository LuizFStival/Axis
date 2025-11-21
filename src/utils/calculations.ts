import { Account, Transaction, Category } from '../types';

export function calculateTotalBalance(accounts: Account[]): number {
  return accounts
    .filter(acc => acc.includeInTotal)
    .reduce((sum, acc) => sum + acc.currentBalance, 0);
}

export function calculateMonthlyIncome(
  transactions: Transaction[],
  categories: Category[],
  month: number,
  year: number
): number {
  return transactions
    .filter(txn => {
      const date = new Date(txn.date);
      return (
        date.getMonth() === month &&
        date.getFullYear() === year &&
        txn.status === 'pago' &&
        !txn.isTransfer
      );
    })
    .filter(txn => {
      const category = categories.find(c => c.id === txn.categoryId);
      return category?.type === 'Receita';
    })
    .reduce((sum, txn) => sum + txn.amount, 0);
}

export function calculateMonthlyExpenses(
  transactions: Transaction[],
  categories: Category[],
  month: number,
  year: number
): number {
  return transactions
    .filter(txn => {
      const date = new Date(txn.date);
      return (
        date.getMonth() === month &&
        date.getFullYear() === year &&
        txn.status === 'pago' &&
        !txn.isTransfer
      );
    })
    .filter(txn => {
      const category = categories.find(c => c.id === txn.categoryId);
      return category?.type === 'Despesa';
    })
    .reduce((sum, txn) => sum + txn.amount, 0);
}

export function calculateMonthlyFixedExpenses(
  transactions: Transaction[],
  month: number,
  year: number
): number {
  return transactions
    .filter(txn => {
      const date = new Date(txn.date);
      const isSameMonth = date.getMonth() === month && date.getFullYear() === year;
      return isSameMonth && !txn.isTransfer && txn.isRecurring;
    })
    .reduce((sum, txn) => sum + txn.amount, 0);
}

export function calculateExpensesByLogicTag(
  transactions: Transaction[],
  categories: Category[],
  month: number,
  year: number
): { essential: number; superfluous: number; investment: number } {
  const expenses = transactions
    .filter(txn => {
      const date = new Date(txn.date);
      return (
        date.getMonth() === month &&
        date.getFullYear() === year &&
        txn.status === 'pago' &&
        !txn.isTransfer
      );
    })
    .filter(txn => {
      const category = categories.find(c => c.id === txn.categoryId);
      return category?.type === 'Despesa';
    });

  const essential = expenses
    .filter(txn => {
      const category = categories.find(c => c.id === txn.categoryId);
      return category?.logicTag === 'Essencial';
    })
    .reduce((sum, txn) => sum + txn.amount, 0);

  const superfluous = expenses
    .filter(txn => {
      const category = categories.find(c => c.id === txn.categoryId);
      return category?.logicTag === 'Supérfluo';
    })
    .reduce((sum, txn) => sum + txn.amount, 0);

  const investment = expenses
    .filter(txn => {
      const category = categories.find(c => c.id === txn.categoryId);
      return category?.logicTag === 'Investimento';
    })
    .reduce((sum, txn) => sum + txn.amount, 0);

  return { essential, superfluous, investment };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function parseCurrencyInput(value: string): number {
  if (!value) return 0;
  let sanitized = value.replace(/[^\d.,-]/g, '');

  if (sanitized.includes(',')) {
    sanitized = sanitized.replace(/\./g, '').replace(',', '.');
  } else {
    const lastDot = sanitized.lastIndexOf('.');
    if (lastDot !== -1) {
      const integerPart = sanitized.slice(0, lastDot).replace(/\./g, '');
      const decimalPart = sanitized.slice(lastDot + 1);
      sanitized = `${integerPart}.${decimalPart}`;
    } else {
      sanitized = sanitized.replace(/\./g, '');
    }
  }

  const parsed = parseFloat(sanitized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function formatCurrencyField(value: string | number): string {
  if (typeof value === 'number') {
    return formatCurrency(value);
  }

  const numeric = parseCurrencyInput(value);
  if (!value && numeric === 0) return '';
  return formatCurrency(numeric);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function getInvoiceMonth(cardClosingDay: number, date: Date): { month: number; year: number } {
  const day = date.getDate();
  let month = date.getMonth();
  let year = date.getFullYear();

  if (day > cardClosingDay) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return { month, year };
}
