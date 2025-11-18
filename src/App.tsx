import { useState } from 'react';
import { LayoutDashboard, Receipt, Plus, CreditCard, Settings as SettingsIcon } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { Dashboard } from './components/Dashboard';
import { Extrato } from './components/Extrato';
import { CreditCards } from './components/CreditCards';
import { Settings } from './components/Settings';
import { QuickAddModal } from './components/QuickAddModal';

type Screen = 'dashboard' | 'extrato' | 'cards' | 'settings';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-100 pb-20">
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-slate-900">
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
          <div className="max-w-2xl mx-auto flex items-center justify-around">
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
              className="relative -mt-6"
            >
              <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-7 h-7 text-white" />
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
    </AuthProvider>
  );
}

export default App;
