import React from 'react';
import { Calendar, Clock, Users, Euro, TrendingUp, AlertCircle } from 'lucide-react';
import { Match, PaymentTransaction } from '../types';
import { formatCurrency } from '../utils';

interface DashboardProps {
  matches: Match[];
  payments: PaymentTransaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ matches, payments }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayMatches = matches.filter(match => match.date === today);
  
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalPlayers = todayMatches.reduce((sum, match) => 
    sum + match.players.filter(p => p.name.trim()).length, 0);
  
  const pendingPayments = todayMatches.reduce((sum, match) => 
    sum + match.players.filter(p => p.name.trim() && !p.isPaid).length, 0);

  const activeMatches = todayMatches.filter(match => !match.isCompleted);
  
  const upcomingMatch = activeMatches
    .sort((a, b) => a.time.localeCompare(b.time))
    .find(match => {
      const matchTime = new Date(`${match.date}T${match.time}`);
      return matchTime > new Date();
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Partidas Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{todayMatches.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Jugadores</p>
              <p className="text-2xl font-bold text-gray-900">{totalPlayers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Euro className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ingresos Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className={`h-8 w-8 ${pendingPayments > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pagos Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{pendingPayments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Matches and Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Partidas Activas</h2>
          </div>
          <div className="p-6">
            {activeMatches.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay partidas activas</p>
            ) : (
              <div className="space-y-4">
                {activeMatches.slice(0, 5).map(match => (
                  <div key={match.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Cancha {match.courtId}</p>
                      <p className="text-sm text-gray-500">{match.time} - {match.responsible}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-green-600">Activa</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Próxima Partida</h2>
          </div>
          <div className="p-6">
            {upcomingMatch ? (
              <div className="text-center">
                <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900">Cancha {upcomingMatch.courtId}</p>
                <p className="text-gray-600">{upcomingMatch.time}</p>
                <p className="text-sm text-gray-500 mt-2">Responsable: {upcomingMatch.responsible}</p>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Jugadores confirmados: {upcomingMatch.players.filter(p => p.name.trim()).length}/4
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay próximas partidas programadas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
        </div>
        <div className="p-6">
          {payments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay pagos registrados hoy</p>
          ) : (
            <div className="space-y-4">
              {payments.slice(-5).reverse().map(payment => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{payment.playerName}</p>
                    <p className="text-sm text-gray-500">
                      Pago {payment.method === 'POS' ? 'con tarjeta' : 'en efectivo'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-gray-500">
                      {payment.timestamp.toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;