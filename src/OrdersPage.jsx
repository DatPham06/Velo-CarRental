import { useEffect, useState } from 'react';
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight,
  ClipboardList, ListFilter, RefreshCw, UserRound,
} from 'lucide-react';
import Brand from './Brand.jsx';
import CarImage from './CarImage.jsx';
import { AdminNav } from './AdminLayout.jsx';
import { requestApi } from './api.js';
import { formatPrice } from './rental.js';
import { useAccount, accountLabel } from './accountSession.js';
import './orders.css';

const labels = {
  PENDING: 'Đang chờ xác nhận', CONFIRMED: 'Đã xác nhận', RENTING: 'Đang thuê',
  RETURNED: 'Đã trả xe', CANCELLED: 'Đã hủy',
};
const actions = { CONFIRMED: 'Xác nhận đơn', RENTING: 'Giao xe', RETURNED: 'Nhận lại xe', CANCELLED: 'Hủy đơn' };
const steps = ['PENDING', 'CONFIRMED', 'RENTING', 'RETURNED'];
const shortDate = value => value ? value.split('-').reverse().join('/') : '—';

function OrderCard({ order, admin, busy, onUpdate }) {
  const [confirm, setConfirm] = useState('');
  const step = steps.indexOf(order.status);
  const firstCar = order.cars[0];
  const lateDays = order.lateDays;

  return (
    <article className="order-card" aria-labelledby={`order-${order.id}`}>
      <div className="order-card-heading">
        <h2 id={`order-${order.id}`}>Đơn #{order.id}</h2>
        <span className="order-status" data-status={order.status}>{labels[order.status] || order.status}</span>
      </div>
      {admin && <p className="order-customer"><UserRound size={15} aria-hidden="true" /><strong>{order.customerName}</strong> {order.customerEmail}</p>}
      <div className="order-overview">
        <div className="order-vehicle">
          {firstCar && <div className="order-photo"><CarImage car={firstCar} /></div>}
          <div><small>{order.cars.length} xe trong đơn</small><strong>{order.cars.map(car => car.productName).join(', ') || 'Chưa có xe'}</strong></div>
        </div>
        <div className="order-fact"><small><CalendarDays size={14} aria-hidden="true" /> Lịch thuê</small>
          <strong>{shortDate(order.startDate)} – {shortDate(order.expireDate)}</strong>
        </div>
        <div className="order-fact order-amount"><small>Tổng tiền đơn thuê</small><strong>{formatPrice(order.totalPrice)}</strong></div>
      </div>
      {!admin && step >= 0 && (
        <ol className="order-progress" aria-label="Tiến trình đơn thuê">
          {steps.map((status, index) => (
            <li key={status} data-done={index <= step} aria-current={index === step ? 'step' : undefined}>
              <span>{index <= step && <Check size={12} aria-hidden="true" />}</span>{labels[status]}
            </li>
          ))}
        </ol>
      )}
      <details className="order-details">
        <summary>Chi tiết đơn thuê</summary>
        <dl>
          {order.cars.map(car => <div key={car.id}><dt>{car.productName}</dt><dd>{formatPrice(car.rentalPricePerDay)} / ngày</dd></div>)}
          <div><dt>Tiền thuê theo lịch</dt><dd>{formatPrice(order.rentalSubtotal ?? order.totalPrice)}</dd></div>
          {order.deliveryMethod === 'DELIVERY' && <>
            <div><dt>Địa chỉ giao xe</dt><dd className="order-delivery-address">{order.deliveryAddress}</dd></div>
            <div><dt>Phí giao xe</dt><dd>{formatPrice(order.deliveryFee)}</dd></div>
          </>}
          {order.promotionCode && <div><dt>Giảm giá ({order.promotionCode})</dt><dd>{formatPrice(-Number(order.discountAmount))}</dd></div>}
          <div><dt>Phí trễ cho cả đơn</dt><dd>{formatPrice(order.lateFeePerDay)} / ngày trễ</dd></div>
          {order.status === 'RETURNED' && <div><dt>Ngày trả thực tế</dt><dd>{shortDate(order.returnDate)}</dd></div>}
          {lateDays != null && <div><dt>{order.status === 'RENTING' ? 'Phí trễ tạm tính' : 'Phí trả trễ'} ({lateDays} ngày)</dt><dd>{formatPrice(lateDays * order.lateFeePerDay)}</dd></div>}
        </dl>
      </details>
      {!admin && order.status !== 'CANCELLED' && (
        <a className="rental-text-button" href={`/payment/${order.id}`}>Xem thanh toán</a>
      )}
      {admin && order.allowedStatuses.length > 0 && (
        <div className="order-actions">
          {confirm ? (
            <>
              <p>{actions[confirm]} cho đơn #{order.id}?</p>
              <button className="button button-primary" disabled={busy} onClick={() => { setConfirm(''); onUpdate(order, confirm); }}>Đồng ý</button>
              <button className="button button-outline" disabled={busy} onClick={() => setConfirm('')}>Quay lại</button>
            </>
          ) : (
            <>
              {order.allowedStatuses.map(status => <button key={status}
                className={status === 'CANCELLED' ? 'order-cancel' : 'button button-primary'}
                disabled={busy} onClick={() => setConfirm(status)}>{actions[status]}</button>)}
              {order.status === 'CONFIRMED' && !order.allowedStatuses.includes('RENTING') && <small>Chỉ giao xe trong kỳ thuê đã đặt.</small>}
            </>
          )}
        </div>
      )}
    </article>
  );
}

