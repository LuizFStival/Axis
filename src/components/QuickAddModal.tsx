import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { TransactionType } from '../types';
import { formatCurrencyField, parseCurrencyInput } from '../utils/calculations';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const {
    accounts,
    categories,
    creditCards,
    addTransaction,
    addInstallmentTransaction,
  } = useFinanceData();

  const [type, setType] = useState<TransactionType>('Despesa');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [cardId, setCardId] = useState('');
  const [status, setStatus] = useState<'pago' | 'pendente'>('pago');
  const [paymentMethod, setPaymentMethod] = useState<'account' | 'card'>('account');
  const [transferToAccountId, setTransferToAccountId] = useState('');
  const [hasInstallments, setHasInstallments] = useState(false);
  const [installments, setInstallments] = useState('1');
  const [isFixedExpense, setIsFixedExpense] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType('Despesa');
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategoryId('');
      setAccountId(accounts[0]?.id || '');
      setCardId(creditCards[0]?.id || '');
      setStatus('pago');
      setPaymentMethod('account');
      setTransferToAccountId('');
      setHasInstallments(false);
      setInstallments('1');
      setIsFixedExpense(false);
    }
  }, [isOpen, accounts, creditCards]);

  useEffect(() => {
    if (type === 'Despesa') {
      const expenseCategories = categories.filter(c => c.type === 'Despesa');
      if (expenseCategories.length > 0 && !categoryId) {
        setCategoryId(expenseCategories[0].id);
      }
    } else if (type === 'Receita') {
      const incomeCategories = categories.filter(c => c.type === 'Receita');
      if (incomeCategories.length > 0 && !categoryId) {
        setCategoryId(incomeCategories[0].id);
      }
    }
  }, [type, categories, categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountValue = parseCurrencyInput(amount);
    if (amountValue <= 0) return;

    if (type === 'Transfer?ncia') {
      if (!accountId || !transferToAccountId) return;

      await addTransaction({
        amount: amountValue,
        description: description || 'Transfer?ncia',
        date,
        status: 'pago',
        accountId,
        isTransfer: true,
        transferToAccountId,
        isRecurring: false,
      });
    } else {
      const transactionData = {
        amount: amountValue,
        description,
        date,
        status,
        accountId: paymentMethod === 'account' ? accountId : undefined,
        cardId: paymentMethod === 'card' ? cardId : undefined,
        categoryId: categoryId || undefined,
        isRecurring: isFixedExpense,
        isTransfer: false,
      };

      if (hasInstallments && parseInt(installments) > 1) {
        await addInstallmentTransaction(transactionData, parseInt(installments));
      } else {
        await addTransaction(transactionData);
      }
    }

    onClose();
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Nova Transação</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('Despesa')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                type === 'Despesa'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('Receita')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                type === 'Receita'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => setType('Transferência')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                type === 'Transferência'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              Transferência
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Valor
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={(e) =>
                setAmount(e.currentTarget.value ? formatCurrencyField(e.currentTarget.value) : '')
              }
              onFocus={(e) => e.currentTarget.select()}
              placeholder="R$ 0,00"
              className="w-full px-4 py-4 text-2xl font-bold bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Descrição
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Almoço, Salário..."
              className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {type !== 'Transferência' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Categoria
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione...</option>
                  {filteredCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Forma de Pagamento
                </label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('account')}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      paymentMethod === 'account'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Débito
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      paymentMethod === 'card'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Crédito
                  </button>
                </div>

                {paymentMethod === 'account' ? (
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {creditCards.map(card => (
                      <option key={card.id} value={card.id}>
                        {card.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {paymentMethod === 'card' && (
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasInstallments}
                      onChange={(e) => setHasInstallments(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Parcelar compra
                    </span>
                  </label>

                  {hasInstallments && (
                    <input
                      type="number"
                      min="2"
                      max="24"
                      value={installments}
                      onChange={(e) => setInstallments(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                      placeholder="Número de parcelas"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('pago')}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      status === 'pago'
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Pago
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('pendente')}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      status === 'pendente'
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Pendente
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFixedExpense}
                  onChange={(e) => setIsFixedExpense(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">Marcar como conta fixa</span>
              </label>
            </>
          )}

          {type === 'Transferência' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  De (Conta)
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Para (Conta)
                </label>
                <select
                  value={transferToAccountId}
                  onChange={(e) => setTransferToAccountId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione...</option>
                  {accounts
                    .filter(account => account.id !== accountId)
                    .map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors"
          >
            Adicionar
          </button>
        </form>
      </div>
    </div>
  );
}
