const millisecondsPerDay = 24 * 60 * 60 * 1000;
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export function formatPrice(amount) {
  return currency.format(amount);
}

export function dateKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function addDays(value, days) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

export function rentalDays(pickup, dropoff) {
  const start = Date.parse(`${pickup}T00:00:00Z`);
  const end = Date.parse(`${dropoff}T00:00:00Z`);
  return (end - start) / millisecondsPerDay;
}

export function isCarAvailable(car, pickup, dropoff) {
  return !car.unavailable.some((range) => pickup < range.dropoff && dropoff > range.pickup);
}
