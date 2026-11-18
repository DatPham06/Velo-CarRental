import { requestApi } from './api.js';

export async function getCars(signal) {
  const cars = await requestApi('/product/getall', { signal });
  if (!Array.isArray(cars)) throw new Error('Danh sách xe từ máy chủ không hợp lệ.');
  return cars;
}

export async function getRentalQuote(carId, startDate, expireDate, signal) {
  const parameters = new URLSearchParams({ carId, startDate, expireDate });
  const quote = await requestApi(`/order/quote?${parameters}`, { signal });
  if (!Number.isFinite(Number(quote.pricePerDay)) || !Number.isFinite(Number(quote.lateFeePerDay))
    || !Number.isSafeInteger(quote.rentalDays) || quote.rentalDays < 1) {
    throw new Error('Báo giá từ máy chủ không hợp lệ.');
  }
  return quote;
}

export async function getCartQuote(carIds, startDate, expireDate, signal) {
  const items = await Promise.all(carIds.map((id) => getRentalQuote(id, startDate, expireDate, signal)));
  if (!items.length) throw new Error('Vui lòng chọn xe từ trang chủ.');
  const policy = Number(items[0].lateFeePerDay);
  if (items.some((quote) => Number(quote.lateFeePerDay) !== policy)) {
    throw new Error('Phí trễ hạn giữa các xe chưa đồng nhất. Vui lòng tải lại báo giá.');
  }
  return {
    items,
    startDate,
    expireDate,
    rentalDays: items[0].rentalDays,
    pricePerDay: items.reduce((total, quote) => total + Number(quote.pricePerDay), 0),
    rentalSubtotal: items.reduce((total, quote) => total + Number(quote.rentalSubtotal), 0),
    lateFeePerDay: policy,
  };
}

export async function createRental(carIds, startDate, expireDate) {
  const order = await requestApi('/order/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startDate,
      expireDate,
      orderDetails: carIds.map((id) => ({ car: { id } })),
    }),
  });
  if (!order.id) throw new Error('Máy chủ chưa trả về mã đơn. Vui lòng kiểm tra với Velo trước khi gửi lại.');
  return order;
}
