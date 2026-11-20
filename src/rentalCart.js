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
      ...saved,
      carIds: parameters.get('cars').split(',').filter(Boolean).map(Number),
      startDate: parameters.get('startDate'),
      expireDate: parameters.get('expireDate'),
    };
  }
  return {
    carIds: [...new Set((Array.isArray(saved?.carIds) ? saved.carIds : []).filter((id) => Number.isSafeInteger(id) && id > 0))],
    startDate: /^\d{4}-\d{2}-\d{2}$/.test(saved?.startDate) ? saved.startDate : addDays(dateKey(), 1),
    expireDate: /^\d{4}-\d{2}-\d{2}$/.test(saved?.expireDate) ? saved.expireDate : addDays(dateKey(), 2),
    deliveryMethod: saved?.deliveryMethod === 'DELIVERY' ? 'DELIVERY' : 'PICKUP',
    deliveryAddress: saved?.deliveryMethod === 'DELIVERY' && typeof saved.deliveryAddress === 'string' ? saved.deliveryAddress : '',
    promotionCode: typeof saved?.promotionCode === 'string' ? saved.promotionCode : '',
  };
}

export function rememberRentalCart(cart) {
  try {
    const { carIds, startDate, expireDate } = cart;
    sessionStorage.setItem(key, JSON.stringify(carIds.length ? cart : { carIds, startDate, expireDate }));
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

export function clearRentalDeliveryAddress() {
  const cart = readRentalCart();
  if (cart.deliveryAddress) rememberRentalCart({ ...cart, deliveryAddress: '' });
}

export function rentalHref(cart, path = '/rent') {
  const parameters = new URLSearchParams({
    cars: cart.carIds.join(','),
    startDate: cart.startDate,
    expireDate: cart.expireDate,
  });
  return `${path}?${parameters}`;
}
