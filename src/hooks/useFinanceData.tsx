import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Account, Category, CreditCard, Transaction } from '../types';

interface FinanceDataContextValue {
  accounts: Account[];
  categories: Category[];
  creditCards: CreditCard[];
  transactions: Transaction[];
  loading: boolean;
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Account | null>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Promise<Category | null>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addCreditCard: (card: Omit<CreditCard, 'id' | 'createdAt'>) => Promise<CreditCard | null>;
  updateCreditCard: (id: string, updates: Partial<CreditCard>) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction | null>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addInstallmentTransaction: (
    transaction: Omit<Transaction, 'id' | 'createdAt'>,
    installments: number
  ) => Promise<Transaction | null>;
  refresh: () => Promise<void>;
}

const FinanceDataContext = createContext<FinanceDataContextValue | undefined>(undefined);

export function FinanceDataProvider({ children }: { children: ReactNode }) {
  const value = useProvideFinanceData();

  return (
    <FinanceDataContext.Provider value={value}>
      {children}
    </FinanceDataContext.Provider>
  );
}

export function useFinanceData(): FinanceDataContextValue {
  const context = useContext(FinanceDataContext);

  if (!context) {
    throw new Error('useFinanceData must be used within a FinanceDataProvider');
  }

  return context;
}

const mapConta = (row: any): Account => ({
  id: row.id,
  name: row.nome,
  type: row.tipo,
  currentBalance: Number(row.saldo_atual ?? 0),
  includeInTotal: Boolean(row.incluir_no_total),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapCategoria = (row: any): Category => ({
  id: row.id,
  name: row.nome,
  icon: row.icone,
  color: row.cor,
  type: row.tipo,
  logicTag: row.tag_logica,
  monthlyBudget: row.orcamento_mensal ? Number(row.orcamento_mensal) : undefined,
  createdAt: row.created_at,
});

const mapCartao = (row: any): CreditCard => ({
  id: row.id,
  name: row.nome,
  closingDay: row.dia_fechamento,
  dueDay: row.dia_vencimento,
  totalLimit: Number(row.limite_total ?? 0),
  createdAt: row.created_at,
});

const mapTransacao = (row: any): Transaction => ({
  id: row.id,
  amount: Number(row.valor ?? 0),
  description: row.descricao ?? '',
  date: typeof row.data === 'string' ? row.data : row.data?.toString(),
  status: row.status,
  accountId: row.conta_id || undefined,
  cardId: row.cartao_id || undefined,
  categoryId: row.categoria_id || undefined,
  isRecurring: Boolean(row.recorrente),
  isTransfer: Boolean(row.transferencia),
  transferToAccountId: row.conta_destino_id || undefined,
  parentTransactionId: row.transacao_pai_id || undefined,
  installmentNumber: row.parcela_numero || undefined,
  totalInstallments: row.parcelas_total || undefined,
  createdAt: row.created_at,
});

function useProvideFinanceData(): FinanceDataContextValue {
  const { userId } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [contasRes, categoriasRes, cartoesRes, transacoesRes] = await Promise.all([
      supabase.from('contas').select('*').order('created_at', { ascending: true }),
      supabase.from('categorias').select('*').order('created_at', { ascending: true }),
      supabase.from('cartoes').select('*').order('created_at', { ascending: true }),
      supabase.from('transacoes').select('*').order('data', { ascending: true }),
    ]);

    if (!contasRes.error && contasRes.data) setAccounts(contasRes.data.map(mapConta));
    if (!categoriasRes.error && categoriasRes.data) setCategories(categoriasRes.data.map(mapCategoria));
    if (!cartoesRes.error && cartoesRes.data) setCreditCards(cartoesRes.data.map(mapCartao));
    if (!transacoesRes.error && transacoesRes.data) setTransactions(transacoesRes.data.map(mapTransacao));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addAccount = useCallback(async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) return null;
    const payload = {
      nome: account.name,
      tipo: account.type,
      saldo_atual: account.currentBalance,
      incluir_no_total: account.includeInTotal,
      user_id: userId,
    };
    const { data, error } = await supabase
      .from('contas')
      .insert(payload)
      .select()
      .single();
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao adicionar conta', error);
      return null;
    }
    const mapped = mapConta(data);
    setAccounts(prev => [...prev, mapped]);
    return mapped;
  }, [userId]);

  const updateAccount = useCallback(async (id: string, updates: Partial<Account>) => {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) payload.nome = updates.name;
    if (updates.type !== undefined) payload.tipo = updates.type;
    if (updates.currentBalance !== undefined) payload.saldo_atual = updates.currentBalance;
    if (updates.includeInTotal !== undefined) payload.incluir_no_total = updates.includeInTotal;

    const { error } = await supabase.from('contas').update(payload).eq('id', id);
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao atualizar conta', error);
    } else {
      setAccounts(prev => prev.map(acc => (acc.id === id ? { ...acc, ...updates } : acc)));
    }
  }, []);

  const deleteAccount = useCallback(async (id: string) => {
    const { error } = await supabase.from('contas').delete().eq('id', id);
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao excluir conta', error);
    } else {
      setAccounts(prev => prev.filter(acc => acc.id !== id));
    }
  }, []);

  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'createdAt'>) => {
    if (!userId) return null;
    const payload = {
      nome: category.name,
      icone: category.icon,
      cor: category.color,
      tipo: category.type,
      tag_logica: category.logicTag,
      orcamento_mensal: category.monthlyBudget,
      user_id: userId,
    };
    const { data, error } = await supabase
      .from('categorias')
      .insert(payload)
      .select()
      .single();
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao adicionar categoria', error);
      return null;
    }
    const mapped = mapCategoria(data);
    setCategories(prev => [...prev, mapped]);
    return mapped;
  }, [userId]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.nome = updates.name;
    if (updates.icon !== undefined) payload.icone = updates.icon;
    if (updates.color !== undefined) payload.cor = updates.color;
    if (updates.type !== undefined) payload.tipo = updates.type;
    if (updates.logicTag !== undefined) payload.tag_logica = updates.logicTag;
    if (updates.monthlyBudget !== undefined) payload.orcamento_mensal = updates.monthlyBudget;

    const { error } = await supabase.from('categorias').update(payload).eq('id', id);
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao atualizar categoria', error);
    } else {
      setCategories(prev => prev.map(cat => (cat.id === id ? { ...cat, ...updates } : cat)));
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao excluir categoria', error);
    } else {
      setCategories(prev => prev.filter(cat => cat.id !== id));
    }
  }, []);

  const addCreditCard = useCallback(async (card: Omit<CreditCard, 'id' | 'createdAt'>) => {
    if (!userId) return null;
    const payload = {
      nome: card.name,
      dia_fechamento: card.closingDay,
      dia_vencimento: card.dueDay,
      limite_total: card.totalLimit,
      user_id: userId,
    };
    const { data, error } = await supabase
      .from('cartoes')
      .insert(payload)
      .select()
      .single();
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao adicionar cartao', error);
      return null;
    }
    const mapped = mapCartao(data);
    setCreditCards(prev => [...prev, mapped]);
    return mapped;
  }, [userId]);

  const updateCreditCard = useCallback(async (id: string, updates: Partial<CreditCard>) => {
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.nome = updates.name;
    if (updates.closingDay !== undefined) payload.dia_fechamento = updates.closingDay;
    if (updates.dueDay !== undefined) payload.dia_vencimento = updates.dueDay;
    if (updates.totalLimit !== undefined) payload.limite_total = updates.totalLimit;

    const { error } = await supabase.from('cartoes').update(payload).eq('id', id);
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao atualizar cartao', error);
    } else {
      setCreditCards(prev => prev.map(card => (card.id === id ? { ...card, ...updates } : card)));
    }
  }, []);

  const deleteCreditCard = useCallback(async (id: string) => {
    const { error } = await supabase.from('cartoes').delete().eq('id', id);
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao excluir cartao', error);
    } else {
      setCreditCards(prev => prev.filter(card => card.id !== id));
    }
  }, []);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!userId) return null;
    const payload = {
      valor: transaction.amount,
      descricao: transaction.description,
      data: transaction.date,
      status: transaction.status,
      conta_id: transaction.accountId,
      cartao_id: transaction.cardId,
      categoria_id: transaction.categoryId,
      recorrente: transaction.isRecurring,
      transferencia: transaction.isTransfer,
      conta_destino_id: transaction.transferToAccountId,
      transacao_pai_id: transaction.parentTransactionId,
      parcela_numero: transaction.installmentNumber,
      parcelas_total: transaction.totalInstallments,
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('transacoes')
      .insert(payload)
      .select()
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao adicionar transacao', error);
      return null;
    }

    const mapped = mapTransacao(data);
    setTransactions(prev => [mapped, ...prev]);

    // Atualiza saldo de contas para transacoes pagas e não-transferências
    if (transaction.accountId && transaction.status === 'pago' && !transaction.isTransfer) {
      const account = accounts.find(a => a.id === transaction.accountId);
      const category = categories.find(c => c.id === transaction.categoryId);
      const isIncome = category?.type === 'Receita';
      if (account) {
        const newBalance = account.currentBalance + (isIncome ? transaction.amount : -transaction.amount);
        await updateAccount(transaction.accountId, { currentBalance: newBalance });
      }
    }

    // Transferência: debita e credita contas
    if (transaction.isTransfer && transaction.accountId && transaction.transferToAccountId) {
      const fromAccount = accounts.find(a => a.id === transaction.accountId);
      const toAccount = accounts.find(a => a.id === transaction.transferToAccountId);
      if (fromAccount && toAccount) {
        await updateAccount(transaction.accountId, {
          currentBalance: fromAccount.currentBalance - transaction.amount,
        });
        await updateAccount(transaction.transferToAccountId, {
          currentBalance: toAccount.currentBalance + transaction.amount,
        });
      }
    }

    return mapped;
  }, [accounts, categories, updateAccount, userId]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    const payload: Record<string, any> = {};
    if (updates.amount !== undefined) payload.valor = updates.amount;
    if (updates.description !== undefined) payload.descricao = updates.description;
    if (updates.date !== undefined) payload.data = updates.date;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.accountId !== undefined) payload.conta_id = updates.accountId;
    if (updates.cardId !== undefined) payload.cartao_id = updates.cardId;
    if (updates.categoryId !== undefined) payload.categoria_id = updates.categoryId;
    if (updates.isRecurring !== undefined) payload.recorrente = updates.isRecurring;
    if (updates.isTransfer !== undefined) payload.transferencia = updates.isTransfer;
    if (updates.transferToAccountId !== undefined) payload.conta_destino_id = updates.transferToAccountId;
    if (updates.parentTransactionId !== undefined) payload.transacao_pai_id = updates.parentTransactionId;
    if (updates.installmentNumber !== undefined) payload.parcela_numero = updates.installmentNumber;
    if (updates.totalInstallments !== undefined) payload.parcelas_total = updates.totalInstallments;

    const { error } = await supabase.from('transacoes').update(payload).eq('id', id);
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao atualizar transacao', error);
    } else {
      setTransactions(prev => prev.map(txn => (txn.id === id ? { ...txn, ...updates } : txn)));
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    const { error } = await supabase.from('transacoes').delete().eq('id', id);
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao excluir transacao', error);
    } else {
      setTransactions(prev => prev.filter(txn => txn.id !== id));
    }
  }, []);

  const addInstallmentTransaction = useCallback(async (
    transaction: Omit<Transaction, 'id' | 'createdAt'>,
    installments: number
  ) => {
    const parent = await addTransaction({
      ...transaction,
      totalInstallments: installments,
      installmentNumber: 1,
    });

    if (!parent) return null;

    for (let i = 2; i <= installments; i++) {
      const installmentDate = new Date(transaction.date);
      installmentDate.setMonth(installmentDate.getMonth() + (i - 1));

      await addTransaction({
        ...transaction,
        date: installmentDate.toISOString().split('T')[0],
        parentTransactionId: parent.id,
        installmentNumber: i,
        totalInstallments: installments,
        status: 'pendente',
      });
    }

    await loadData();
    return parent;
  }, [addTransaction, loadData]);

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
