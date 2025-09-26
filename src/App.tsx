import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Calendar, 
  Users, 
  CreditCard, 
  FileText, 
  Menu, 
  X,
  Zap
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import MatchCreation from './components/MatchCreation';
import PlayerManagement from './components/PlayerManagement';
import PaymentSystem from './components/PaymentSystem';
import Reports from './components/Reports';
import { Match, PaymentTransaction } from './types';

type TabType = 'dashboard' | 'matches' | 'players' | 'payments' | 'reports';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [matches, setMatches] = useState<Match[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedPlayerForPayment, setSelectedPlayerForPayment] = useState<string>('');

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedMatches = localStorage.getItem('padel-matches');
    const savedPayments = localStorage.getItem('padel-payments');
    
    if (savedMatches) {
      const parsedMatches = JSON.parse(savedMatches);
      // Convert payment timestamps back to Date objects
      setMatches(parsedMatches);
    }
    
    if (savedPayments) {
      const parsedPayments = JSON.parse(savedPayments);
      // Convert timestamps back to Date objects
      const paymentsWithDates = parsedPayments.map((payment: any) => ({
        ...payment,
        timestamp: new Date(payment.timestamp)
      }));
      setPayments(paymentsWithDates);
    }
  }, []);

  // Save data to localStorage whenever matches or payments change
  useEffect(() => {
    localStorage.setItem('padel-matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('padel-payments', JSON.stringify(payments));
  }, [payments]);

  const handleCreateMatch = (newMatch: Match) => {
    setMatches(prev => [...prev, newMatch]);
  };

  const handleUpdateMatch = (updatedMatch: Match) => {
    setMatches(prev => prev.map(match => 
      match.id === updatedMatch.id ? updatedMatch : match
    ));
  };

  const handleAddPayment = (payment: PaymentTransaction) => {
    setPayments(prev => [...prev, payment]);
  };

  const handleNavigateToPayments = (playerId: string) => {
    setSelectedPlayerForPayment(playerId);
    setActiveTab('payments');
  };
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'matches', label: 'Partidas', icon: Calendar },
    { id: 'players', label: 'Jugadores', icon: Users },
    { id: 'payments', label: 'Cobros', icon: CreditCard },
    { id: 'reports', label: 'Reportes', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard matches={matches} payments={payments} />;
      case 'matches':
        return (
          <MatchCreation 
            matches={matches} 
            onCreateMatch={handleCreateMatch}
          />
        );
      case 'players':
        return (
          <PlayerManagement 
            matches={matches} 
            onUpdateMatch={handleUpdateMatch}
            onNavigateToPayments={handleNavigateToPayments}
          />
        );
      case 'payments':
        return (
          <PaymentSystem 
            matches={matches}
            payments={payments}
            onAddPayment={handleAddPayment}
            onUpdateMatch={handleUpdateMatch}
            selectedPlayerId={selectedPlayerForPayment}
          />
        );
      case 'reports':
        return <Reports matches={matches} payments={payments} />;
      default:
        return <Dashboard matches={matches} payments={payments} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">PadelPro</h1>
                <p className="text-xs text-gray-500">Sistema de Gestión</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as TabType)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    setActiveTab(id as TabType);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;