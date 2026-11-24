import { useEffect, useState } from 'react';
import { BarChart3, CarFront, ClipboardList, RefreshCw, Users, Wallet } from 'lucide-react';
import AdminLayout, { AdminError } from './AdminLayout.jsx';
import { requestApi } from './api.js';
import { formatPrice } from './rental.js';
import './statistics.css';

const currentYear = Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()));
const labels = { PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', RENTING: 'Đang thuê', RETURNED: 'Đã trả xe', CANCELLED: 'Đã hủy', OTHER: 'Khác' };
const integer = value => new Intl.NumberFormat('vi-VN').format(value);

function MonthlyChart({ months, year }) {
  const [metric, setMetric] = useState('orderValue');
  const [selected, setSelected] = useState(0);
  const maximum = Math.max(1, ...months.map(month => Number(month[metric])));
  const month = months[selected];
  return (
    <section className="stats-panel stats-monthly" aria-labelledby="stats-monthly-title">
      <div className="stats-panel-heading">
        <div><h2 id="stats-monthly-title">Hoạt động theo tháng</h2><p>Theo ngày nhận xe trong năm {year}.</p></div>
        <select aria-label="Chỉ số biểu đồ" value={metric} onChange={event => setMetric(event.target.value)}>
          <option value="orderValue">Giá trị đơn</option><option value="orders">Số đơn</option>
        </select>
      </div>
      <div className="stats-bars" role="group" aria-label={`Biểu đồ ${metric === 'orders' ? 'số đơn' : 'giá trị đơn'} 12 tháng`}>
        {months.map((item, index) => (
          <button key={item.month} type="button" className="stats-bar-button" aria-pressed={selected === index}
            aria-label={`Tháng ${item.month}: ${integer(item.orders)} đơn, giá trị ${formatPrice(item.orderValue)}`}
            title={`Tháng ${item.month}: ${integer(item.orders)} đơn · ${formatPrice(item.orderValue)}`}
            onClick={() => setSelected(index)}>
            <span className="stats-bar-track"><span className="stats-bar-fill" data-zero={Number(item[metric]) === 0}
              style={{ height: `${Number(item[metric]) / maximum * 100}%` }} /></span>
            <span className="stats-month-label">{item.month}</span>
          </button>
        ))}
      </div>
      <p className="stats-chart-axis">Tháng trong năm · Chọn một cột để xem chi tiết</p>
      <div className="stats-month-detail" role="status">
        <strong>Tháng {month.month}/{year}</strong><span>{integer(month.orders)} đơn thuê</span>
        <span>Giá trị đơn <b>{formatPrice(month.orderValue)}</b></span>
        <span>Đã xác nhận thanh toán <b>{formatPrice(month.paidValue)}</b></span>
      </div>
      <details className="stats-data-details"><summary>Xem bảng số liệu 12 tháng</summary>
        <div className="admin-table-wrap"><table className="admin-table stats-month-table">
          <caption className="admin-visually-hidden">Thống kê theo tháng năm {year}</caption>
          <thead><tr><th scope="col">Tháng</th><th scope="col">Số đơn</th><th scope="col">Giá trị đơn</th><th scope="col">Đã xác nhận thanh toán</th></tr></thead>
          <tbody>{months.map(item => <tr key={item.month}><th scope="row">{item.month}/{year}</th><td>{integer(item.orders)}</td>
            <td>{formatPrice(item.orderValue)}</td><td>{formatPrice(item.paidValue)}</td></tr>)}</tbody>
        </table></div>
      </details>
    </section>
  );
}

function Statistics() {
  const [year, setYear] = useState(currentYear);
  const [draftYear, setDraftYear] = useState(String(currentYear));
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision(value => value + 1);
  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    setData(null);
    requestApi(`/order/statistics?${new URLSearchParams({ year })}`, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(err => { if (!controller.signal.aborted) setError(err); });
    return () => controller.abort();
  }, [year, revision]);

  function applyYear(event) {
    event.preventDefault();
    const value = Number(draftYear);
    if (!Number.isInteger(value) || value < 2000 || value > 2100) return;
    setYear(value);
    refresh();
  }

  return (
    <>
      <div className="stats-toolbar">
        <form className="stats-year-form" onSubmit={applyYear}>
          <label htmlFor="stats-year">Năm thống kê</label>
          <input id="stats-year" type="number" min="2000" max="2100" step="1" required value={draftYear} onChange={event => setDraftYear(event.target.value)} />
          <button className="button button-primary" type="submit">Xem thống kê</button>
        </form>
        <button className="button button-outline" type="button" onClick={refresh}><RefreshCw size={16} aria-hidden="true" />Làm mới</button>
      </div>
      {error ? <AdminError error={error} retry={refresh} /> : !data ? <p className="admin-state" role="status">Đang tổng hợp số liệu…</p> : <>
        <p className="stats-updated">Cập nhật {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(data.generatedAt))}</p>
        <div className="stats-cards">
          {[
            [ClipboardList, 'Đơn thuê', integer(data.totals.orders), `Theo ngày nhận xe năm ${data.year}`],
            [Wallet, 'Giá trị đơn thuê', formatPrice(data.totals.orderValue), `Năm ${data.year} · Bỏ đơn đã hủy`],
            [CarFront, 'Xe trong hệ thống', integer(data.inventory.cars), `${integer(data.inventory.rentingCars)} xe đang được thuê · Hiện tại`],
            [Users, 'Tài khoản', integer(data.inventory.accounts), `${integer(data.inventory.bannedAccounts)} đã cấm · Toàn hệ thống`],
          ].map(([Icon, title, value, detail]) => <article className="stats-card" key={title}>
            <div className="stats-card-heading"><span>{title}</span><Icon size={20} aria-hidden="true" /></div>
            <strong>{value}</strong><small>{detail}</small>
          </article>)}
        </div>
        {!data.totals.orders && <p className="stats-empty-year" role="status"><BarChart3 size={20} aria-hidden="true" />Chưa có đơn nhận xe trong năm {data.year}. Số lượng xe và tài khoản vẫn hiển thị tổng hiện tại.</p>}
        <div className="stats-main-grid">
          <MonthlyChart key={data.year} months={data.months} year={data.year} />
          <section className="stats-panel" aria-labelledby="stats-status-title">
            <div className="stats-panel-heading"><div><h2 id="stats-status-title">Trạng thái đơn thuê</h2><p>Tất cả {integer(data.totals.orders)} đơn trong năm {data.year}.</p></div></div>
            <ul className="stats-status-list">{data.statuses.filter(item => item.status !== 'OTHER' || item.count > 0).map(item => <li key={item.status}>
              <div><span className="stats-status-name" data-status={item.status}>{labels[item.status] || item.status}</span><strong>{integer(item.count)}</strong></div>
              <span className="stats-status-track" aria-hidden="true"><span data-status={item.status} style={{ width: `${data.totals.orders ? item.count / data.totals.orders * 100 : 0}%` }} /></span>
            </li>)}</ul>
            <a className="stats-manage-link" href="/admin/orders">Quản lý đơn thuê →</a>
          </section>
        </div>
        <div className="stats-bottom-grid">
          <section className="stats-panel" aria-labelledby="stats-payment-title">
            <div className="stats-panel-heading"><div><h2 id="stats-payment-title">Xác nhận thanh toán</h2><p>Các đơn nhận xe trong năm {data.year}, bỏ đơn đã hủy.</p></div></div>
            <dl className="stats-payment-values">
              <div><dt>Giá trị đơn đã xác nhận thanh toán</dt><dd>{formatPrice(data.totals.paidValue)}</dd></div>
              <div><dt>Đơn có thanh toán đã xác nhận</dt><dd>{integer(data.totals.paidOrders)}</dd></div>
              <div><dt>Đơn chờ xác nhận thanh toán</dt><dd>{integer(data.totals.pendingPayments)}</dd></div>
            </dl>
            <p className="stats-explanation">Chỉ trạng thái thanh toán <strong>PAID</strong> được tính là đã xác nhận. Việc chọn tiền mặt hoặc chuyển khoản khi đặt xe vẫn ở trạng thái chờ.</p>
          </section>
          <section className="stats-panel" aria-labelledby="stats-top-title">
            <div className="stats-panel-heading"><div><h2 id="stats-top-title">Xe được đặt nhiều nhất</h2><p>Top 5 theo số đơn trong năm {data.year}, bỏ đơn đã hủy.</p></div></div>
            {data.topCars.length ? <ol className="stats-top-cars">{data.topCars.map((car, index) => <li key={car.id}>
              <span className="stats-rank">{index + 1}</span><div><strong>{car.productName}</strong><small>{car.brand || 'Chưa cập nhật hãng'}</small></div>
              <span className="stats-rental-count">{integer(car.rentals)} đơn</span>
            </li>)}</ol> : <p className="stats-no-cars">Chưa có lượt đặt xe trong năm này.</p>}
            <a className="stats-manage-link" href="/admin/cars">Quản lý xe →</a>
          </section>
        </div>
        <p className="stats-footnote">Giá trị đơn lấy theo tổng đã lưu khi đặt thuê, đã gồm phí giao xe và trừ khuyến mãi; chưa gồm phí trả trễ. Biểu đồ và phần thanh toán được nhóm theo ngày nhận xe, không phải ngày nhận tiền.</p>
      </>}
    </>
  );
}

export default function AdminStatisticsPage() {
  return <AdminLayout active="statistics" title="Thống kê" description="Theo dõi hoạt động thuê xe, tài khoản và tình hình thanh toán."><Statistics /></AdminLayout>;
}
