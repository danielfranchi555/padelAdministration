export interface Court {
  id: number;
  name: string;
  type: 'interior' | 'exterior';
  price: number;
}

export interface Player {
  id: string;
  name: string;
  isOwner: boolean;
  fieldConsumption: {
    courtShare: number;
    courtAmount: number;
    tubeShare: number;
    tubeAmount: number;
    overgrip: number;
  };
  barConsumption: BarItem[];
  totalField: number;
  totalBar: number;
  totalGeneral: number;
  isPaid: boolean;
  paymentMethod?: 'POS' | 'cash';
  pendingAmount?: number;
}

export interface Match {
  id: string;
  courtId: number;
  responsible: string;
  date: string;
  time: string;
  duration: number;
  players: Player[];
  isCompleted: boolean;
}

export interface BarItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface BarProduct {
  name: string;
  price: number;
}

export interface PaymentTransaction {
  id: string;
  playerId: string;
  playerName: string;
  amount: number;
  method: 'POS' | 'cash';
  cashReceived?: number;
  change?: number;
  timestamp: Date;
}