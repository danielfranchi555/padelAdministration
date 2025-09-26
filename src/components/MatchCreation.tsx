import React, { useState, useMemo } from 'react';
import { Plus, Clock, Users, MapPin, AlertTriangle } from 'lucide-react';
import { Match, Court } from '../types';
import { courts } from '../data';
import { generateId, addMinutesToTime, validateMatchOverlap, createEmptyPlayer } from '../utils';

interface MatchCreationProps {
  matches: Match[];
  onCreateMatch: (match: Match) => void;
}

const MatchCreation: React.FC<MatchCreationProps> = ({ matches, onCreateMatch }) => {
  const [selectedCourt, setSelectedCourt] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [responsible, setResponsible] = useState<string>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const selectedCourtData = courts.find(court => court.id === selectedCourt)!;

  // Generate time slots (9:00 to 23:00 in 90-minute intervals)
  const availableTimeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 9; hour <= 23; hour += 1.5) {
      const wholeHour = Math.floor(hour);
      const minutes = (hour - wholeHour) * 60;
      if (wholeHour < 23 || (wholeHour === 23 && minutes === 0)) {
        const timeStr = `${wholeHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const endTimeStr = addMinutesToTime(timeStr, 90);
        
        const isBlocked = validateMatchOverlap(matches, selectedCourt, selectedDate, timeStr, 90);
        
        slots.push({
          time: timeStr,
          endTime: endTimeStr,
          isBlocked,
          label: `${timeStr} - ${endTimeStr}`
        });
      }
    }
    return slots;
  }, [matches, selectedCourt, selectedDate]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!responsible.trim()) {
      newErrors.responsible = 'El responsable es obligatorio';
    }

    if (validateMatchOverlap(matches, selectedCourt, selectedDate, selectedTime, 90)) {
      newErrors.time = 'Ya existe una partida en este horario para esta cancha';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const newMatch: Match = {
      id: generateId(),
      courtId: selectedCourt,
      responsible: responsible.trim(),
      date: selectedDate,
      time: selectedTime,
      duration: 90,
      players: [
        {
          ...createEmptyPlayer(selectedCourtData.type),
          name: responsible.trim(),
          fieldConsumption: {
            ...createEmptyPlayer(selectedCourtData.type).fieldConsumption,
            courtAmount: 0,
            tubeAmount: 0
          }
        },
        createEmptyPlayer(selectedCourtData.type),
        createEmptyPlayer(selectedCourtData.type),
        createEmptyPlayer(selectedCourtData.type)
      ],
      isCompleted: false
    };

    onCreateMatch(newMatch);
    setResponsible('');
    setErrors({});
  };

  const todayMatches = matches.filter(match => match.date === selectedDate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Crear Partida</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>Duración: 90 minutos</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            {/* Court Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Seleccionar Cancha
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {courts.map(court => (
                  <button
                    key={court.id}
                    type="button"
                    onClick={() => setSelectedCourt(court.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                      selectedCourt === court.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">Cancha {court.id}</span>
                    </div>
                    <p className="text-xs text-gray-600 capitalize">{court.type}</p>
                    <p className="text-sm font-semibold mt-1">€{court.price}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  id="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de inicio
                </label>
                <select
                  id="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.time ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  {availableTimeSlots.map(slot => (
                    <option 
                      key={slot.time} 
                      value={slot.time}
                      disabled={slot.isBlocked}
                    >
                      {slot.label} {slot.isBlocked ? '(Ocupado)' : ''}
                    </option>
                  ))}
                </select>
                {errors.time && (
                  <div className="mt-1 flex items-center space-x-1 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">{errors.time}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Responsible */}
            <div>
              <label htmlFor="responsible" className="block text-sm font-medium text-gray-700 mb-2">
                Responsable <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="responsible"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                placeholder="Nombre del responsable de la partida"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.responsible ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.responsible && (
                <div className="mt-1 flex items-center space-x-1 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{errors.responsible}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Crear Partida</span>
            </button>
          </form>
        </div>

        {/* Court Schedule */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                Cancha {selectedCourt} - {selectedDate}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                {selectedCourtData.type} • €{selectedCourtData.price}
              </p>
            </div>
            
            <div className="p-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableTimeSlots.map(slot => (
                  <div
                    key={slot.time}
                    className={`p-3 rounded-lg border ${
                      slot.isBlocked
                        ? 'border-red-200 bg-red-50'
                        : slot.time === selectedTime
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${
                        slot.isBlocked ? 'text-red-700' : 'text-gray-900'
                      }`}>
                        {slot.label}
                      </span>
                      {slot.isBlocked ? (
                        <span className="text-xs text-red-600 font-medium">OCUPADO</span>
                      ) : slot.time === selectedTime ? (
                        <span className="text-xs text-blue-600 font-medium">SELECCIONADO</span>
                      ) : (
                        <span className="text-xs text-green-600 font-medium">DISPONIBLE</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {todayMatches.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Partidas del día</span>
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {todayMatches
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map(match => (
                      <div key={match.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              Cancha {match.courtId}
                            </p>
                            <p className="text-sm text-gray-600">
                              {match.time} - {addMinutesToTime(match.time, 90)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">{match.responsible}</p>
                            <p className="text-xs text-gray-400">
                              {match.players.filter(p => p.name.trim()).length}/4 jugadores
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchCreation;