import { useState } from 'react';
import { LayoutDashboard, Receipt, Plus, CreditCard, Settings as SettingsIcon } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Dashboard } from './components/Dashboard';
import { Extrato } from './components/Extrato';
import { CreditCards } from './components/CreditCards';
import { Settings } from './components/Settings';
import { QuickAddModal } from './components/QuickAddModal';
import { FinanceDataProvider } from './hooks/useFinanceData';
import { AuthScreen } from './components/AuthScreen';

type Screen = 'dashboard' | 'extrato' | 'cards' | 'settings';

function AppShell() {
  const { isAuthenticated } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <FinanceDataProvider>
      <div className="min-h-screen bg-slate-100 pb-20">
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">Axis</div>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Finance</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              {currentScreen === 'dashboard' && 'Dashboard'}
              {currentScreen === 'extrato' && 'Extrato'}
              {currentScreen === 'cards' && 'Cartões'}
              {currentScreen === 'settings' && 'Ajustes'}
            </h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6">
          {currentScreen === 'dashboard' && <Dashboard />}
          {currentScreen === 'extrato' && <Extrato />}
          {currentScreen === 'cards' && <CreditCards />}
          {currentScreen === 'settings' && <Settings />}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
          <div className="max-w-2xl mx-auto flex items-center justify-around px-2 pt-2 pb-5">
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className={`flex flex-col items-center gap-1 py-3 px-4 transition-colors ${
                currentScreen === 'dashboard'
                  ? 'text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-6 h-6" />
              <span className="text-xs font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentScreen('extrato')}
              className={`flex flex-col items-center gap-1 py-3 px-4 transition-colors ${
                currentScreen === 'extrato'
                  ? 'text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-6 h-6" />
              <span className="text-xs font-medium">Extrato</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="relative -mt-10 active:scale-95 transition-transform"
              aria-label="Adicionar lan?amento"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/40 ring-4 ring-white">
                <Plus className="w-9 h-9 text-white" />
              </div>
            </button>

            <button
              onClick={() => setCurrentScreen('cards')}
              className={`flex flex-col items-center gap-1 py-3 px-4 transition-colors ${
                currentScreen === 'cards'
                  ? 'text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-6 h-6" />
              <span className="text-xs font-medium">Cartões</span>
            </button>

            <button
              onClick={() => setCurrentScreen('settings')}
              className={`flex flex-col items-center gap-1 py-3 px-4 transition-colors ${
                currentScreen === 'settings'
                  ? 'text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SettingsIcon className="w-6 h-6" />
              <span className="text-xs font-medium">Ajustes</span>
            </button>
          </div>
        </nav>

        <QuickAddModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      </div>
    </FinanceDataProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
