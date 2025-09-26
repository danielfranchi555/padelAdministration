import { Match, Player, Court } from '../types';

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const calculateCourtShare = (courtPrice: number, shares: number): number => {
  return courtPrice / shares;
};

export const calculateTubeShare = (shares: number): number => {
  return 6 / shares;
};

export const calculateOwnerCourtPrice = (courtType: 'interior' | 'exterior'): number => {
  return 10; // Precio fijo para propietarios
};

export const formatCurrency = (amount: number): string => {
  return `€${amount.toFixed(2)}`;
};

export const formatTime = (time: string): string => {
  return time.split(':').slice(0, 2).join(':');
};

export const addMinutesToTime = (time: string, minutes: number): string => {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
};

export const isTimeOverlapping = (
  startTime1: string, 
  endTime1: string, 
  startTime2: string, 
  endTime2: string
): boolean => {
  const start1 = timeToMinutes(startTime1);
  const end1 = timeToMinutes(endTime1);
  const start2 = timeToMinutes(startTime2);
  const end2 = timeToMinutes(endTime2);

  return start1 < end2 && start2 < end1;
};

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const validateMatchOverlap = (
  matches: Match[],
  courtId: number,
  date: string,
  time: string,
  duration: number,
  excludeMatchId?: string
): boolean => {
  const endTime = addMinutesToTime(time, duration);
  
  return matches.some(match => {
    if (match.id === excludeMatchId) return false;
    if (match.courtId !== courtId || match.date !== date) return false;
    
    const matchEndTime = addMinutesToTime(match.time, match.duration);
    return isTimeOverlapping(time, endTime, match.time, matchEndTime);
  });
};

export const calculatePlayerTotals = (player: Player): Player => {
  const totalField = player.fieldConsumption.courtAmount + 
                    player.fieldConsumption.tubeAmount + 
                    player.fieldConsumption.overgrip;
  
  const totalBar = player.barConsumption.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0);
  
  return {
    ...player,
    totalField,
    totalBar,
    totalGeneral: totalField + totalBar
  };
};

export const createEmptyPlayer = (courtType?: 'interior' | 'exterior'): Player => ({
  id: generateId(),
  name: '',
  isOwner: false,
  fieldConsumption: {
    courtShare: 0,
    courtAmount: 0,
    tubeShare: 0,
    tubeAmount: 0,
    overgrip: 0,
  },
  barConsumption: [],
  totalField: 0,
  totalBar: 0,
  totalGeneral: 0,
  isPaid: false,
});