import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Save, Calculator, ShoppingCart, CreditCard } from 'lucide-react';
import { Match, Player, BarItem } from '../types';
import { barProducts, courtShareOptions, tubeShareOptions } from '../data';
import { calculateCourtShare, calculateTubeShare, calculateOwnerCourtPrice, formatCurrency, calculatePlayerTotals, generateId } from '../utils';

interface PlayerManagementProps {
  matches: Match[];
  onUpdateMatch: (match: Match) => void;
  onNavigateToPayments?: (playerId: string) => void;
}

const PlayerManagement: React.FC<PlayerManagementProps> = ({ matches, onUpdateMatch, onNavigateToPayments }) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');

  const activeMatches = matches.filter(match => !match.isCompleted);
  const selectedMatch = matches.find(match => match.id === selectedMatchId);
  const selectedPlayer = selectedMatch?.players.find(player => player.id === selectedPlayerId);

  useEffect(() => {
    if (activeMatches.length > 0 && !selectedMatchId) {
      setSelectedMatchId(activeMatches[0].id);
    }
  }, [activeMatches.length, selectedMatchId]);

  useEffect(() => {
    if (selectedMatch && selectedMatch.players.length > 0 && !selectedPlayerId) {
      setSelectedPlayerId(selectedMatch.players[0].id);
    }
  }, [selectedMatch, selectedPlayerId]);

  const updatePlayer = (updatedPlayer: Player) => {
    if (!selectedMatch) return;

    const updatedMatch = {
      ...selectedMatch,
      players: selectedMatch.players.map(player =>
        player.id === updatedPlayer.id ? calculatePlayerTotals(updatedPlayer) : player
      )
    };

    onUpdateMatch(updatedMatch);
  };

  const updatePlayerName = (playerId: string, name: string) => {
    if (!selectedMatch) return;

    const updatedMatch = {
      ...selectedMatch,
      players: selectedMatch.players.map(player =>
        player.id === playerId ? { ...player, name } : player
      )
    };

    onUpdateMatch(updatedMatch);
  };

  const updatePlayerOwnerStatus = (playerId: string, isOwner: boolean) => {
    if (!selectedMatch || !selectedPlayer) return;

    const courtData = { id: selectedMatch.courtId, type: selectedMatch.courtId <= 4 ? 'interior' as const : 'exterior' as const };
    const courtPrice = isOwner ? calculateOwnerCourtPrice(courtData.type) : 
                      calculateCourtShare(courtData.type === 'interior' ? 50 : 40, selectedPlayer.fieldConsumption.courtShare);

    const updatedPlayer = {
      ...selectedPlayer,
      isOwner,
      fieldConsumption: {
        ...selectedPlayer.fieldConsumption,
        courtAmount: courtPrice
      }
    };

    updatePlayer(updatedPlayer);
  };

  const updateCourtShare = (shares: number) => {
    if (!selectedMatch || !selectedPlayer) return;

    const courtData = { id: selectedMatch.courtId, type: selectedMatch.courtId <= 4 ? 'interior' as const : 'exterior' as const };
    const courtPrice = selectedPlayer.isOwner ? calculateOwnerCourtPrice(courtData.type) : 
                      calculateCourtShare(courtData.type === 'interior' ? 50 : 40, shares);

    const updatedPlayer = {
      ...selectedPlayer,
      fieldConsumption: {
        ...selectedPlayer.fieldConsumption,
        courtShare: shares,
        courtAmount: courtPrice
      }
    };

    updatePlayer(updatedPlayer);
  };

  const updateTubeShare = (shares: number) => {
    if (!selectedPlayer) return;

    const tubePrice = calculateTubeShare(shares);

    const updatedPlayer = {
      ...selectedPlayer,
      fieldConsumption: {
        ...selectedPlayer.fieldConsumption,
        tubeShare: shares,
        tubeAmount: tubePrice
      }
    };

    updatePlayer(updatedPlayer);
  };

  const updateOvergrip = (amount: number) => {
    if (!selectedPlayer) return;

    const updatedPlayer = {
      ...selectedPlayer,
      fieldConsumption: {
        ...selectedPlayer.fieldConsumption,
        overgrip: amount
      }
    };

    updatePlayer(updatedPlayer);
  };

  const addBarItem = (productName: string) => {
    if (!selectedPlayer) return;

    const product = barProducts.find(p => p.name === productName);
    if (!product) return;

    const existingItem = selectedPlayer.barConsumption.find(item => item.name === productName);
    
    if (existingItem) {
      const updatedPlayer = {
        ...selectedPlayer,
        barConsumption: selectedPlayer.barConsumption.map(item =>
          item.name === productName ? { ...item, quantity: item.quantity + 1 } : item
        )
      };
      updatePlayer(updatedPlayer);
    } else {
      const newItem: BarItem = {
        id: generateId(),
        name: productName,
        price: product.price,
        quantity: 1
      };

      const updatedPlayer = {
        ...selectedPlayer,
        barConsumption: [...selectedPlayer.barConsumption, newItem]
      };
      updatePlayer(updatedPlayer);
    }
  };

  const updateBarItemQuantity = (itemId: string, quantity: number) => {
    if (!selectedPlayer) return;

    if (quantity <= 0) {
      const updatedPlayer = {
        ...selectedPlayer,
        barConsumption: selectedPlayer.barConsumption.filter(item => item.id !== itemId)
      };
      updatePlayer(updatedPlayer);
    } else {
      const updatedPlayer = {
        ...selectedPlayer,
        barConsumption: selectedPlayer.barConsumption.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      };
      updatePlayer(updatedPlayer);
    }
  };

  if (activeMatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Users className="h-16 w-16 mb-4" />
        <p className="text-lg">No hay partidas activas</p>
        <p className="text-sm">Crea una partida primero para gestionar jugadores</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Jugadores</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Users className="h-4 w-4" />
          <span>{activeMatches.length} partidas activas</span>
        </div>
      </div>

      {/* Match and Player Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Partida</label>
          <select
            value={selectedMatchId}
            onChange={(e) => {
              setSelectedMatchId(e.target.value);
              setSelectedPlayerId('');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {activeMatches.map(match => (
              <option key={match.id} value={match.id}>
                Cancha {match.courtId} - {match.time} - {match.responsible}
              </option>
            ))}
          </select>
        </div>

        {selectedMatch && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Jugador</label>
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {selectedMatch.players.map((player, index) => (
                <option key={player.id} value={player.id}>
                  Jugador {index + 1}: {player.name || 'Sin nombre'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedMatch && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Jugadores de la Partida</h3>
            </div>
            <div className="p-4 space-y-3">
              {selectedMatch.players.map((player, index) => (
                <div
                  key={player.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    player.id === selectedPlayerId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPlayerId(player.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">Jugador {index + 1}</span>
                    {player.isOwner && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Socio
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayerName(player.id, e.target.value)}
                    placeholder="Nombre del jugador"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  {player.name.trim() && (
                    <div className="mt-2 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Campo: {formatCurrency(player.totalField)}</span>
                        <span>Bar: {formatCurrency(player.totalBar)}</span>
                      </div>
                      <div className="font-medium text-gray-900 text-right mt-1">
                        Total: {formatCurrency(player.totalGeneral)}
                      </div>
                      {player.isPaid && (
                        <div className="text-green-600 font-medium text-right">
                          ✓ Pagado
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Player Details */}
          {selectedPlayer && selectedPlayer.name.trim() && (
            <div className="lg:col-span-2 space-y-6">
              {/* Field Consumption */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Consumos de Campo</h3>
                  <Calculator className="h-5 w-5 text-gray-400" />
                </div>
                <div className="p-4 space-y-4">
                  {/* Owner Status */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Es Socio/Propietario</label>
                    <button
                      onClick={() => updatePlayerOwnerStatus(selectedPlayer.id, !selectedPlayer.isOwner)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedPlayer.isOwner
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {selectedPlayer.isOwner ? 'Sí' : 'No'}
                    </button>
                  </div>

                  {/* Court Payment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pago de Cancha {selectedPlayer.isOwner && '(Tarifa Socio: €10)'}
                    </label>
                    {!selectedPlayer.isOwner && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {courtShareOptions.map(option => (
                          <button
                            key={option.shares}
                            onClick={() => updateCourtShare(option.shares)}
                            className={`p-2 text-sm rounded-lg border transition-colors ${
                              selectedPlayer.fieldConsumption.courtShare === option.shares
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Monto a pagar:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(selectedPlayer.fieldConsumption.courtAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Tube Payment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tubo de Pelotas</label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {tubeShareOptions.map(option => (
                        <button
                          key={option.shares}
                          onClick={() => updateTubeShare(option.shares)}
                          className={`p-2 text-sm rounded-lg border transition-colors ${
                            selectedPlayer.fieldConsumption.tubeShare === option.shares
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Monto a pagar:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(selectedPlayer.fieldConsumption.tubeAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Overgrip */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Overgrip (€2.50)</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateOvergrip(0)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          selectedPlayer.fieldConsumption.overgrip === 0
                            ? 'bg-gray-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        No
                      </button>
                      <button
                        onClick={() => updateOvergrip(2.5)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          selectedPlayer.fieldConsumption.overgrip === 2.5
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Sí (€2.50)
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>Total Campo:</span>
                      <span className="text-blue-600">{formatCurrency(selectedPlayer.totalField)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bar Consumption */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Consumos del Bar</h3>
                  <ShoppingCart className="h-5 w-5 text-gray-400" />
                </div>
                <div className="p-4 space-y-4">
                  {/* Add Product */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Agregar Producto</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {barProducts.map(product => (
                        <button
                          key={product.name}
                          onClick={() => addBarItem(product.name)}
                          className="p-2 text-sm border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-gray-500">{formatCurrency(product.price)}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Current Items */}
                  {selectedPlayer.barConsumption.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Productos Consumidos</h4>
                      <div className="space-y-2">
                        {selectedPlayer.barConsumption.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-500 text-sm ml-2">
                                {formatCurrency(item.price)} c/u
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateBarItemQuantity(item.id, item.quantity - 1)}
                                className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateBarItemQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                              >
                                +
                              </button>
                              <button
                                onClick={() => updateBarItemQuantity(item.id, 0)}
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <span className="w-16 text-right font-semibold text-green-600">
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>Total Bar:</span>
                      <span className="text-green-600">{formatCurrency(selectedPlayer.totalBar)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-gray-200 rounded-xl p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-lg">
                    <span className="text-gray-700">Total Campo:</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(selectedPlayer.totalField)}</span>
                  </div>
                  <div className="flex items-center justify-between text-lg">
                    <span className="text-gray-700">Total Bar:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(selectedPlayer.totalBar)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex items-center justify-between text-xl font-bold">
                      <span className="text-gray-900">TOTAL GENERAL:</span>
                      <span className="text-purple-600">{formatCurrency(selectedPlayer.totalGeneral)}</span>
                    </div>
                  </div>
                  {selectedPlayer.isPaid && (
                    <div className="text-center text-green-600 font-medium">
                      ✓ PAGADO
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Button */}
              {selectedPlayer.name.trim() && selectedPlayer.totalGeneral > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <button
                    onClick={() => onNavigateToPayments?.(selectedPlayer.id)}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Ir a Cobros</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerManagement;