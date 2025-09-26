import React, { useState, useMemo } from 'react';
import { FileText, Download, Calendar, TrendingUp, Users, Euro, BarChart3 } from 'lucide-react';
import { Match, PaymentTransaction } from '../types';
import { formatCurrency, addMinutesToTime } from '../utils';

interface ReportsProps {
  matches: Match[];
  payments: PaymentTransaction[];
}

const Reports: React.FC<ReportsProps> = ({ matches, payments }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState<'daily' | 'match' | 'financial'>('daily');

  const filteredMatches = matches.filter(match => match.date === selectedDate);
  const filteredPayments = payments.filter(payment => 
    payment.timestamp.toDateString() === new Date(selectedDate).toDateString()
  );

  const dailyStats = useMemo(() => {
    const totalMatches = filteredMatches.length;
    const totalPlayers = filteredMatches.reduce((sum, match) => 
      sum + match.players.filter(p => p.name.trim()).length, 0);
    const totalRevenue = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalField = filteredMatches.reduce((sum, match) =>
      sum + match.players.reduce((playerSum, player) => playerSum + player.totalField, 0), 0);
    const totalBar = filteredMatches.reduce((sum, match) =>
      sum + match.players.reduce((playerSum, player) => playerSum + player.totalBar, 0), 0);
    const paidPlayers = filteredMatches.reduce((sum, match) =>
      sum + match.players.filter(p => p.isPaid).length, 0);
    const pendingPlayers = totalPlayers - paidPlayers;
    const pendingAmount = filteredMatches.reduce((sum, match) =>
      sum + match.players.filter(p => p.name.trim() && !p.isPaid).reduce((playerSum, player) => playerSum + player.totalGeneral, 0), 0);

    return {
      totalMatches,
      totalPlayers,
      totalRevenue,
      totalField,
      totalBar,
      paidPlayers,
      pendingPlayers,
      pendingAmount,
      paymentMethods: {
        POS: filteredPayments.filter(p => p.method === 'POS').length,
        cash: filteredPayments.filter(p => p.method === 'cash').length
      }
    };
  }, [filteredMatches, filteredPayments]);

  const generateCSV = () => {
    if (reportType === 'daily') {
      const headers = [
        'Cancha',
        'Hora',
        'Responsable',
        'Jugador',
        'Es_Socio',
        'Total_Campo',
        'Total_Bar',
        'Total_General',
        'Estado_Pago',
        'Metodo_Pago'
      ];

      const rows = filteredMatches.flatMap(match =>
        match.players
          .filter(player => player.name.trim())
          .map(player => [
            match.courtId,
            `${match.time}-${addMinutesToTime(match.time, match.duration)}`,
            match.responsible,
            player.name,
            player.isOwner ? 'Sí' : 'No',
            player.totalField.toFixed(2),
            player.totalBar.toFixed(2),
            player.totalGeneral.toFixed(2),
            player.isPaid ? 'Pagado' : 'Pendiente',
            player.paymentMethod || 'N/A'
          ])
      );

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_diario_${selectedDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Reportes y Cierre</h1>
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={generateCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex space-x-2">
        {[
          { type: 'daily', label: 'Resumen Diario', icon: Calendar },
          { type: 'match', label: 'Detalle de Partidas', icon: Users },
          { type: 'financial', label: 'Resumen Financiero', icon: Euro }
        ].map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => setReportType(type as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              reportType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Daily Summary */}
      {reportType === 'daily' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Partidas</p>
                  <p className="text-2xl font-bold text-gray-900">{dailyStats.totalMatches}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Jugadores</p>
                  <p className="text-2xl font-bold text-gray-900">{dailyStats.totalPlayers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Euro className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ingresos</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(dailyStats.totalRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{dailyStats.pendingPlayers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Desglose Financiero</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Campo:</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(dailyStats.totalField)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Bar:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(dailyStats.totalBar)}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-4">
                  <span className="text-gray-900 font-medium">Total Generado:</span>
                  <span className="font-bold text-purple-600">{formatCurrency(dailyStats.totalField + dailyStats.totalBar)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Cobrado:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(dailyStats.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Pendiente de Cobro:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(dailyStats.pendingAmount)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Métodos de Pago</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="text-gray-700">POS/Tarjeta</span>
                    </div>
                    <span className="font-semibold">{dailyStats.paymentMethods.POS} pagos</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-gray-700">Efectivo</span>
                    </div>
                    <span className="font-semibold">{dailyStats.paymentMethods.cash} pagos</span>
                  </div>
                </div>
                
                {filteredPayments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Últimas Transacciones</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {filteredPayments.slice(-5).reverse().map(payment => (
                        <div key={payment.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">{payment.playerName}</span>
                          <div className="text-right">
                            <span className="font-medium">{formatCurrency(payment.amount)}</span>
                            <span className="text-gray-500 text-xs ml-2">
                              {payment.method === 'POS' ? '💳' : '💵'}
                            </span>
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
      )}

      {/* Match Details */}
      {reportType === 'match' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Detalle de Partidas - {selectedDate}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cancha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jugadores</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMatches.map(match => (
                  <tr key={match.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Cancha {match.courtId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {match.time} - {addMinutesToTime(match.time, match.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {match.responsible}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="space-y-1">
                        {match.players.filter(p => p.name.trim()).map(player => (
                          <div key={player.id} className="flex items-center justify-between">
                            <span>{player.name}</span>
                            <span className={`px-2 py-1 text-xs rounded ${
                              player.isPaid 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {player.isPaid ? '✓' : '⏳'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(match.players.reduce((sum, p) => sum + p.totalGeneral, 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        match.isCompleted 
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {match.isCompleted ? 'Completada' : 'Activa'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Financial Summary */}
      {reportType === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Ingresos por Concepto</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-blue-800 font-medium">Canchas</p>
                      <p className="text-blue-600 text-sm">Alquiler de canchas y equipamiento</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(dailyStats.totalField)}</p>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-green-800 font-medium">Bar</p>
                      <p className="text-green-600 text-sm">Bebidas y snacks</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(dailyStats.totalBar)}</p>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <div>
                      <p className="text-purple-800 font-bold">Total Generado</p>
                      <p className="text-purple-600 text-sm">Ingresos totales del día</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-600">
                      {formatCurrency(dailyStats.totalField + dailyStats.totalBar)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Estado de Cobros</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-green-800 font-medium">Cobrado</p>
                      <p className="text-green-600 text-sm">{dailyStats.paidPlayers} jugadores</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(dailyStats.totalRevenue)}</p>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-red-800 font-medium">Pendiente</p>
                      <p className="text-red-600 text-sm">{dailyStats.pendingPlayers} jugadores</p>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(dailyStats.pendingAmount)}</p>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Tasa de Cobro:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {dailyStats.totalPlayers > 0 
                          ? Math.round((dailyStats.paidPlayers / dailyStats.totalPlayers) * 100)
                          : 0
                        }%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Flow Details */}
          {filteredPayments.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Flujo de Caja Detallado</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jugador</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efectivo Recibido</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vuelto</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.map(payment => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.timestamp.toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payment.playerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            payment.method === 'POS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {payment.method === 'POS' ? 'POS' : 'Efectivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.cashReceived ? formatCurrency(payment.cashReceived) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.change ? formatCurrency(payment.change) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;