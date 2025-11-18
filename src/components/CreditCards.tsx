import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CreditCard as CreditCardIcon } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { formatCurrency, getInvoiceMonth } from '../utils/calculations';
import { Invoice } from '../types';

export function CreditCards() {
  const { creditCards, transactions, categories } = useFinanceData();
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [monthOffset, setMonthOffset] = useState(0);

  const selectedCard = creditCards.find(card => card.id === selectedCardId) || creditCards[0];

  const invoices = useMemo(() => {
    if (!selectedCard) return [];

    const invoiceMap = new Map<string, Invoice>();
    const today = new Date();

    for (let offset = -2; offset <= 3; offset++) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      const month = targetDate.getMonth();
      const year = targetDate.getFullYear();

      const closingDate = new Date(year, month, selectedCard.closingDay);
      const dueDate = new Date(year, month, selectedCard.dueDay);

      if (dueDate < closingDate) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      invoiceMap.set(key, {
        month: String(month + 1).padStart(2, '0'),
        year,
        cardId: selectedCard.id,
        transactions: [],
        total: 0,
        closingDate,
        dueDate,
      });
    }

    transactions
      .filter(txn => txn.cardId === selectedCard.id)
      .forEach(txn => {
        const txnDate = new Date(txn.date);
        const { month, year } = getInvoiceMonth(selectedCard.closingDay, txnDate);
        const key = `${year}-${String(month + 1).padStart(2, '0')}`;

        const invoice = invoiceMap.get(key);
        if (invoice) {
          invoice.transactions.push(txn);
          invoice.total += txn.amount;
        }
      });

    return Array.from(invoiceMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return parseInt(a.month) - parseInt(b.month);
    });
  }, [selectedCard, transactions]);

  const currentInvoice = invoices.find((inv, index) => index === monthOffset + 2);

  const goToPreviousMonth = () => {
    if (monthOffset > -2) setMonthOffset(monthOffset - 1);
  };

  const goToNextMonth = () => {
    if (monthOffset < 3) setMonthOffset(monthOffset + 1);
  };

  const getMonthLabel = (offset: number) => {
    if (offset === 0) return 'Fatura Atual';
    if (offset === 1) return 'Próxima Fatura';
    if (offset > 1) return `Fatura +${offset}`;
    if (offset === -1) return 'Fatura Anterior';
    return `Fatura ${offset}`;
  };

  if (creditCards.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <CreditCardIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-2">Nenhum cartão cadastrado</p>
          <p className="text-sm text-slate-500">
            Vá até Ajustes para adicionar seus cartões de crédito.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {creditCards.length > 1 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Selecione o Cartão
          </label>
          <select
            value={selectedCardId || selectedCard?.id}
            onChange={(e) => {
              setSelectedCardId(e.target.value);
              setMonthOffset(0);
            }}
            className="w-full px-4 py-3 bg-slate-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {creditCards.map(card => (
              <option key={card.id} value={card.id}>
                {card.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedCard && (
        <>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <CreditCardIcon className="w-6 h-6" />
              <h3 className="text-xl font-bold">{selectedCard.name}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Limite Total</p>
                <p className="text-lg font-semibold">{formatCurrency(selectedCard.totalLimit)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Disponível</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(selectedCard.totalLimit - (currentInvoice?.total || 0))}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Fechamento</p>
                <p className="font-medium">Dia {selectedCard.closingDay}</p>
              </div>
              <div>
                <p className="text-slate-400">Vencimento</p>
                <p className="font-medium">Dia {selectedCard.dueDay}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <button
                onClick={goToPreviousMonth}
                disabled={monthOffset === -2}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-center">
                <p className="text-sm font-medium text-slate-600">
                  {getMonthLabel(monthOffset)}
                </p>
                <p className="text-xs text-slate-500">
                  {currentInvoice && new Date(currentInvoice.year, parseInt(currentInvoice.month) - 1).toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <button
                onClick={goToNextMonth}
                disabled={monthOffset === 3}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {currentInvoice && (
              <>
                <div className="p-6 bg-slate-50 border-b border-slate-200">
                  <p className="text-sm text-slate-600 mb-1">Total da Fatura</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {formatCurrency(currentInvoice.total)}
                  </p>
                  {currentInvoice.dueDate && (
                    <p className="text-sm text-slate-500 mt-2">
                      Vencimento: {currentInvoice.dueDate.toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>

                <div className="divide-y divide-slate-100">
                  {currentInvoice.transactions.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-slate-400">Nenhuma transação nesta fatura</p>
                    </div>
                  ) : (
                    currentInvoice.transactions
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(transaction => {
                        const category = categories.find(c => c.id === transaction.categoryId);

                        return (
                          <div key={transaction.id} className="p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-slate-900">
                                  {transaction.description}
                                  {transaction.totalInstallments && (
                                    <span className="text-xs text-slate-500 ml-2">
                                      {transaction.installmentNumber}/{transaction.totalInstallments}
                                    </span>
                                  )}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                  <span>
                                    {new Date(transaction.date).toLocaleDateString('pt-BR')}
                                  </span>
                                  {category && (
                                    <>
                                      <span>•</span>
                                      <span>{category.name}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="font-semibold text-slate-900">
                                  {formatCurrency(transaction.amount)}
                                </p>
                                {transaction.status === 'pendente' && (
                                  <span className="text-xs text-orange-600 font-medium">
                                    Pendente
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
