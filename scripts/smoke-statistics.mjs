// Backend test can nap backend/velo/src/test/resources/statistics-fixture.sql.
// File nay chi goi API doc so lieu va tao/huy phien dang nhap.
import assert from 'node:assert/strict';

const base = process.env.VELO_TEST_BASE_URL;
if (!base) throw new Error('Dat VELO_TEST_BASE_URL tro den backend voi statistics-fixture.sql trong database test rieng.');
let checks = 0;
const cookies = [];
async function get(path, cookie) {
  const response = await fetch(`${base}${path}`, { headers: cookie ? { Cookie: cookie } : {}, signal: AbortSignal.timeout(10000) });
  return { status: response.status, headers: response.headers, data: await response.json() };
}
function equal(actual, expected, label) { assert.deepEqual(actual, expected, label); checks++; }
async function login(email, password) {
  const response = await fetch(`${base}/account/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  equal(response.status, 200, 'Login');
  await response.text();
  const cookie = response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
  cookies.push(cookie);
  return cookie;
}

try {
  equal((await get('/order/statistics?year=2026')).status, 401, 'Anonymous denied');
  const user = await login('user.demo@velo.test', 'User@123456');
  equal((await get('/order/statistics?year=2026', user)).status, 403, 'USER denied');
  const admin = await login('admin.demo@velo.test', 'Admin@123456');
  const response = await get('/order/statistics?year=2026', admin);
  equal(response.status, 200, 'ADMIN allowed');
  equal(response.headers.get('cache-control'), 'no-store', 'Private response not cached');
  const data = response.data;
  equal(data.year, 2026, 'Selected year');
  equal(data.inventory, { accounts: 3, bannedAccounts: 1, cars: 5, rentingCars: 2 }, 'Current inventory across all years');
  equal(data.totals, { orders: 8, orderValue: 10600000, paidValue: 7000000, paidOrders: 2, pendingPayments: 1 }, 'No duplicate money for multi-car orders; exclude cancellations and pending payments from paid value');
  equal(Object.fromEntries(data.statuses.map(item => [item.status, item.count])),
    { PENDING: 1, CONFIRMED: 1, RENTING: 1, RETURNED: 2, CANCELLED: 2, OTHER: 1 }, 'Legacy status aliases and unknown status');
  equal(data.months.length, 12, 'Always twelve months');
  equal(data.months[0], { month: 1, orders: 1, orderValue: 1000000, paidValue: 0 }, 'Stored total already includes delivery and discount');
  equal(data.months[1], { month: 2, orders: 2, orderValue: 5000000, paidValue: 3000000 }, 'February totals');
  equal(data.months[10], { month: 11, orders: 3, orderValue: 4500000, paidValue: 4000000 }, 'Cancelled paid order excluded');
  equal(data.months[11], { month: 12, orders: 1, orderValue: 0, paidValue: 0 }, 'Cancelled-only month');
  equal(data.months.reduce((sum, month) => sum + month.orderValue, 0), data.totals.orderValue, 'Monthly values reconcile');
  equal(data.months.reduce((sum, month) => sum + month.orders, 0), data.totals.orders, 'Monthly counts reconcile');
  equal(data.topCars.map(car => [car.id, car.rentals]), [[1, 3], [2, 3], [3, 1]], 'Top cars exclude cancellations and other years; deterministic ties');
  equal(/password|cccd|email|phone/i.test(JSON.stringify(data)), false, 'No personal account fields');
  const empty = (await get('/order/statistics?year=2000', admin)).data;
  equal(empty.totals, { orders: 0, orderValue: 0, paidValue: 0, paidOrders: 0, pendingPayments: 0 }, 'Empty-year zeros');
  equal(empty.months.length, 12, 'Empty-year complete chart');
  equal(empty.months.every(month => month.orders === 0 && month.orderValue === 0 && month.paidValue === 0), true, 'Empty-year months');
  equal(empty.topCars, [], 'Empty-year top cars');
  equal(empty.inventory, data.inventory, 'Inventory is not filtered by year');
  equal((await get('/order/statistics?year=2025', admin)).data.totals.orderValue, 700000, 'Year boundary');
  for (const year of ['1999', '2101', 'invalid']) equal((await get(`/order/statistics?year=${year}`, admin)).status, 400, `Reject year ${year}`);
  console.log(`PASS: ${checks} statistics checks: authorization, monetary totals, cancellations, monthly data, rankings, year boundaries and empty data.`);
} finally {
  for (const cookie of cookies) {
    const response = await fetch(`${base}/account/logout`, { method: 'POST', headers: { Cookie: cookie } });
    await response.text();
  }
}
