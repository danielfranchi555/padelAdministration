import React, { useState } from 'react';
import { CreditCard, DollarSign, Check, AlertCircle, Calculator, Users, MapPin } from 'lucide-react';
import { Match, PaymentTransaction, Player } from '../types';
import { formatCurrency, generateId } from '../utils';

interface PaymentSystemProps {
  matches: Match[];
  payments: PaymentTransaction[];
  onAddPayment: (payment: PaymentTransaction) => void;
  onUpdateMatch: (match: Match) => void;
  selectedPlayerId?: string;
}

const PaymentSystem: React.FC<PaymentSystemProps> = ({ 
  matches, 
  payments, 
  onAddPayment, 
  onUpdateMatch,
  selectedPlayerId: initialSelectedPlayerId
}) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(initialSelectedPlayerId || '');
  const [paymentMethod, setPaymentMethod] = useState<'POS' | 'cash'>('POS');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'individual' | 'full'>('individual');
  const [partialAmount, setPartialAmount] = useState<string>('');

  // Get active matches with unpaid players
  const activeMatches = matches.filter(match => 
    !match.isCompleted && 
    match.players.some(p => p.name.trim() && p.totalGeneral > 0)
  );

  const selectedMatch = activeMatches.find(match => match.id === selectedMatchId);
  const selectedPlayer = selectedMatch?.players.find(player => player.id === selectedPlayerId);

  // Calculate match totals
  const getMatchTotals = (match: Match) => {
    const playersWithDebt = match.players.filter(p => p.name.trim() && p.totalGeneral > 0);
    const totalField = playersWithDebt.reduce((sum, p) => sum + p.totalField, 0);
    const totalBar = playersWithDebt.reduce((sum, p) => sum + p.totalBar, 0);
    const totalGeneral = totalField + totalBar;
    const totalPaid = playersWithDebt.filter(p => p.isPaid).reduce((sum, p) => sum + p.totalGeneral, 0);
    const totalPending = totalGeneral - totalPaid;
    
    return { totalField, totalBar, totalGeneral, totalPaid, totalPending, playersWithDebt };
  };

  const processIndividualPayment = () => {
    if (!selectedPlayer || !selectedMatch) return;

    const amount = partialAmount ? parseFloat(partialAmount) : selectedPlayer.totalGeneral;
    if (isNaN(amount) || amount <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    let transaction: PaymentTransaction;
    
    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived);
      if (isNaN(received) || received < amount) {
        alert('El monto recibido debe ser mayor o igual al monto a pagar');
        return;
      }
      
      transaction = {
        id: generateId(),
        playerId: selectedPlayer.id,
        playerName: selectedPlayer.name,
        amount: amount,
        method: 'cash',
        cashReceived: received,
        change: received - amount,
        timestamp: new Date()
      };
    } else {
      transaction = {
        id: generateId(),
        playerId: selectedPlayer.id,
        playerName: selectedPlayer.name,
        amount: amount,
        method: 'POS',
        timestamp: new Date()
      };
    }

    // Update player payment status
    const isFullPayment = amount >= selectedPlayer.totalGeneral;
    const updatedMatch = {
      ...selectedMatch,
      players: selectedMatch.players.map(player =>
        player.id === selectedPlayer.id ? { 
          ...player, 
          isPaid: isFullPayment, 
          paymentMethod,
          pendingAmount: isFullPayment ? 0 : selectedPlayer.totalGeneral - amount
        } : player
      )
    };
    onUpdateMatch(updatedMatch);
    onAddPayment(transaction);
    
    // Reset form
    setPartialAmount('');
    setCashReceived('');
  };

  const processFullMatchPayment = () => {
    if (!selectedMatch) return;

    const { totalPending, playersWithDebt } = getMatchTotals(selectedMatch);
    
    if (totalPending <= 0) {
      alert('No hay montos pendientes en esta partida');
      return;
    }

    let transaction: PaymentTransaction;
    
    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived);
      if (isNaN(received) || received < totalPending) {
        alert('El monto recibido debe ser mayor o igual al total pendiente');
        return;
      }
      
      transaction = {
        id: generateId(),
        playerId: 'full-match',
        playerName: `Pago completo - Cancha ${selectedMatch.courtId}`,
        amount: totalPending,
        method: 'cash',
        cashReceived: received,
        change: received - totalPending,
        timestamp: new Date()
      };
    } else {
      transaction = {
        id: generateId(),
        playerId: 'full-match',
        playerName: `Pago completo - Cancha ${selectedMatch.courtId}`,
        amount: totalPending,
        method: 'POS',
        timestamp: new Date()
      };
    }

    // Mark all players as paid
    const updatedMatch = {
      ...selectedMatch,
      players: selectedMatch.players.map(player =>
        playersWithDebt.some(p => p.id === player.id) ? 
          { ...player, isPaid: true, paymentMethod, pendingAmount: 0 } : 
          player
      )
    };
    onUpdateMatch(updatedMatch);
    onAddPayment(transaction);
    
    // Reset form
    setCashReceived('');
  };

  const calculateChange = () => {
    const amount = paymentMode === 'individual' 
      ? (partialAmount ? parseFloat(partialAmount) : selectedPlayer?.totalGeneral || 0)
      : (selectedMatch ? getMatchTotals(selectedMatch).totalPending : 0);
    
    if (!cashReceived) return 0;
    const received = parseFloat(cashReceived);
    if (isNaN(received)) return 0;
    return Math.max(0, received - amount);
  };

  const getTodayPayments = () => {
    const today = new Date().toDateString();
    return payments.filter(payment => payment.timestamp.toDateString() === today);
  };

  const todayPayments = getTodayPayments();
  const todayTotal = todayPayments.reduce((sum, payment) => sum + payment.amount, 0);

  // Get all unpaid players for the sidebar
  const unpaidPlayers: (Player & { matchId: string; courtId: number })[] = [];
  activeMatches.forEach(match => {
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

            {/* Match Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Cancha
              </label>
              <select
                value={selectedMatchId}
                onChange={(e) => {
                  setSelectedMatchId(e.target.value);
                  setSelectedPlayerId('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Seleccionar cancha --</option>
                {activeMatches.map(match => (
                  <option key={match.id} value={match.id}>
                    Cancha {match.courtId} - {match.time} - {match.responsible}
                  </option>
                ))}
              </select>
            </div>

            {/* Match Summary */}
            {selectedMatch && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Cancha {selectedMatch.courtId} - {selectedMatch.time}</span>
                  </h3>
                  <span className="text-sm text-gray-500">{selectedMatch.responsible}</span>
                </div>
                
                {(() => {
                  const totals = getMatchTotals(selectedMatch);
                  return (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Campo:</span>
                        <span className="font-medium">{formatCurrency(totals.totalField)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Bar:</span>
                        <span className="font-medium">{formatCurrency(totals.totalBar)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Pagado:</span>
                        <span className="font-medium text-green-600">{formatCurrency(totals.totalPaid)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-300">
                        <span className="font-semibold">Total Pendiente:</span>
                        <span className="font-bold text-red-600 text-lg">
                          {formatCurrency(totals.totalPending)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Payment Mode Selection */}
            {selectedMatch && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Pago
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMode('individual')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      paymentMode === 'individual'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Users className="h-6 w-6" />
                      <span className="font-medium">Individual</span>
                    </div>
                    <p className="text-sm text-gray-600">Pago por jugador</p>
                  </button>

                  <button
                    onClick={() => setPaymentMode('full')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      paymentMode === 'full'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Check className="h-6 w-6" />
                      <span className="font-medium">Completo</span>
                    </div>
                    <p className="text-sm text-gray-600">Pago total de la cancha</p>
                  </button>
                </div>
              </div>
            )}

            {/* Individual Player Selection */}
            {selectedMatch && paymentMode === 'individual' && (
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
                  {selectedMatch.players
                    .filter(player => player.name.trim() && player.totalGeneral > 0)
                    .map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name} - {formatCurrency(player.totalGeneral)} {player.isPaid ? '(Pagado)' : ''}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Individual Player Details */}
            {selectedPlayer && paymentMode === 'individual' && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{selectedPlayer.name}</h3>
                  {selectedPlayer.isPaid && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Pagado
                    </span>
                  )}
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
                  {selectedPlayer.pendingAmount && selectedPlayer.pendingAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pendiente Anterior:</span>
                      <span className="font-medium text-red-600">{formatCurrency(selectedPlayer.pendingAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="font-semibold">Total a Pagar:</span>
                    <span className="font-bold text-green-600 text-lg">
                      {formatCurrency(selectedPlayer.totalGeneral)}
                    </span>
                  </div>
                </div>
                
                {/* Partial Payment Option */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto a Pagar (opcional - dejar vacío para pago completo)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    placeholder={`Máximo: ${selectedPlayer.totalGeneral.toFixed(2)}`}
                    max={selectedPlayer.totalGeneral}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {partialAmount && parseFloat(partialAmount) < selectedPlayer.totalGeneral && (
                    <p className="text-sm text-orange-600 mt-1">
                      Quedará pendiente: {formatCurrency(selectedPlayer.totalGeneral - parseFloat(partialAmount))}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Payment Method */}
            {((selectedPlayer && paymentMode === 'individual') || (selectedMatch && paymentMode === 'full')) && (
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
                  onClick={paymentMode === 'individual' ? processIndividualPayment : processFullMatchPayment}
                  disabled={
                    (paymentMode === 'individual' && !selectedPlayer) ||
                    (paymentMode === 'full' && !selectedMatch) ||
                    (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < (
                      paymentMode === 'individual' 
                        ? (partialAmount ? parseFloat(partialAmount) : selectedPlayer?.totalGeneral || 0)
                        : (selectedMatch ? getMatchTotals(selectedMatch).totalPending : 0)
                    )))
                  }
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Check className="h-5 w-5" />
                  <span>
                    {paymentMode === 'individual' ? 'Procesar Pago Individual' : 'Procesar Pago Completo'}
                  </span>
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