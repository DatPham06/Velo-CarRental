// Chạy trên backend test riêng với hai tài khoản demo, không dùng database thật.
import assert from 'node:assert/strict';

const base = process.env.VELO_TEST_BASE_URL;
if (!base) throw new Error('Cần đặt VELO_TEST_BASE_URL trỏ tới backend với database test riêng.');
let checks = 0;

async function call(path, { cookie, body, method = 'GET', headers = {} } = {}) {
  const response = await fetch(`${base}${path}`, {
    method, headers: { 'X-Velo-Request': '1', ...(cookie && { Cookie: cookie }),
      ...(body && { 'Content-Type': 'application/json' }), ...headers },
    ...(body && { body: JSON.stringify(body) }), signal: AbortSignal.timeout(10000),
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null,
    cookie: response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ') };
}

function status(response, expected, label) {
  assert.equal(response.status, expected, `${label}: ${JSON.stringify(response.data)}`);
  checks++;
}

async function login(email, password) {
  const response = await call('/account/login', { method: 'POST', body: { email, password } });
  status(response, 200, `Login ${email}`);
  assert(response.cookie.includes('JSESSIONID='));
  assert(!Object.hasOwn(response.data, 'password'));
  return response;
}

const admin = await login('admin.demo@velo.test', 'Admin@123456');
const user = await login('user.demo@velo.test', 'User@123456');
const carData = { id: 99999, productName: 'Xe smoke test', brand: 'Toyota', pricePerDay: 700000, img: '/images/corolla-cross.jpg' };

status(await call('/account/getall'), 401, 'Anonymous cannot list accounts');
status(await call('/account/getall', { cookie: user.cookie }), 403, 'USER cannot list accounts');
for (const path of ['/product/create', '/product/99999/update', '/product/99999/delete', `/account/${user.data.id}/ban?banned=true`]) {
  status(await call(path, { method: 'POST', body: carData }), 401, `Anonymous denied ${path}`);
  status(await call(path, { method: 'POST', cookie: user.cookie, body: carData }), 403, `USER denied ${path}`);
}

const created = await call('/product/create', { method: 'POST', cookie: admin.cookie, body: carData });
status(created, 201, 'Admin creates car');
assert.notEqual(created.data.id, carData.id, 'Create must ignore supplied id');
assert.equal(created.data.img, carData.img);
assert.equal(created.data.brand, carData.brand);
assert.equal(created.data.status, 'AVAILABLE');
const carId = created.data.id;
const updated = await call(`/product/${carId}/update`, { method: 'POST', cookie: admin.cookie,
  body: { ...carData, id: 12345, productName: 'Xe smoke test da sua', pricePerDay: 800000, img: null } });
status(updated, 200, 'Admin updates car');
assert.equal(updated.data.id, carId, 'Update must retain path id');
assert.equal(updated.data.productName, 'Xe smoke test da sua');
assert.equal(Number(updated.data.pricePerDay), 800000);
assert.equal(updated.data.img, null);
status(await call('/product/create', { method: 'POST', cookie: admin.cookie, body: { ...carData, pricePerDay: -1 } }), 400, 'Reject negative price');
status(await call('/product/create', { method: 'POST', cookie: admin.cookie, body: { ...carData, brand: ' ' } }), 400, 'Reject blank brand');
status(await call('/product/create', { method: 'POST', cookie: admin.cookie, body: { ...carData, img: 'javascript:alert(1)' } }), 400, 'Reject invalid image');
status(await call('/product/99999/update', { method: 'POST', cookie: admin.cookie, body: carData }), 404, 'Missing car update');
status(await call('/product/create', { method: 'POST', cookie: admin.cookie, body: carData,
  headers: { Origin: 'https://example.invalid', 'X-Velo-Request': '' } }), 403, 'Browser form cannot create car without request header');
status(await call(`/product/${carId}/delete`, { method: 'POST', cookie: admin.cookie }), 204, 'Admin deletes unused car');
status(await call(`/product/getbyid/${carId}`), 404, 'Deleted car is absent');

const rentalCar = await call('/product/create', { method: 'POST', cookie: admin.cookie,
  body: { ...carData, productName: 'Xe co lich su thue' } });
status(rentalCar, 201, 'Create car for rental reference');
const order = await call('/order/create', { method: 'POST', cookie: user.cookie,
  body: { startDate: '2030-01-10T00:00:00.000Z', expireDate: '2030-01-12T00:00:00.000Z',
    orderDetails: [{ car: { id: rentalCar.data.id } }] } });
status(order, 200, 'Nested car id still supports rental creation');
status(await call(`/product/${rentalCar.data.id}/delete`, { method: 'POST', cookie: admin.cookie }), 409, 'Cannot delete rented car history');
status(await call(`/product/getbyid/${rentalCar.data.id}`), 200, 'Referenced car retained');

const accounts = await call('/account/getall', { cookie: admin.cookie });
status(accounts, 200, 'Admin lists account details');
const listedUser = accounts.data.find(account => account.id === user.data.id);
assert.equal(listedUser.email, 'user.demo@velo.test');
assert.equal(listedUser.phone, '0900000001');
assert.equal(listedUser.banned, false);
assert(accounts.data.every(account => !Object.hasOwn(account, 'password')));
status(await call(`/account/${admin.data.id}/ban?banned=true`, { method: 'POST', cookie: admin.cookie }), 403, 'Cannot ban administrator');
status(await call('/account/99999/ban?banned=true', { method: 'POST', cookie: admin.cookie }), 404, 'Missing account');
const banned = await call(`/account/${user.data.id}/ban?banned=true`, { method: 'POST', cookie: admin.cookie });
status(banned, 200, 'Admin bans user');
assert.equal(banned.data.banned, true);
status(await call('/account/me', { cookie: user.cookie }), 401, 'Ban invalidates existing session');
status(await call('/order/mine', { cookie: user.cookie }), 401, 'Banned session cannot access own orders');
status(await call('/account/login', { method: 'POST', body: { email: 'user.demo@velo.test', password: 'User@123456' } }), 403, 'Banned account cannot login');
status(await call(`/account/${user.data.id}/ban?banned=false`, { method: 'POST', cookie: admin.cookie }), 200, 'Admin unbans user');
await login('user.demo@velo.test', 'User@123456');

const forged = await call('/account/register', { method: 'POST', body: {
  fullName: 'Smoke Registration', email: `registration.${crypto.randomUUID()}@velo.test`, password: 'Registration@123', phone: '0900000099',
  cccd: `000${crypto.getRandomValues(new Uint32Array(1))[0].toString().slice(-9).padStart(9, '0')}`,
  role: 'ADMIN', banned: true, id: admin.data.id,
} });
status(forged, 201, 'Registration ignores managed fields');
assert.equal(forged.data.role, 'USER');
assert.equal(forged.data.banned, false);
assert(!Object.hasOwn(forged.data, 'cccd'));
assert.notEqual(forged.data.id, admin.data.id);
console.log(`PASS: ${checks} API checks, car CRUD, authorization, rental references, account ban/unban and session invalidation.`);