export default function OrdersPage({ admin = false }) {
  const { account } = useAccount();
  const title = admin ? 'Quản lý đơn thuê' : 'Đơn thuê của tôi';
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const refresh = () => setRevision(value => value + 1);
  const accessDenied = error?.status === 401 || error?.status === 403;

  useEffect(() => {
    document.title = `${title} · Velo`;
    const controller = new AbortController();
    setData(null);
    setError(null);
    const params = new URLSearchParams({ status, page });
    requestApi(`/order/${admin ? 'manage' : 'mine'}?${params}`, { signal: controller.signal })
      .then(result => {
        if (controller.signal.aborted) return;
        const last = Math.max(0, result.totalPages - 1);
        if (page > last) setPage(last);
        else setData(result);
      })
      .catch(err => { if (!controller.signal.aborted) setError(err); });
    return () => controller.abort();
  }, [admin, title, page, status, revision]);

  async function update(order, newStatus) {
    setBusy(true);
    setNotice('');
    try {
      const params = new URLSearchParams({ newStatus, expectedStatus: order.status });
      await requestApi(`/order/${order.id}/updatestatus?${params}`, { method: 'POST' });
      setNotice(`Đơn #${order.id} · ${labels[newStatus]}.`);
    } catch (err) {
      setNotice(err.status === 409 ? 'Chưa thể cập nhật. Vui lòng kiểm tra trạng thái đơn và các xe đang được thuê.' : err.message);
    } finally {
      setBusy(false);
      refresh();
    }
  }

  return (
    <>
      <a className="skip-link" href="#orders-main">Đến nội dung chính</a>
      <header className="container header-content">
        <Brand href="/" />
        <nav className="rental-header-links" aria-label="Điều hướng tài khoản">
          <a href="/" className="account-back"><ArrowLeft size={16} aria-hidden="true" /> Trang chủ</a>
          <a href="/account" className="button button-outline" title={account ? accountLabel(account) : undefined}><UserRound size={16} aria-hidden="true" /><span className="account-link-name">{accountLabel(account)}</span></a>
        </nav>
      </header>
      <main className="container orders-page" id="orders-main">
        <header className="orders-heading">
          <div><h1>{title}</h1><p>{admin ? 'Xác nhận yêu cầu, bàn giao xe và ghi nhận xe đã trả.' : 'Theo dõi lịch nhận, trả xe và tiến trình từng đơn thuê.'}</p></div>
          {!admin && <a className="button button-primary" href="/#fleet">Thuê thêm xe <ArrowRight size={16} aria-hidden="true" /></a>}
        </header>
        {admin && <AdminNav active="orders" />}
        {!accessDenied && (
          <div className="orders-toolbar">
            <label><ListFilter size={17} aria-hidden="true" /><span className="orders-filter-label">Trạng thái</span>
              <select aria-label="Lọc theo trạng thái" value={status} disabled={busy} onChange={e => { setStatus(e.target.value); setPage(0); setNotice(''); }}>
                <option value="ALL">Tất cả trạng thái</option>
                {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <div>{data && <span>{data.totalOrders} đơn</span>}<button className="orders-refresh" disabled={busy} aria-label="Làm mới danh sách" title="Làm mới danh sách" onClick={() => { setNotice(''); refresh(); }}><RefreshCw size={17} /></button></div>
          </div>
        )}
        {notice && !accessDenied && <p className="order-notice" role="status">{notice}</p>}
        {error ? (
          <div className="orders-state">
            <ClipboardList size={30} aria-hidden="true" />
            <p role="alert">{error.status === 403 ? 'Chỉ quản trị viên mới có thể quản lý đơn thuê.' : error.message}</p>
            {error.status === 401 ? <a className="button button-primary" href={`/account?next=${admin ? '/admin/orders' : '/orders'}`}>Đăng nhập</a>
              : error.status === 403 ? <a className="button button-outline" href="/orders">Đơn thuê của tôi</a>
              : <button className="button button-outline" onClick={refresh}>Thử lại</button>}
          </div>
        ) : !data ? <p className="orders-state" role="status">Đang tải đơn thuê…</p> : data.orders.length === 0 ? (
          <div className="orders-state"><ClipboardList size={32} aria-hidden="true" />
            <p>{status !== 'ALL' ? 'Chưa có đơn ở trạng thái này.' : admin ? 'Chưa có yêu cầu thuê xe.' : 'Bạn chưa có đơn thuê xe.'}</p>
            {status !== 'ALL' ? <button className="button button-outline" onClick={() => { setStatus('ALL'); setPage(0); }}>Xem tất cả trạng thái</button>
              : !admin && <a className="button button-primary" href="/#fleet">Chọn xe trên trang chủ</a>}
          </div>
        ) : (
          <div className="orders-list">{data.orders.map(order => <OrderCard key={order.id} order={order} admin={admin} busy={busy} onUpdate={update} />)}</div>
        )}
        {data?.totalPages > 1 && (
          <nav className="orders-pager" aria-label="Phân trang đơn thuê">
            <button className="button button-outline" disabled={page === 0 || busy} onClick={() => setPage(page - 1)} aria-label="Trang trước"><ChevronLeft size={17} /></button>
            <span>Trang {page + 1} / {data.totalPages}</span>
            <button className="button button-outline" disabled={page + 1 >= data.totalPages || busy} onClick={() => setPage(page + 1)} aria-label="Trang sau"><ChevronRight size={17} /></button>
          </nav>
        )}
      </main>
    </>
  );
}
