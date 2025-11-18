import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Target, AlertCircle } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import {
  calculateTotalBalance,
  calculateMonthlyIncome,
  calculateMonthlyExpenses,
  calculateExpensesByLogicTag,
  formatCurrency,
} from '../utils/calculations';

export function Dashboard() {
  const { accounts, transactions, categories } = useFinanceData();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const stats = useMemo(() => {
    const totalBalance = calculateTotalBalance(accounts);
    const monthlyIncome = calculateMonthlyIncome(transactions, categories, currentMonth, currentYear);
    const monthlyExpenses = calculateMonthlyExpenses(transactions, categories, currentMonth, currentYear);
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
      essential,
      superfluous,
      investment,
      superfluousPercentage,
      investmentPercentage,
    };
  }, [accounts, transactions, categories, currentMonth, currentYear]);

  const isSuperfluousHigh = stats.superfluousPercentage > 30;
  const investmentGoal = 20;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <h3 className="text-sm font-medium text-slate-400 mb-2">Saldo Total</h3>
        <p className="text-4xl font-bold mb-4">{formatCurrency(stats.totalBalance)}</p>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-slate-400">Receitas</span>
            </div>
            <p className="text-lg font-semibold text-green-400">
              {formatCurrency(stats.monthlyIncome)}
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-xs text-slate-400">Despesas</span>
            </div>
            <p className="text-lg font-semibold text-red-400">
              {formatCurrency(stats.monthlyExpenses)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-slate-900">Meta de Investimento</h3>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Investido este mês</span>
            <span className="font-semibold text-slate-900">
              {stats.investmentPercentage.toFixed(1)}% de {investmentGoal}%
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.investmentPercentage >= investmentGoal
                  ? 'bg-green-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(stats.investmentPercentage, 100)}%` }}
            />
          </div>

          <p className="text-xs text-slate-500 mt-2">
            {formatCurrency(stats.investment)} de {formatCurrency(stats.monthlyIncome * 0.2)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className={`w-5 h-5 ${isSuperfluousHigh ? 'text-red-600' : 'text-blue-600'}`} />
          <h3 className="text-lg font-semibold text-slate-900">Farol de Gastos</h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Essencial</span>
              <span className="font-semibold text-green-700">
                {formatCurrency(stats.essential)}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-green-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${stats.monthlyExpenses > 0 ? (stats.essential / stats.monthlyExpenses) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Supérfluo</span>
              <span className={`font-semibold ${isSuperfluousHigh ? 'text-red-600' : 'text-orange-600'}`}>
                {formatCurrency(stats.superfluous)} ({stats.superfluousPercentage.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isSuperfluousHigh ? 'bg-red-500' : 'bg-orange-500'
                }`}
                style={{
                  width: `${stats.monthlyExpenses > 0 ? (stats.superfluous / stats.monthlyExpenses) * 100 : 0}%`,
                }}
              />
            </div>
            {isSuperfluousHigh && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ Gastos supérfluos acima de 30%
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Investimento</span>
              <span className="font-semibold text-blue-600">
                {formatCurrency(stats.investment)}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${stats.monthlyExpenses > 0 ? (stats.investment / stats.monthlyExpenses) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {accounts.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <p className="text-slate-600 mb-2">Comece criando sua primeira conta!</p>
          <p className="text-sm text-slate-500">
            Vá até Ajustes para adicionar contas e começar a controlar suas finanças.
          </p>
        </div>
      )}
    </div>
  );
}
