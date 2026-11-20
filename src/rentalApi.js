import { requestApi } from './api.js';

export async function getCars(signal) {
  const cars = await requestApi('/product/rentable', { signal });
  if (!Array.isArray(cars)) throw new Error('Danh sách xe từ máy chủ không hợp lệ.');
  return cars;
}

export async function getCartQuote({ carIds, startDate, expireDate, deliveryMethod, promotionCode }, signal) {
  const parameters = new URLSearchParams({ carIds: carIds.join(','), startDate, expireDate, deliveryMethod });
  if (promotionCode) parameters.set('promotionCode', promotionCode);
  const quote = await requestApi(`/order/cart-quote?${parameters}`, { signal });
  if (!Array.isArray(quote.items) || quote.items.length !== carIds.length
    || !Number.isFinite(Number(quote.totalPrice)) || !Number.isSafeInteger(quote.rentalDays) || quote.rentalDays < 1) {
    throw new Error('Báo giá từ máy chủ không hợp lệ.');
  }
  return quote;
}

export async function createRental({ carIds, startDate, expireDate, deliveryMethod, deliveryAddress, promotionCode }) {
  const order = await requestApi('/order/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startDate,
      expireDate,
      deliveryMethod,
      deliveryAddress,
      promotionCode,
      orderDetails: carIds.map((id) => ({ car: { id } })),
    }),
  });
  if (!order.id) throw new Error('Máy chủ chưa trả về mã đơn. Vui lòng kiểm tra với Velo trước khi gửi lại.');
  return order;
}
