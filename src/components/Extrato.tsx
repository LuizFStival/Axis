import { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { formatCurrency, formatDate } from '../utils/calculations';

type FilterType = 'all' | 'income' | 'expense' | 'transfer';

export function Extrato() {
  const { transactions, categories, accounts, creditCards } = useFinanceData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  const getTransactionIcon = (transaction: typeof transactions[0]) => {
    if (transaction.isTransfer) return <ArrowRightLeft className="w-5 h-5" />;

    const category = categories.find(c => c.id === transaction.categoryId);
    if (category?.type === 'Receita') {
      return <ArrowDownRight className="w-5 h-5" />;
    }
    return <ArrowUpRight className="w-5 h-5" />;
  };

  const getTransactionColor = (transaction: typeof transactions[0]) => {
    if (transaction.isTransfer) return 'text-blue-600 bg-blue-50';

    const category = categories.find(c => c.id === transaction.categoryId);
    if (category?.type === 'Receita') return 'text-green-600 bg-green-50';
    return 'text-red-600 bg-red-50';
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

  const getCategoryIcon = (categoryId?: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return null;

    const IconComponent = (Icons as Record<string, React.FC<{ className?: string }>>)[
      category.icon.split('-').map((word, i) =>
        i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) :
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join('')
    ];

    return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar transações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'expense'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Despesas
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'income'
                ? 'bg-green-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Receitas
          </button>
          <button
            onClick={() => setFilterType('transfer')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'transfer'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Transferências
          </button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as Contas</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
              {creditCards.map(card => (
                <option key={card.id} value={card.id}>{card.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <p className="text-slate-400">Nenhuma transação encontrada</p>
          </div>
        ) : (
          Object.entries(groupedTransactions).map(([monthKey, txns]) => {
            const [year, month] = monthKey.split('-');
            const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', {
              month: 'long',
              year: 'numeric',
            });

            return (
              <div key={monthKey}>
                <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3 px-1">
                  {monthName}
                </h3>
                <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-100">
                  {txns.map(transaction => {
                    const category = categories.find(c => c.id === transaction.categoryId);

                    return (
                      <div key={transaction.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${getTransactionColor(transaction)}`}>
                            {transaction.isTransfer ? (
                              getTransactionIcon(transaction)
                            ) : (
                              getCategoryIcon(transaction.categoryId) || getTransactionIcon(transaction)
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {transaction.description}
                              {transaction.totalInstallments && (
                                <span className="text-xs text-slate-500 ml-2">
                                  {transaction.installmentNumber}/{transaction.totalInstallments}
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                              <span>{formatDate(transaction.date)}</span>
                              <span>•</span>
                              <span>{getTransactionSource(transaction)}</span>
                              {category && (
                                <>
                                  <span>•</span>
                                  <span>{category.name}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <p className={`font-semibold ${
                              transaction.isTransfer ? 'text-blue-600' :
                              category?.type === 'Receita' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {category?.type === 'Receita' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </p>
                            {transaction.status === 'pendente' && (
                              <span className="text-xs text-orange-600 font-medium">Pendente</span>
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
