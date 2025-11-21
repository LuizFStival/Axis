import { useMemo, useState, type ComponentType } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import {
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
    { value: 'transfer' as FilterType, label: 'Transferencia', icon: ArrowRightLeft },
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
              ? ['Superfluo', 'Supérfluo', 'Supersup', 'SupǸrfluo']
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
      label: 'SupÃƒÆ’Ã‚Â©rfluo',
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
      return card?.name || 'CartÃƒÆ’Ã‚Â£o';
    }
    return '';
  };

  const getCategoryIcon = (categoryId?: string, color?: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return null;

    const IconComponent = (Icons as Record<string, ComponentType<{ className?: string }>>)[
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
        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.32em] text-white/60 uppercase">Dispon\u00edvel hoje</p>
            <p className="text-4xl font-black leading-tight">{formatCurrency(spendingSnapshot.dailyAvailable)}</p>
            <p className="text-sm text-white/70">
              Renda - contas fixas (que voc\u00ea marcar) - meta investimento dividido por {daysInMonth} dias.
            </p>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-2xl px-3 py-2 backdrop-blur text-right text-xs">
            <p className="text-white/60">Dias do m\u00eas</p>
            <p className="text-lg font-semibold leading-tight">{daysInMonth}</p>
            <p className="mt-2 text-white/60">Bolso livre</p>
            <p className="text-base font-semibold text-emerald-200 leading-tight">
              {formatCurrency(spendingSnapshot.buffer)}
            </p>
          </div>
        </div>

        <div className="relative grid grid-cols-3 gap-3 mt-5 text-xs">
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
              <p className="text-xs text-slate-500">Essencial x supÃƒÆ’Ã‚Â©rfluo x investimento (mÃƒÆ’Ã‚Âªs atual)</p>
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
              <h2 className="text-2xl font-semibold">Lan\u00e7amentos r\u00e1pidos</h2>
            </div>
            <span className="px-3 py-2 rounded-xl bg-white/10 text-[11px] text-white/70 border border-white/10">
              Pensa menos, registra em 2s
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Buscar transa\u00e7\u00f5es..."
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

      <div className="space-y-6">
        {Object.entries(groupedTransactions).length === 0 ? (
          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-8 text-center text-white/60">
            Nenhuma transaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o encontrada
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
                              {transaction.description || 'TransaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o'}
                              {transaction.totalInstallments && (
                                <span className="text-xs text-white/50 ml-2">
                                  {transaction.installmentNumber}/{transaction.totalInstallments}
                                </span>
                              )}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-white/60 mt-1">
                              <span>{formatDate(transaction.date)}</span>
                              <span>ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ {getTransactionSource(transaction)}</span>
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
