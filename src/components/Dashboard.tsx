import { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  TrendingUp,
  Target,
  AlertCircle,
  Wallet,
  PiggyBank,
  Briefcase,
  CreditCard,
  Info,
} from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import {
  calculateTotalBalance,
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
  calculateExpensesByLogicTag,
  calculateMonthlyFixedExpenses,
  formatCurrency,
} from '../utils/calculations';

export function Dashboard() {
  const { accounts, creditCards, transactions, categories } = useFinanceData();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const daysInMonth = useMemo(
    () => new Date(currentYear, currentMonth + 1, 0).getDate(),
    [currentMonth, currentYear]
  );

  const stats = useMemo(() => {
    const totalBalance = calculateTotalBalance(accounts);
    const monthlyIncome = calculateMonthlyIncome(transactions, categories, currentMonth, currentYear);
    const monthlyExpenses = calculateMonthlyExpenses(transactions, categories, currentMonth, currentYear);
    const monthlyFixed = calculateMonthlyFixedExpenses(transactions, currentMonth, currentYear);
    const { essential, superfluous, investment } = calculateExpensesByLogicTag(
      transactions,
      categories,
      currentMonth,
      currentYear
    );

    const totalExpenses = essential + superfluous + investment;
    const superfluousPercentage = totalExpenses > 0 ? (superfluous / totalExpenses) * 100 : 0;
    const investmentPercentage = monthlyIncome > 0 ? (investment / monthlyIncome) * 100 : 0;

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlyFixed,
      essential,
      superfluous,
      investment,
      superfluousPercentage,
      investmentPercentage,
    };
  }, [accounts, transactions, categories, currentMonth, currentYear]);

  const cardSummaries = useMemo(() => {
    return creditCards.map(card => {
      const currentInvoice = transactions
        .filter(txn => txn.cardId === card.id && !txn.isTransfer)
        .reduce((sum, txn) => sum + txn.amount, 0);
      return {
        id: card.id,
        name: card.name,
        currentInvoice,
      };
    });
  }, [creditCards, transactions]);

  const isSuperfluousHigh = stats.superfluousPercentage > 30;
  const investmentGoal = 20;
  const investmentGoalValue = Math.max(stats.monthlyIncome * (investmentGoal / 100), 0);
  const investmentProgress = Math.min(Math.max(stats.investmentPercentage, 0), 100);
  const safeDays = Math.max(daysInMonth, 1);
  const availableBuffer = stats.monthlyIncome - stats.monthlyFixed - investmentGoalValue;
  const availableToday = Math.max(availableBuffer / safeDays, 0);
  const investmentShare = stats.monthlyExpenses > 0 ? (stats.investment / stats.monthlyExpenses) * 100 : 0;
  const essentialShare = stats.monthlyExpenses > 0 ? (stats.essential / stats.monthlyExpenses) * 100 : 0;

  const netWorthSeries = useMemo(() => {
    const paid = transactions.filter(txn => txn.status === 'pago' && !txn.isTransfer);
    const monthly: Record<string, { income: number; expense: number; year: number; month: number }> = {};

    paid.forEach(txn => {
      const date = new Date(txn.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[key]) {
        monthly[key] = { income: 0, expense: 0, year: date.getFullYear(), month: date.getMonth() };
      }
      const category = categories.find(c => c.id === txn.categoryId);
      if (category?.type === 'Receita') {
        monthly[key].income += txn.amount;
      } else if (category?.type === 'Despesa') {
        monthly[key].expense += txn.amount;
      }
    });

    const sortedKeys = Object.keys(monthly).sort();
    let runningIncome = 0;
    let runningExpense = 0;

    return sortedKeys.map(key => {
      const bucket = monthly[key];
      runningIncome += bucket.income;
      runningExpense += bucket.expense;
      const netWorth = runningIncome - runningExpense;

      return {
        key,
        label: new Date(bucket.year, bucket.month, 1).toLocaleDateString('pt-BR', { month: 'short' }),
        assets: runningIncome,
        liabilities: runningExpense,
        netWorth,
      };
    });
  }, [transactions, categories]);

  const accountTypeStyles: Record<
    'Corrente' | 'Investimento' | 'Dinheiro' | 'default',
    { icon: LucideIcon; colorClass: string; badgeClass: string }
  > = {
    Corrente: { icon: Wallet, colorClass: 'text-purple-200', badgeClass: 'bg-purple-500/20' },
    Investimento: { icon: TrendingUp, colorClass: 'text-emerald-200', badgeClass: 'bg-emerald-500/20' },
    Dinheiro: { icon: PiggyBank, colorClass: 'text-amber-200', badgeClass: 'bg-amber-500/20' },
    default: { icon: Briefcase, colorClass: 'text-slate-200', badgeClass: 'bg-slate-500/20' },
  };

  type FinanceTile = {
    id: string;
    name: string;
    value: number;
    icon: LucideIcon;
    colorClass: string;
    badgeClass: string;
    subtitle?: string;
  };

  type NetWorthPoint = {
    key: string;
    label: string;
    assets: number;
    liabilities: number;
    netWorth: number;
  };

  const accountTiles: FinanceTile[] = accounts.map(account => {
    const style = accountTypeStyles[account.type] ?? accountTypeStyles.default;
    return {
      id: account.id,
      name: account.name,
      value: account.currentBalance,
      icon: style.icon,
      colorClass: style.colorClass,
      badgeClass: style.badgeClass,
    };
  });

  const creditCardStyle = {
    icon: CreditCard,
    colorClass: 'text-blue-200',
    badgeClass: 'bg-blue-500/20',
  };

  const cardTiles: FinanceTile[] = cardSummaries.map(card => ({
    id: `card-${card.id}`,
    name: card.name,
    value: card.currentInvoice,
    icon: creditCardStyle.icon,
    colorClass: creditCardStyle.colorClass,
    badgeClass: creditCardStyle.badgeClass,
    subtitle: 'CartÃƒÂ£o de CrÃƒÂ©dito',
  }));

  const combinedTiles = [...accountTiles, ...cardTiles];
  const showAccountsSection = combinedTiles.length > 0;

  const farolRows = [
    {
      id: 'essential',
      label: 'Essencial',
      value: stats.essential,
      detail: `${essentialShare.toFixed(0)}%`,
      textColor: 'text-emerald-600',
      barColor: 'bg-emerald-500',
      width: stats.monthlyExpenses > 0 ? (stats.essential / stats.monthlyExpenses) * 100 : 0,
    },
    {
      id: 'superfluous',
      label: 'SupÃƒÂ©rfluo',
      value: stats.superfluous,
      detail: `${stats.superfluousPercentage.toFixed(0)}%`,
      textColor: isSuperfluousHigh ? 'text-red-600' : 'text-orange-500',
      barColor: isSuperfluousHigh ? 'bg-red-500' : 'bg-orange-400',
      width: stats.monthlyExpenses > 0 ? (stats.superfluous / stats.monthlyExpenses) * 100 : 0,
    },
    {
      id: 'investment',
      label: 'Investimento',
      value: stats.investment,
      detail: `${investmentShare.toFixed(0)}%`,
      textColor: 'text-blue-600',
      barColor: 'bg-blue-500',
      width: stats.monthlyExpenses > 0 ? (stats.investment / stats.monthlyExpenses) * 100 : 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[28px] p-6 shadow-lg border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">PatrimÃ´nio LÃ­quido</p>
            <p className="text-xs text-slate-500">Ativos vs passivos acumulados por mÃªs</p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">Linha motivadora</span>
        </div>

        {netWorthSeries.length === 0 ? (
          <p className="text-sm text-slate-500">Adicione transaÃ§Ãµes pagas para ver a evoluÃ§Ã£o.</p>
        ) : (
          <NetWorthChart data={netWorthSeries} />
        )}
      </div>

      <div className="bg-[#0f1d35] text-white rounded-[28px] p-6 shadow-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-white/70">DisponÃ­vel para gastar hoje</h3>
            <p className="text-4xl font-bold mt-2">{formatCurrency(availableToday)}</p>
            <p className="text-xs text-white/60 mt-1">
              Renda - contas fixas (marcadas por vocÃª) - meta investimento ({investmentGoal}%) dividido por {daysInMonth} dias.
            </p>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-2xl px-3 py-2 text-right">
            <p className="text-[11px] text-white/60 uppercase tracking-wide">Bolso livre</p>
            <p className="text-lg font-semibold leading-tight">{formatCurrency(availableBuffer)}</p>
            <p className="text-[11px] text-white/50 mt-1">no mÃªs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-sm text-emerald-200 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Renda</span>
            </div>
            <p className="text-xl font-semibold">{formatCurrency(stats.monthlyIncome)}</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-sm text-amber-200 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span>Contas fixas</span>
            </div>
            <p className="text-xl font-semibold text-amber-200">
              {formatCurrency(stats.monthlyFixed)}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-sm text-blue-200 mb-1">
              <Target className="w-4 h-4" />
              <span>Meta invest. ({investmentGoal}%)</span>
            </div>
            <p className="text-xl font-semibold text-blue-200">
              {formatCurrency(investmentGoalValue)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[28px] p-6 shadow-lg border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Meta de Investimento</p>
            <p className="text-xs text-slate-500">Investido este m?s</p>
          </div>
        </div>

        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>Investido este m?s</span>
          <span className="font-semibold">
            {stats.investmentPercentage.toFixed(1)}% de {investmentGoal}%
          </span>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${investmentProgress}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-3">
          {formatCurrency(stats.investment)} de {formatCurrency(investmentGoalValue)}
        </p>
      </div>

      <div className="bg-white rounded-[28px] p-6 shadow-lg border border-slate-100 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Farol de Gastos</p>
            <p className="text-xs text-slate-500">Veja como seus gastos estÃƒÂ£o distribuÃƒÂ­dos</p>
          </div>
        </div>

        <div className="space-y-4">
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

      {showAccountsSection && (
        <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-semibold">Contas</h3>
          <div className="space-y-3">
            {combinedTiles.map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="bg-slate-900 rounded-2xl p-4 flex items-center justify-between border border-slate-800/60"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${item.badgeClass}`}>
                      <Icon className={`w-5 h-5 ${item.colorClass}`} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-300">{item.name}</p>
                      {item.subtitle && (
                        <p className="text-xs text-slate-500">{item.subtitle}</p>
                      )}
                      <p className="text-xl font-semibold">{formatCurrency(item.value)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {accounts.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <p className="text-slate-600 mb-2">Comece criando sua primeira conta!</p>
          <p className="text-sm text-slate-500">
            VÃƒÂ¡ atÃƒÂ© Ajustes para adicionar contas e comeÃƒÂ§ar a controlar suas finanÃƒÂ§as.
          </p>
        </div>
      )}
    </div>
  );
}
