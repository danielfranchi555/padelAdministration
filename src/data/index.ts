import { Court, BarProduct } from '../types';

export const courts: Court[] = [
  { id: 1, name: 'Cancha 1 (Interior)', type: 'interior', price: 50 },
  { id: 2, name: 'Cancha 2 (Interior)', type: 'interior', price: 50 },
  { id: 3, name: 'Cancha 3 (Interior)', type: 'interior', price: 50 },
  { id: 4, name: 'Cancha 4 (Interior)', type: 'interior', price: 50 },
  { id: 5, name: 'Cancha 5 (Exterior)', type: 'exterior', price: 40 },
  { id: 6, name: 'Cancha 6 (Exterior)', type: 'exterior', price: 40 },
];

export const barProducts: BarProduct[] = [
  { name: 'Powerade', price: 2 },
  { name: 'Acqua', price: 1 },
  { name: 'Birra', price: 2.5 },
  { name: 'Patatine', price: 1.5 },
  { name: 'Barreta cereali', price: 1.5 },
  { name: 'RedBull', price: 2.5 },
  { name: 'Monster', price: 3 },
  { name: 'Magnesio', price: 2.5 },
  { name: 'Coca Cola', price: 2 },
  { name: 'Pepsi', price: 2 },
  { name: 'Té', price: 2 },
];

export const courtShareOptions = [
  { shares: 1, label: 'Paga todo' },
  { shares: 2, label: 'Paga por 2' },
  { shares: 3, label: 'Paga por 3' },
  { shares: 4, label: 'Individual' },
];

export const tubeShareOptions = [
  { shares: 1, label: 'Paga todo (6€)' },
  { shares: 2, label: 'Paga por 2 (3€)' },
  { shares: 3, label: 'Paga por 3 (4,5€)' },
  { shares: 4, label: 'Individual (1,5€)' },
];