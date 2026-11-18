import { addDays, dateKey } from './rental.js';

const key = 'velo.rentalCart';

export function readRentalCart() {
  let saved;
  try {
    saved = JSON.parse(sessionStorage.getItem(key));
  } catch {
    saved = null;
  }
  const parameters = new URLSearchParams(window.location.search);
  if (parameters.has('cars')) {
    saved = {
      carIds: parameters.get('cars').split(',').filter(Boolean).map(Number),
      startDate: parameters.get('startDate'),
      expireDate: parameters.get('expireDate'),
    };
  }
  return {
    carIds: [...new Set((Array.isArray(saved?.carIds) ? saved.carIds : []).filter((id) => Number.isSafeInteger(id) && id > 0))],
    startDate: /^\d{4}-\d{2}-\d{2}$/.test(saved?.startDate) ? saved.startDate : addDays(dateKey(), 1),
    expireDate: /^\d{4}-\d{2}-\d{2}$/.test(saved?.expireDate) ? saved.expireDate : addDays(dateKey(), 2),
  };
}

export function rememberRentalCart(cart) {
  try {
    sessionStorage.setItem(key, JSON.stringify(cart));
  } catch {
    // The checkout URL also carries the selection if browser storage is unavailable.
  }
  const parameters = new URLSearchParams(window.location.search);
  if (parameters.has('cars')) {
    parameters.set('cars', cart.carIds.join(','));
    parameters.set('startDate', cart.startDate);
    parameters.set('expireDate', cart.expireDate);
    window.history.replaceState(null, '', `${window.location.pathname}?${parameters}${window.location.hash}`);
  }
}

export function rentalHref(cart, path = '/rent') {
  const parameters = new URLSearchParams({
    cars: cart.carIds.join(','),
    startDate: cart.startDate,
    expireDate: cart.expireDate,
  });
  return `${path}?${parameters}`;
}
