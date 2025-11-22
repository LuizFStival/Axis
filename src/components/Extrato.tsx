import { useMemo, useState, type ComponentType, type CSSProperties } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import {
  calculateTotalBalance,
  calculateExpensesByLogicTag,
  calculateMonthlyIncome,
  calculateMonthlyFixedExpenses,
  formatCurrency,
  formatDate,
} from '../utils/calculations';
type FilterType = 'all' | 'income' | 'expense' | 'transfer';
export function Extrato() {
  const { transactions, categories, accounts, creditCards } = useFinanceData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const today = useMemo(() => new Date(), []);
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const investmentGoalPercent = 0.2;
  const monthLabel = useMemo(
    () =>
      new Date(currentYear, currentMonth, 1).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      }),
    [currentMonth, currentYear]
  );
  const daysInMonth = useMemo(
    () => new Date(currentYear, currentMonth + 1, 0).getDate(),
    [currentMonth, currentYear]
  );
  const spendingSnapshot = useMemo(() => {
    const monthlyIncome = calculateMonthlyIncome(transactions, categories, currentMonth, currentYear);
    const { essential, superfluous, investment } = calculateExpensesByLogicTag(
      transactions,
      categories,
      currentMonth,
      currentYear
    );
    const monthlyFixed = calculateMonthlyFixedExpenses(transactions, currentMonth, currentYear);
    const investmentGoalValue = monthlyIncome > 0 ? monthlyIncome * investmentGoalPercent : 0;
    const buffer = monthlyIncome - monthlyFixed - investmentGoalValue;
    const safeDays = Math.max(daysInMonth, 1);
    const dailyAvailable = Math.max(buffer / safeDays, 0);
    return {
      monthlyIncome,
      monthlyFixed,
      essential,
      superfluous,
      investment,
      investmentGoalValue,
      buffer,
      dailyAvailable,
    };
  }, [transactions, categories, currentMonth, currentYear, daysInMonth, investmentGoalPercent]);
  const totalBalance = useMemo(
    () => calculateTotalBalance(accounts),
    [accounts]
  );
  const accountsIncluded = useMemo(
    () => accounts.filter(account => account.includeInTotal).length,
    [accounts]
  );
  const runwayDays = useMemo(() => {
    if (spendingSnapshot.dailyAvailable <= 0) return 0;
    return Math.max(Math.floor(totalBalance / spendingSnapshot.dailyAvailable), 0);
  }, [spendingSnapshot.dailyAvailable, totalBalance]);
  const paidTransactionsThisMonth = useMemo(
    () =>
      transactions.filter(txn => {
        const date = new Date(txn.date);
        return (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear &&
          txn.status === 'pago' &&
          !txn.isTransfer
        );
      }),
    [transactions, currentMonth, currentYear]
  );
  const categoryBudgets = useMemo(() => {
    return categories.map(category => {
      const catTransactions = paidTransactionsThisMonth.filter(txn => txn.categoryId === category.id);
      const totalFlow = catTransactions.reduce((sum, txn) => sum + txn.amount, 0);
      const budget = category.monthlyBudget ?? 0;
      const isExpense = category.type === 'Despesa';
      const spent = isExpense ? totalFlow : 0;
      const received = !isExpense ? totalFlow : 0;
      const considersBudget = isExpense && budget > 0;
      const progress = considersBudget ? Math.min((spent / budget) * 100, 999) : 0;
      const remaining = isExpense ? budget - spent : budget;
      const status = considersBudget
        ? spent > budget
          ? 'over'
          : 'ok'
        : isExpense
          ? 'no-budget'
          : 'income';
      return {
        category,
        spent,
        received,
        budget,
        considersBudget,
        progress,
        remaining,
        status,
      };
    });
  }, [categories, paidTransactionsThisMonth]);
  const budgetedExpenseCategories = useMemo(
    () => categoryBudgets.filter(item => item.considersBudget),
    [categoryBudgets]
  );
  const sortedCategoryBudgets = useMemo(
    () =>
      [...categoryBudgets].sort((a, b) => {
        if (a.considersBudget !== b.considersBudget) return a.considersBudget ? -1 : 1;
        if (a.category.type !== b.category.type) return a.category.type === 'Despesa' ? -1 : 1;
        return a.category.name.localeCompare(b.category.name);
      }),
    [categoryBudgets]
  );
  const budgetResume = useMemo(() => {
    const total = categories.length;
    const withinBudget = budgetedExpenseCategories.filter(item => item.spent <= item.budget).length;
    const overBudget = budgetedExpenseCategories.filter(item => item.spent > item.budget).length;
    return {
      total,
      withinBudget,
      overBudget,
    };
  }, [budgetedExpenseCategories, categories]);
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    if (searchTerm) {
      filtered = filtered.filter(txn =>
        txn.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterType !== 'all') {
      filtered = filtered.filter(txn => {
        if (filterType === 'transfer') return txn.isTransfer;
        const category = categories.find(c => c.id === txn.categoryId);
        if (filterType === 'income') return category?.type === 'Receita';
        if (filterType === 'expense') return category?.type === 'Despesa';
        return true;
      });
    }
    if (selectedAccount !== 'all') {
      filtered = filtered.filter(
        txn => txn.accountId === selectedAccount || txn.cardId === selectedAccount
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(txn => txn.categoryId === selectedCategory);
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, categories, searchTerm, filterType, selectedAccount, selectedCategory]);
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: typeof filteredTransactions } = {};
    filteredTransactions.forEach(txn => {
      const date = new Date(txn.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(txn);
    });
    return groups;
  }, [filteredTransactions]);
  const hexToRgba = (hex: string, alpha: number) => {
    let normalized = hex?.replace('#', '') || '1f2937';
    if (normalized.length === 3) {
      normalized = normalized.split('').map(ch => ch + ch).join('');
    }
    const bigint = parseInt(normalized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const getCategoryInitials = (name?: string) => {
    if (!name) return 'AX';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word[0]?.toUpperCase())
      .join('');
  };
  const brandFilters = [
    { value: 'expense' as FilterType, label: 'Despesa', icon: ArrowDownRight },
    { value: 'income' as FilterType, label: 'Receita', icon: ArrowUpRight },
    { value: 'transfer' as FilterType, label: 'Transferência', icon: ArrowRightLeft },
  ];
  const farolTotals = useMemo(() => {
    const currentMonthTxns = filteredTransactions.filter(txn => {
      const date = new Date(txn.date);
      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear &&
        txn.status === 'pago' &&
        !txn.isTransfer
      );
    });
    const getTaggedTotal = (tag: 'Essencial' | 'Superfluo' | 'Investimento') =>
      currentMonthTxns
        .filter(txn => {
          const category = categories.find(c => c.id === txn.categoryId);
          const targets =
            tag === 'Superfluo'
              ? ['Superfluo', 'Supersup', 'Supérfluo', 'SupǸrfluo']
              : [tag];
          return targets.includes(category?.logicTag ?? '') && category?.type === 'Despesa';
        })
        .reduce((sum, txn) => sum + txn.amount, 0);
    const essential = getTaggedTotal('Essencial');
    const superfluous = getTaggedTotal('Superfluo');
    const investment = getTaggedTotal('Investimento');
    return { essential, superfluous, investment };
  }, [filteredTransactions, categories, currentMonth, currentYear]);
  const totalTrackedExpenses = farolTotals.essential + farolTotals.superfluous + farolTotals.investment;
  const superfluousShare = totalTrackedExpenses > 0
    ? (farolTotals.superfluous / totalTrackedExpenses) * 100
    : 0;
  const investmentShare = totalTrackedExpenses > 0
    ? (farolTotals.investment / totalTrackedExpenses) * 100
    : 0;
  const essentialShare = totalTrackedExpenses > 0
    ? (farolTotals.essential / totalTrackedExpenses) * 100
    : 0;
  const farolRows = [
    {
      id: 'essential',
      label: 'Essencial',
      value: farolTotals.essential,
      detail: `${essentialShare.toFixed(0)}%`,
      textColor: 'text-emerald-600',
      barColor: 'bg-emerald-500',
      width: totalTrackedExpenses > 0 ? (farolTotals.essential / totalTrackedExpenses) * 100 : 0,
    },
    {
      id: 'superfluous',
      label: 'Supérfluo',
      value: farolTotals.superfluous,
      detail: `${superfluousShare.toFixed(0)}%`,
      textColor: superfluousShare > 30 ? 'text-red-600' : 'text-orange-500',
      barColor: superfluousShare > 30 ? 'bg-red-500' : 'bg-orange-400',
      width: totalTrackedExpenses > 0 ? (farolTotals.superfluous / totalTrackedExpenses) * 100 : 0,
    },
    {
      id: 'investment',
      label: 'Investimento',
      value: farolTotals.investment,
      detail: `${investmentShare.toFixed(0)}%`,
      textColor: 'text-blue-600',
      barColor: 'bg-blue-500',
      width: totalTrackedExpenses > 0 ? (farolTotals.investment / totalTrackedExpenses) * 100 : 0,
    },
  ];
  const getTransactionIcon = (transaction: typeof transactions[0]) => {
    if (transaction.isTransfer) return <ArrowRightLeft className="w-5 h-5" />;
    const category = categories.find(c => c.id === transaction.categoryId);
    if (category?.type === 'Receita') {
      return <ArrowDownRight className="w-5 h-5" />;
    }
    return <ArrowUpRight className="w-5 h-5" />;
  };
  const getTransactionSource = (transaction: typeof transactions[0]) => {
    if (transaction.accountId) {
      const account = accounts.find(a => a.id === transaction.accountId);
      return account?.name || 'Conta';
    }
    if (transaction.cardId) {
      const card = creditCards.find(c => c.id === transaction.cardId);
      return card?.name || 'Cartão';
    }
    return '';
  };
  const iconRegistry = Icons as unknown as Record<string, ComponentType<{ className?: string; style?: CSSProperties }>>;

  const getCategoryIcon = (categoryId?: string, color?: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return null;
    const IconComponent = iconRegistry[
      category.icon.split('-').map((word, i) =>
        i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) :
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join('')
    ];
    return IconComponent ? (
      <IconComponent className="w-5 h-5" style={{ color: color || category.color }} />
    ) : null;
  };
  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900 text-white rounded-[32px] p-6 shadow-2xl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute right-10 bottom-0 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl" />
        </div>
        <div className="relative grid grid-cols-1 sm:grid-cols-[1.3fr_1fr_1fr] items-start gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.32em] text-white/60 uppercase">Disponível hoje</p>
            <p className="text-4xl font-black leading-tight">{formatCurrency(spendingSnapshot.dailyAvailable)}</p>
            <p className="text-sm text-white/70">
              Renda - contas fixas (que você marcar) - meta investimento dividido por {daysInMonth} dias.
            </p>
            <p className="text-xs text-white/60">
              Cobertura estimada de {runwayDays || 0} dia{runwayDays === 1 ? '' : 's'} com o saldo atual.
            </p>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-2xl px-3 py-2 backdrop-blur text-right text-xs">
            <p className="text-white/60">Dias do mês</p>
            <p className="text-lg font-semibold leading-tight">{daysInMonth}</p>
            <p className="mt-2 text-white/60">Bolso livre</p>
            <p className="text-base font-semibold text-emerald-200 leading-tight">
              {formatCurrency(spendingSnapshot.buffer)}
            </p>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-2xl px-3 py-2 backdrop-blur text-right text-xs">
            <p className="text-white/60">Saldo atual</p>
            <p className="text-lg font-semibold leading-tight">{formatCurrency(totalBalance)}</p>
            <p className="mt-2 text-white/60">Cobertura estimada</p>
            <p className="text-base font-semibold text-emerald-200 leading-tight">
              {runwayDays > 0 ? `${runwayDays} dia${runwayDays === 1 ? '' : 's'}` : 'Ajuste seu fluxo'}
            </p>
            <p className="text-[11px] text-white/60 mt-1">
              Considerando {accountsIncluded} conta{accountsIncluded === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 text-xs">
          <div className="bg-white/10 border border-white/10 rounded-xl p-3">
            <p className="text-white/60">Renda</p>
            <p className="text-sm font-semibold text-white">{formatCurrency(spendingSnapshot.monthlyIncome)}</p>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-xl p-3">
            <p className="text-white/60">Contas fixas</p>
            <p className="text-sm font-semibold text-white">{formatCurrency(spendingSnapshot.monthlyFixed)}</p>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-xl p-3">
            <p className="text-white/60">Meta invest. (20%)</p>
            <p className="text-sm font-semibold text-white">{formatCurrency(spendingSnapshot.investmentGoalValue)}</p>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-white rounded-[28px] p-5 shadow-lg border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Farol de Gastos</p>
              <p className="text-xs text-slate-500">Essencial x supérfluo x investimento (mês atual)</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Mobile pronto</span>
          </div>
          <div className="space-y-3">
            {farolRows.map(row => (
              <div key={row.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{row.label}</span>
                  <span className={`font-semibold ${row.textColor}`}>
                    {formatCurrency(row.value)}
                    {row.detail ? ` (${row.detail})` : ''}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${row.barColor}`}
                    style={{ width: `${Math.min(row.width, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#0f1d35] text-white rounded-[28px] p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold tracking-[0.3em] text-white/50 uppercase">Extrato</p>
              <h2 className="text-2xl font-semibold">Lançamentos rápidos</h2>
            </div>
            <span className="px-3 py-2 rounded-xl bg-white/10 text-[11px] text-white/70 border border-white/10">
              Pensa menos, registra em 2s
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/40 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/70"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-2xl text-sm font-semibold border transition-colors ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 border-white'
                  : 'border-white/10 text-white/70 hover:border-white/40'
              }`}
            >
              Todas
            </button>
            {brandFilters.map(filter => {
              const Icon = filter.icon;
              const isActive = filterType === filter.value;
              return (
                <button
                  key={filter.value}
                  onClick={() => setFilterType(filter.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold border transition-colors ${
                    isActive
                      ? 'bg-white/10 border-white text-white shadow-lg'
                      : 'border-white/10 text-white/60 hover:border-white/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {filter.label}
                </button>
              );
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/40 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/70"
            >
              <option value="all">Todas as Contas</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
              {creditCards.map(card => (
                <option key={card.id} value={card.id}>{card.name}</option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/40 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/70"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-[28px] p-5 shadow-lg border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Categorias e orçamentos</p>
            <p className="text-xs text-slate-500">Visão mensal - {monthLabel}</p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">Saldo por categoria</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Total de categorias</p>
            <p className="text-2xl font-bold text-slate-900">{budgetResume.total}</p>
            <p className="text-[11px] text-slate-500">{budgetedExpenseCategories.length} com orçamento ativo</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs text-emerald-700">Dentro do orçamento</p>
            <p className="text-2xl font-bold text-emerald-800">{budgetResume.withinBudget}</p>
            <p className="text-[11px] text-emerald-600">Categorias de despesa</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
            <p className="text-xs text-rose-700">Acima do orçamento</p>
            <p className="text-2xl font-bold text-rose-700">{budgetResume.overBudget}</p>
            <p className="text-[11px] text-rose-600">Atenção neste mês</p>
          </div>
        </div>
        {sortedCategoryBudgets.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-500">
            Cadastre categorias em Ajustes para acompanhar os orçamentos.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {sortedCategoryBudgets.map(item => {
              const { category } = item;
              const isExpense = category.type === 'Despesa';
              const progressWidth = item.considersBudget ? Math.min(item.progress, 100) : 0;
              const barColor = item.status === 'over' ? 'bg-rose-500' : isExpense ? 'bg-slate-900' : 'bg-blue-500';
              const remainingColor = item.status === 'over' ? 'text-rose-600' : item.status === 'income' ? 'text-blue-600' : 'text-emerald-600';
              const utilizationText = item.considersBudget
                ? `${Math.min(item.progress, 999).toFixed(1)}% do orçamento utilizado`
                : isExpense
                  ? 'Sem orçamento definido para esta categoria'
                  : 'Categoria de receita';
              const amountValue = isExpense ? item.spent : item.received;
              const iconElement = getCategoryIcon(category.id, category.color);
              const budgetValue = item.budget > 0 ? formatCurrency(item.budget) : 'Sem orçamento';
              return (
                <div key={category.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl border flex items-center justify-center"
                        style={{
                          backgroundColor: hexToRgba(category.color, 0.12),
                          borderColor: hexToRgba(category.color, 0.5),
                        }}
                      >
                        {iconElement ?? (
                          <span className="text-sm font-semibold" style={{ color: category.color }}>
                            {getCategoryInitials(category.name)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{category.name}</p>
                        <p className="text-xs text-slate-500">
                          {category.type}
                          {category.logicTag ? ` • ${category.logicTag}` : ''}
                        </p>
                      </div>
                    </div>
                    {item.considersBudget && (
                      <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${item.status === 'over' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                        {item.status === 'over' ? 'Acima' : 'Ok'}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">{isExpense ? 'Gasto' : 'Recebido'}</p>
                      <p className="font-semibold text-slate-900">{formatCurrency(amountValue)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Orçamento</p>
                      <p className="font-semibold text-slate-900">{budgetValue}</p>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
                    <div className={`h-full ${barColor}`} style={{ width: `${progressWidth}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="text-slate-500">{utilizationText}</span>
                    <span className={`font-semibold ${remainingColor}`}>
                      {item.considersBudget ? formatCurrency(item.remaining) : budgetValue}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="space-y-6">
        {Object.entries(groupedTransactions).length === 0 ? (
          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-8 text-center text-white/60">
            Nenhuma transação encontrada
          </div>
        ) : (
          Object.entries(groupedTransactions).map(([monthKey, txns]) => {
            const [year, month] = monthKey.split('-');
            const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', {
              month: 'long',
              year: 'numeric',
            });
            return (
              <div key={monthKey} className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-500 uppercase px-1">
                  {monthName}
                </h3>
                <div className="space-y-3">
                  {txns.map(transaction => {
                    const category = categories.find(c => c.id === transaction.categoryId);
                    const isTransfer = transaction.isTransfer;
                    const isIncome = category?.type === 'Receita';
                    const accentColor = isTransfer
                      ? '#38bdf8'
                      : category?.color || (isIncome ? '#34d399' : '#f87171');
                    const iconElement = isTransfer
                      ? getTransactionIcon(transaction)
                      : getCategoryIcon(transaction.categoryId, accentColor) ||
                        getTransactionIcon(transaction);
                    const amountClass = isTransfer
                      ? 'text-sky-400'
                      : isIncome
                        ? 'text-emerald-400'
                        : 'text-rose-400';
                    const amountPrefix = isTransfer ? '' : isIncome ? '+ ' : '- ';
                    return (
                      <div
                        key={transaction.id}
                        className="bg-slate-950/90 border border-white/5 rounded-3xl p-4 text-white shadow-lg hover:border-white/20 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className="w-12 h-12 rounded-2xl border flex items-center justify-center"
                            style={{
                              backgroundColor: hexToRgba(accentColor, 0.1),
                              borderColor: hexToRgba(accentColor, 0.35),
                            }}
                          >
                            {iconElement}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">
                              {transaction.description || 'Transação'}
                              {transaction.totalInstallments && (
                                <span className="text-xs text-white/50 ml-2">
                                  {transaction.installmentNumber}/{transaction.totalInstallments}
                                </span>
                              )}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-white/60 mt-1">
                              <span>{formatDate(transaction.date)}</span>
                              <span>• {getTransactionSource(transaction)}</span>
                              {category && (
                                <span className="flex items-center gap-2">
                                  <span
                                    className="w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-semibold"
                                    style={{
                                      color: accentColor,
                                      borderColor: hexToRgba(accentColor, 0.4),
                                      backgroundColor: hexToRgba(accentColor, 0.15),
                                    }}
                                  >
                                    {getCategoryInitials(category.name)}
                                  </span>
                                  {category.name}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${amountClass}`}>
                              {amountPrefix}
                              {formatCurrency(transaction.amount)}
                            </p>
                            {transaction.status === 'pendente' && (
                              <span className="text-xs text-orange-400 font-medium">Pendente</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
