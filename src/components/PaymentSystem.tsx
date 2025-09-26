import React, { useState } from 'react';
import { CreditCard, DollarSign, Check, AlertCircle, Calculator } from 'lucide-react';
import { Match, PaymentTransaction, Player } from '../types';
import { formatCurrency, generateId } from '../utils';

interface PaymentSystemProps {
  matches: Match[];
  payments: PaymentTransaction[];
  onAddPayment: (payment: PaymentTransaction) => void;
  onUpdateMatch: (match: Match) => void;
}

const PaymentSystem: React.FC<PaymentSystemProps> = ({ 
  matches, 
  payments, 
  onAddPayment, 
  onUpdateMatch 
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'POS' | 'cash'>('POS');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [showChangeCalculator, setShowChangeCalculator] = useState(false);

  // Get all unpaid players from active matches
  const unpaidPlayers: (Player & { matchId: string; courtId: number })[] = [];
  
  matches
    .filter(match => !match.isCompleted)
    .forEach(match => {
      match.players
        .filter(player => player.name.trim() && !player.isPaid && player.totalGeneral > 0)
        .forEach(player => {
          unpaidPlayers.push({
            ...player,
            matchId: match.id,
            courtId: match.courtId
          });
        });
    });

  const selectedPlayer = unpaidPlayers.find(player => player.id === selectedPlayerId);

  const processPayment = () => {
    if (!selectedPlayer) return;

    let transaction: PaymentTransaction;
    
    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived);
      if (isNaN(received) || received < selectedPlayer.totalGeneral) {
        alert('El monto recibido debe ser mayor o igual al total a pagar');
        return;
      }
      
      transaction = {
        id: generateId(),
        playerId: selectedPlayer.id,
        playerName: selectedPlayer.name,
        amount: selectedPlayer.totalGeneral,
        method: 'cash',
        cashReceived: received,
        change: received - selectedPlayer.totalGeneral,
        timestamp: new Date()
      };
    } else {
      transaction = {
        id: generateId(),
        playerId: selectedPlayer.id,
        playerName: selectedPlayer.name,
        amount: selectedPlayer.totalGeneral,
        method: 'POS',
        timestamp: new Date()
      };
    }

    // Update match with paid player
    const match = matches.find(m => m.id === selectedPlayer.matchId);
    if (match) {
      const updatedMatch = {
        ...match,
        players: match.players.map(player =>
          player.id === selectedPlayer.id ? { ...player, isPaid: true, paymentMethod } : player
        )
      };
      onUpdateMatch(updatedMatch);
    }

    onAddPayment(transaction);
    
    // Reset form
    setSelectedPlayerId('');
    setCashReceived('');
    setShowChangeCalculator(false);
  };

  const calculateChange = () => {
    if (!selectedPlayer || !cashReceived) return 0;
    const received = parseFloat(cashReceived);
    if (isNaN(received)) return 0;
    return Math.max(0, received - selectedPlayer.totalGeneral);
  };

  const getTodayPayments = () => {
    const today = new Date().toDateString();
    return payments.filter(payment => payment.timestamp.toDateString() === today);
  };

  const todayPayments = getTodayPayments();
  const todayTotal = todayPayments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Sistema de Cobros</h1>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <DollarSign className="h-4 w-4" />
            <span>Total hoy: {formatCurrency(todayTotal)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <AlertCircle className="h-4 w-4" />
            <span>{unpaidPlayers.length} pagos pendientes</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Procesar Pago</h2>

            {/* Player Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Jugador
              </label>
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Seleccionar jugador --</option>
                {unpaidPlayers.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name} - Cancha {player.courtId} - {formatCurrency(player.totalGeneral)}
                  </option>
                ))}
              </select>
            </div>

            {/* Player Details */}
            {selectedPlayer && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{selectedPlayer.name}</h3>
                  <span className="text-sm text-gray-500">Cancha {selectedPlayer.courtId}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Campo:</span>
                    <span className="font-medium">{formatCurrency(selectedPlayer.totalField)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Bar:</span>
                    <span className="font-medium">{formatCurrency(selectedPlayer.totalBar)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="font-semibold">Total a Pagar:</span>
                    <span className="font-bold text-green-600 text-lg">
                      {formatCurrency(selectedPlayer.totalGeneral)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            {selectedPlayer && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Método de Pago
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setPaymentMethod('POS');
                        setShowChangeCalculator(false);
                      }}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        paymentMethod === 'POS'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <CreditCard className="h-6 w-6" />
                        <span className="font-medium">POS</span>
                      </div>
                      <p className="text-sm text-gray-600">Tarjeta de crédito/débito</p>
                    </button>

                    <button
                      onClick={() => {
                        setPaymentMethod('cash');
                        setShowChangeCalculator(true);
                      }}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        paymentMethod === 'cash'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <DollarSign className="h-6 w-6" />
                        <span className="font-medium">Efectivo</span>
                      </div>
                      <p className="text-sm text-gray-600">Pago en efectivo</p>
                    </button>
                  </div>
                </div>

                {/* Cash Calculator */}
                {paymentMethod === 'cash' && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Calculator className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Calculadora de Vuelto</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-yellow-800 mb-1">
                          Dinero Recibido
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          placeholder="Ingrese el monto recibido"
                          className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>

                      {cashReceived && (
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="p-3 bg-white rounded-lg">
                            <p className="text-xs text-gray-600">A Pagar</p>
                            <p className="font-bold text-red-600">
                              {formatCurrency(selectedPlayer.totalGeneral)}
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded-lg">
                            <p className="text-xs text-gray-600">Recibido</p>
                            <p className="font-bold text-blue-600">
                              {formatCurrency(parseFloat(cashReceived) || 0)}
                            </p>
                          </div>
                          <div className="p-3 bg-white rounded-lg">
                            <p className="text-xs text-gray-600">Vuelto</p>
                            <p className="font-bold text-green-600">
                              {formatCurrency(calculateChange())}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Process Payment Button */}
                <button
                  onClick={processPayment}
                  disabled={
                    !selectedPlayer || 
                    (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < selectedPlayer.totalGeneral))
                  }
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Check className="h-5 w-5" />
                  <span>Procesar Pago</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Pending Payments and Recent Activity */}
        <div className="space-y-6">
          {/* Pending Payments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Pagos Pendientes</h3>
            </div>
            <div className="p-4">
              {unpaidPlayers.length === 0 ? (
                <div className="text-center py-8">
                  <Check className="h-12 w-12 text-green-400 mx-auto mb-2" />
                  <p className="text-gray-500">No hay pagos pendientes</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {unpaidPlayers.map(player => (
                    <div
                      key={player.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        player.id === selectedPlayerId
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedPlayerId(player.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{player.name}</p>
                          <p className="text-xs text-gray-500">Cancha {player.courtId}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {formatCurrency(player.totalGeneral)}
                          </p>
                          <div className="flex items-center space-x-1 mt-1">
                            <AlertCircle className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-600">Pendiente</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Today's Payments Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Resumen del Día</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Pagos</p>
                  <p className="text-2xl font-bold text-gray-900">{todayPayments.length}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(todayTotal)}</p>
                </div>
              </div>

              {todayPayments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Últimos Pagos</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {todayPayments.slice(-3).reverse().map(payment => (
                      <div key={payment.id} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{payment.playerName}</span>
                          <span className="text-green-600 font-semibold">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>{payment.method === 'POS' ? 'Tarjeta' : 'Efectivo'}</span>
                          <span>{payment.timestamp.toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSystem;