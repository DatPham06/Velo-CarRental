import { addDays, dateKey } from './rental.js';

export const locations = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng'];
export const categories = ['Tất cả', 'SUV', 'Sedan', 'MPV'];

const today = dateKey();
const reservation = (from, to) => [{ pickup: addDays(today, from), dropoff: addDays(today, to) }];

export const fleet = [
  {
    id: 'corolla-cross',
    name: 'Toyota Corolla Cross',
    category: 'SUV',
    image: '/images/corolla-cross.jpg',
    price: 950_000,
    seats: 5,
    transmission: 'Tự động',
    fuel: 'Xăng',
    locations: [locations[0], locations[1]],
    unavailable: reservation(5, 8),
  },
  {
    id: 'mazda3',
    name: 'Mazda 3',
    category: 'Sedan',
    image: '/images/mazda3.jpg',
    price: 790_000,
    seats: 5,
    transmission: 'Tự động',
    fuel: 'Xăng',
    locations: [locations[0], locations[2]],
    unavailable: reservation(8, 11),
  },
  {
    id: 'carnival',
    name: 'Kia Carnival',
    category: 'MPV',
    image: '/images/carnival.jpg',
    price: 1_650_000,
    seats: 7,
    transmission: 'Tự động',
    fuel: 'Dầu',
    locations: [locations[1], locations[2]],
    unavailable: reservation(11, 15),
  },
];
