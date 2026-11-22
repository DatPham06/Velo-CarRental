import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Banknote, CalendarDays, CheckCircle2, Clock3, Landmark, Truck } from 'lucide-react';
import Brand from './Brand.jsx';
import CarImage from './CarImage.jsx';
import { requestApi } from './api.js';
import { formatPrice } from './rental.js';
import RentalCostBreakdown from './RentalCostBreakdown.jsx';
import './payment.css';

const methods = [
  { value: 'CASH', label: 'Tiền mặt', icon: Banknote, description: 'Thanh toán khi nhận xe.' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng', icon: Landmark, description: 'Chuyển tiền theo mã đơn thuê.' },
];
const paymentStatuses = { PENDING: 'Đang chờ xác nhận', PAID: 'Đã thanh toán', FAILED: 'Thanh toán thất bại', CANCELLED: 'Đã hủy' };
const displayDate = value => value.split('-').reverse().join('/');

function PaymentSummary({ order }) {
  return (
    <aside className="rental-panel payment-summary" aria-label="Chi tiết đơn thuê">
      <h2>Đơn thuê #{order.id}</h2>
      <p className="payment-dates"><CalendarDays size={17} aria-hidden="true" />{displayDate(order.startDate)} – {displayDate(order.expireDate)}</p>
      <ul className="payment-cars">
        {order.cars.map(car => <li key={car.id}>
          <div className="payment-car-photo"><CarImage car={car} /></div>
          <div><strong>{car.productName}</strong><small>{formatPrice(car.rentalPricePerDay)} / ngày</small></div>
        </li>)}
      </ul>
      {order.deliveryMethod === 'DELIVERY' && (
        <div className="payment-delivery">
          <Truck size={17} aria-hidden="true" />
          <div><strong>Giao tận nơi</strong><p>{order.deliveryAddress}</p></div>
        </div>
      )}
      <RentalCostBreakdown pricing={order} />
      <p className="payment-fine-print">Phí trả trễ tính riêng, {formatPrice(order.lateFeePerDay)} / ngày cho cả đơn.</p>
    </aside>
  );
}

function TransferInstructions({ order, bank }) {
  if (!bank) return <p className="payment-note">Velo chưa công bố tài khoản nhận tiền. Vui lòng liên hệ Velo trước khi chuyển khoản.</p>;
  return (
    <section className="payment-transfer" aria-label="Thông tin chuyển khoản">
      <h3>Thông tin chuyển khoản</h3>
      <dl>
        <div><dt>Ngân hàng</dt><dd>{bank.name}</dd></div>
        <div><dt>Chủ tài khoản</dt><dd>{bank.holder}</dd></div>
        <div><dt>Số tài khoản</dt><dd>{bank.number}</dd></div>
        <div><dt>Số tiền chuyển khoản</dt><dd>{formatPrice(order.totalPrice)}</dd></div>
        <div><dt>Nội dung chuyển khoản</dt><dd>VELO-{order.id}</dd></div>
      </dl>
    </section>
  );
}

export default function PaymentPage({ orderId }) {
  const [checkout, setCheckout] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [revision, setRevision] = useState(0);
  const [method, setMethod] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const submitting = useRef(false);
  const path = `/order/${orderId}`;
  const loginHref = `/account?next=/payment/${orderId}`;

  useEffect(() => {
    document.title = `Thanh toán đơn #${orderId} · Velo`;
    const controller = new AbortController();
    setLoadError(null);
    setCheckout(null);
    requestApi(`${path}/checkout`, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setCheckout(result); })
      .catch(error => { if (!controller.signal.aborted) setLoadError(error); });
    return () => controller.abort();
  }, [orderId, path, revision]);

  async function saveMethod(event) {
    event.preventDefault();
    if (!method || submitting.current || checkout.payment) return;
    submitting.current = true;
    setBusy(true);
    setSaveError('');
    try {
      const payment = await requestApi(`${path}/payment?${new URLSearchParams({ paymentMethod: method })}`, { method: 'POST' });
      setCheckout(current => ({ ...current, payment }));
    } catch (error) {
      // A concurrent tab or a lost response may have already saved the choice.
      setSaveError(error.status === 409 ? 'Đơn vừa thay đổi. Vui lòng kiểm tra lại thông tin.' : error.message);
      setRevision(value => value + 1);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const order = checkout?.order;
  const payment = checkout?.payment;
  const savedMethod = payment?.paymentMethod?.toUpperCase();
  const status = payment?.status?.toUpperCase();
  return (
    <>
      <a className="skip-link" href="#payment-main">Đến nội dung chính</a>
      <header className="container header-content">
        <Brand href="/" />
        <a className="account-back" href="/orders"><ArrowLeft size={16} aria-hidden="true" /> Đơn thuê của tôi</a>
      </header>
      <main className="container payment-page" id="payment-main">
        <h1>Thanh toán đơn thuê</h1>
        {loadError ? (
          <div className="rental-panel payment-state">
            <p role="alert">{loadError.status === 404 ? 'Không tìm thấy đơn thuê trong tài khoản này.' : loadError.message}</p>
            {loadError.status === 401 ? <a className="button button-primary" href={loginHref}>Đăng nhập</a>
              : loadError.status === 404 || loadError.status === 403 ? <a className="button button-outline" href="/orders">Xem đơn thuê của tôi</a>
              : <button className="button button-outline" onClick={() => setRevision(value => value + 1)}>Thử lại</button>}
          </div>
        ) : !order ? <p role="status">Đang tải thông tin thanh toán…</p> : (
          <div className="payment-layout">
            <section className="rental-panel payment-panel">
              {order.status === 'CANCELLED' ? <><h2>Đơn thuê đã hủy</h2><p>Đơn #{order.id} đã ngừng nhận thanh toán.</p></>
                : payment ? (
                  <>
                    <div className="payment-saved" role="status">
                      <h2>
                        {status === 'PENDING' && <Clock3 size={22} aria-hidden="true" />}
                        {status === 'PAID' && <CheckCircle2 size={22} aria-hidden="true" />}
                        {paymentStatuses[status] || payment.status}
                      </h2>
                      <p>Phương thức thanh toán <strong>{methods.find(item => item.value === savedMethod)?.label || payment.paymentMethod}</strong></p>
                    </div>
                    {status === 'PENDING' && savedMethod === 'CASH' && <p className="payment-note">Thanh toán {formatPrice(order.totalPrice)} bằng tiền mặt cho nhân viên Velo khi nhận xe.</p>}
                    {status === 'PENDING' && savedMethod === 'BANK_TRANSFER' && <TransferInstructions order={order} bank={checkout.bank} />}
                  </>
                ) : (
                  <form onSubmit={saveMethod}>
                    <fieldset disabled={busy}>
                      <legend>Phương thức thanh toán</legend>
                      {methods.map(({ value, label, icon: Icon, description }) => (
                        <label className="payment-option" data-selected={method === value} key={value}>
                          <Icon size={23} aria-hidden="true" />
                          <span><strong>{label}</strong><small>{description}</small></span>
                          <input type="radio" name="paymentMethod" value={value} checked={method === value}
                            required onChange={() => { setMethod(value); setSaveError(''); }} />
                        </label>
                      ))}
                    </fieldset>
                    {method === 'BANK_TRANSFER' && checkout.bank && (
                      <p className="payment-note">Xác nhận để xem tài khoản nhận và nội dung chuyển khoản của đơn này.</p>
                    )}
                    {saveError && <p className="rental-error" role="alert">{saveError}</p>}
                    <button className="button button-primary payment-submit" type="submit" disabled={!method || busy}>
                      {busy ? 'Đang ghi nhận…' : 'Thanh toán'} <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  </form>
                )}
              {(payment || order.status === 'CANCELLED') && <a className="button button-primary payment-submit" href="/orders">Theo dõi đơn thuê <ArrowRight size={16} aria-hidden="true" /></a>}
            </section>
            <PaymentSummary order={order} />
          </div>
        )}
      </main>
    </>
  );
}
