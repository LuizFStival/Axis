import { useState } from 'react';
import { Plus, Edit2, Trash2, Wallet, Tag, CreditCard as CreditCardIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { formatCurrency } from '../utils/calculations';
import { Account, Category, CreditCard } from '../types';

type SettingsTab = 'accounts' | 'categories' | 'cards';

export function Settings() {
  const {
    accounts,
    categories,
    creditCards,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
  } = useFinanceData();

  const [activeTab, setActiveTab] = useState<SettingsTab>('accounts');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  const handleAddAccount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const accountData = {
      name: formData.get('name') as string,
      type: formData.get('type') as 'Corrente' | 'Investimento' | 'Dinheiro',
      currentBalance: parseFloat(formData.get('balance') as string),
      includeInTotal: formData.get('includeInTotal') === 'on',
    };

    if (editingAccount) {
      updateAccount(editingAccount.id, accountData);
    } else {
      addAccount(accountData);
    }

    setShowAccountModal(false);
    setEditingAccount(null);
  };

  const handleAddCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const categoryData = {
      name: formData.get('name') as string,
      icon: formData.get('icon') as string,
      color: formData.get('color') as string,
      type: formData.get('type') as 'Receita' | 'Despesa',
      logicTag: formData.get('logicTag') as 'Essencial' | 'Supérfluo' | 'Investimento' | undefined,
      monthlyBudget: formData.get('budget') ? parseFloat(formData.get('budget') as string) : undefined,
    };

    if (editingCategory) {
      updateCategory(editingCategory.id, categoryData);
    } else {
      addCategory(categoryData);
    }

    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  const handleAddCard = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const cardData = {
      name: formData.get('name') as string,
      closingDay: parseInt(formData.get('closingDay') as string),
      dueDay: parseInt(formData.get('dueDay') as string),
      totalLimit: parseFloat(formData.get('limit') as string),
    };

    if (editingCard) {
      updateCreditCard(editingCard.id, cardData);
    } else {
      addCreditCard(cardData);
    }

    setShowCardModal(false);
    setEditingCard(null);
  };

  const iconOptions = [
    'wallet', 'dollar-sign', 'trending-up', 'home', 'car', 'utensils',
    'shopping-bag', 'smile', 'briefcase', 'heart', 'music', 'phone',
    'coffee', 'gift', 'plane', 'book', 'zap', 'star'
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              activeTab === 'accounts'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Wallet className="w-4 h-4 inline-block mr-2" />
            Contas
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              activeTab === 'categories'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Tag className="w-4 h-4 inline-block mr-2" />
            Categorias
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              activeTab === 'cards'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CreditCardIcon className="w-4 h-4 inline-block mr-2" />
            Cartões
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'accounts' && (
            <div className="space-y-3">
              <button
                onClick={() => {
                  setEditingAccount(null);
                  setShowAccountModal(true);
                }}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Adicionar Conta
              </button>

              {accounts.map(account => (
                <div key={account.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{account.name}</p>
                    <p className="text-sm text-slate-500">{account.type}</p>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {formatCurrency(account.currentBalance)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingAccount(account);
                      setShowAccountModal(true);
                    }}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir esta conta?')) {
                        deleteAccount(account.id);
                      }
                    }}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-3">
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setShowCategoryModal(true);
                }}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Adicionar Categoria
              </button>

              {categories.map(category => {
                const IconComponent = (Icons as Record<string, React.FC<{ className?: string }>>)[
                  category.icon.split('-').map((word, i) =>
                    i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) :
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join('')
                ];

                return (
                  <div key={category.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      {IconComponent && <IconComponent className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{category.name}</p>
                      <p className="text-sm text-slate-500">
                        {category.type}
                        {category.logicTag && ` • ${category.logicTag}`}
                      </p>
                      {category.monthlyBudget && (
                        <p className="text-sm text-slate-600 mt-1">
                          Meta: {formatCurrency(category.monthlyBudget)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setShowCategoryModal(true);
                      }}
                      className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir esta categoria?')) {
                          deleteCategory(category.id);
                        }
                      }}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'cards' && (
            <div className="space-y-3">
              <button
                onClick={() => {
                  setEditingCard(null);
                  setShowCardModal(true);
                }}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Adicionar Cartão
              </button>

              {creditCards.map(card => (
                <div key={card.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{card.name}</p>
                    <p className="text-sm text-slate-500">
                      Fecha dia {card.closingDay} • Vence dia {card.dueDay}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      Limite: {formatCurrency(card.totalLimit)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingCard(card);
                      setShowCardModal(true);
                    }}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir este cartão?')) {
                        deleteCreditCard(card.id);
                      }
                    }}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => {
            setShowAccountModal(false);
            setEditingAccount(null);
          }} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              {editingAccount ? 'Editar Conta' : 'Nova Conta'}
            </h3>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingAccount?.name}
                  placeholder="Ex: Nubank"
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
                <select
                  name="type"
                  defaultValue={editingAccount?.type || 'Corrente'}
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Corrente">Corrente</option>
                  <option value="Investimento">Investimento</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Saldo Atual</label>
                <input
                  type="number"
                  step="0.01"
                  name="balance"
                  defaultValue={editingAccount?.currentBalance || 0}
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="includeInTotal"
                    defaultChecked={editingAccount?.includeInTotal ?? true}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Incluir no saldo total
                  </span>
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAccountModal(false);
                    setEditingAccount(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingAccount ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingCategory?.name}
                  placeholder="Ex: Alimentação"
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
                <select
                  name="type"
                  defaultValue={editingCategory?.type || 'Despesa'}
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Despesa">Despesa</option>
                  <option value="Receita">Receita</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tag Lógica</label>
                <select
                  name="logicTag"
                  defaultValue={editingCategory?.logicTag || ''}
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Nenhuma</option>
                  <option value="Essencial">Essencial</option>
                  <option value="Supérfluo">Supérfluo</option>
                  <option value="Investimento">Investimento</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ícone</label>
                <select
                  name="icon"
                  defaultValue={editingCategory?.icon || 'circle'}
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {iconOptions.map(icon => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cor</label>
                <input
                  type="color"
                  name="color"
                  defaultValue={editingCategory?.color || '#6366f1'}
                  className="w-full h-12 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Orçamento Mensal (opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="budget"
                  defaultValue={editingCategory?.monthlyBudget}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCategory ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => {
            setShowCardModal(false);
            setEditingCard(null);
          }} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              {editingCard ? 'Editar Cartão' : 'Novo Cartão'}
            </h3>
            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingCard?.name}
                  placeholder="Ex: Nubank Mastercard"
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dia de Fechamento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  name="closingDay"
                  defaultValue={editingCard?.closingDay || 10}
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dia de Vencimento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  name="dueDay"
                  defaultValue={editingCard?.dueDay || 17}
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Limite Total</label>
                <input
                  type="number"
                  step="0.01"
                  name="limit"
                  defaultValue={editingCard?.totalLimit || 0}
                  className="w-full px-4 py-3 bg-slate-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCardModal(false);
                    setEditingCard(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCard ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
