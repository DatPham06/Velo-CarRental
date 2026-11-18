import { useEffect, useRef, useState } from 'react';
import { CarFront, Pencil, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import AdminLayout, { AdminError, ConfirmAction } from './AdminLayout.jsx';
import CarImage from './CarImage.jsx';
import { requestApi } from './api.js';
import { formatPrice } from './rental.js';

const emptyCar = { productName: '', brand: '', pricePerDay: '', img: '' };

function CarsManager() {
  const [cars, setCars] = useState(null);
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyCar);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const nameRef = useRef(null);
  const refresh = () => setRevision(value => value + 1);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    requestApi('/product/getall', { signal: controller.signal })
      .then(setCars)
      .catch(err => { if (!controller.signal.aborted) { setError(err); setCars(null); } });
    return () => controller.abort();
  }, [revision]);

  useEffect(() => { if (showForm) nameRef.current?.focus(); }, [showForm, editingId]);

  function edit(car = null) {
    setNotice(null);
    setEditingId(car?.id ?? null);
    setForm(car ? { productName: car.productName, brand: car.brand || car.Brand || '',
      pricePerDay: String(car.pricePerDay ?? ''), img: car.img || car.IMG || '' } : { ...emptyCar });
    setShowForm(true);
  }

  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      await requestApi(editingId == null ? '/product/create' : `/product/${editingId}/update`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: form.productName.trim(), brand: form.brand.trim(),
          pricePerDay: Number(form.pricePerDay), img: form.img.trim() || null }),
      });
      setNotice({ type: 'success', text: editingId == null ? 'Đã thêm xe mới.' : 'Đã lưu thay đổi của xe.' });
      setShowForm(false);
      setQuery('');
      refresh();
    } catch (err) {
      setNotice({ type: 'error', text: err.status === 400 ? 'Kiểm tra tên xe, hãng, giá thuê và đường dẫn ảnh.' : err.message });
    } finally { setBusy(false); }
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      await requestApi(`/product/${deleting.id}/delete`, { method: 'POST' });
      if (editingId === deleting.id) setShowForm(false);
      setNotice({ type: 'success', text: `Đã xóa ${deleting.productName}.` });
      refresh();
    } catch (err) {
      setNotice({ type: 'error', text: err.status === 409 ? 'Xe đã có đơn thuê nên không thể xóa. Lịch sử đơn thuê được giữ nguyên.' : err.message });
      if (err.status === 404) refresh();
    } finally { setDeleting(null); setBusy(false); }
  }

  const filtered = (cars || []).filter(car => `${car.productName} ${car.brand || car.Brand || ''}`
    .toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi'))).sort((a, b) => b.id - a.id);
  const brands = [...new Set(['Toyota', 'Honda', 'Mazda', 'Hyundai', 'Kia', ...(cars || []).map(car => car.brand || car.Brand).filter(Boolean)])];

  return (
    <>
      <div className="admin-toolbar">
        <label className="admin-search"><Search size={18} aria-hidden="true" />
          <input aria-label="Tìm xe" placeholder="Tìm tên xe hoặc hãng…" value={query} onChange={event => setQuery(event.target.value)} />
        </label>
        <div className="admin-toolbar-actions">
          {cars && <span>{cars.length} xe</span>}
          <button className="admin-icon-button" disabled={busy} onClick={refresh} aria-label="Làm mới danh sách xe"><RefreshCw size={17} /></button>
          <button className="button button-primary" disabled={busy} onClick={() => edit()}><Plus size={17} aria-hidden="true" />Thêm xe</button>
        </div>
      </div>
      {notice && <p className="admin-notice" data-type={notice.type} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.text}</p>}
      <div className={`admin-car-layout${showForm ? ' has-editor' : ''}`}>
        <div className="admin-car-list">
          {error ? <AdminError error={error} retry={refresh} />
            : !cars ? <p className="admin-state" role="status">Đang tải danh sách xe…</p>
              : !filtered.length ? <div className="admin-state"><CarFront size={32} aria-hidden="true" /><p>{cars.length ? 'Không có xe khớp tìm kiếm.' : 'Chưa có xe. Thêm chiếc xe đầu tiên để bắt đầu.'}</p></div>
                : <div className="admin-table-wrap"><table className="admin-table">
                  <caption className="admin-visually-hidden">Danh sách xe</caption>
                  <thead><tr><th scope="col">Xe</th><th scope="col">Hãng</th><th scope="col">Giá thuê / ngày</th><th scope="col">Thao tác</th></tr></thead>
                  <tbody>{filtered.map(car => <tr key={car.id}>
                    <td><div className="admin-car-cell"><div className="admin-car-photo"><CarImage key={`${car.id}:${car.img || car.IMG}`} car={car} /></div><div><strong>{car.productName}</strong><small>Mã xe #{car.id}</small></div></div></td>
                    <td>{car.brand || car.Brand || 'Chưa cập nhật'}</td>
                    <td className="admin-price">{car.pricePerDay == null ? 'Chưa có giá' : formatPrice(car.pricePerDay)}</td>
                    <td><div className="admin-row-actions">
                      <button className="admin-text-button" disabled={busy} onClick={() => edit(car)} aria-label={`Sửa ${car.productName}`}><Pencil size={15} aria-hidden="true" />Sửa</button>
                      <button className="admin-text-button danger" disabled={busy} onClick={() => setDeleting(car)} aria-label={`Xóa ${car.productName}`}><Trash2 size={15} aria-hidden="true" />Xóa</button>
                    </div></td>
                  </tr>)}</tbody>
                </table></div>}
        </div>
        {showForm && <section className="admin-editor" aria-labelledby="car-form-heading">
          <div className="admin-editor-heading"><h2 id="car-form-heading">{editingId == null ? 'Thêm xe mới' : 'Chỉnh sửa xe'}</h2>
            <button className="admin-icon-button" disabled={busy} onClick={() => setShowForm(false)} aria-label="Đóng biểu mẫu"><X size={18} /></button>
          </div>
          <form onSubmit={save}><fieldset disabled={busy}>
            <label>Tên xe<input ref={nameRef} name="productName" value={form.productName} onChange={event => setForm({ ...form, productName: event.target.value })} maxLength={255} required /></label>
            <label>Hãng xe<input name="brand" list="car-brands" value={form.brand} onChange={event => setForm({ ...form, brand: event.target.value })} maxLength={255} required /></label>
            <datalist id="car-brands">{brands.map(brand => <option key={brand} value={brand} />)}</datalist>
            <label>Giá thuê mỗi ngày (VND)<input name="pricePerDay" type="number" min="0.01" step="0.01" value={form.pricePerDay} onChange={event => setForm({ ...form, pricePerDay: event.target.value })} required /></label>
            <label>Đường dẫn ảnh <small>(không bắt buộc)</small><input name="img" value={form.img} onChange={event => setForm({ ...form, img: event.target.value })} maxLength={255} placeholder="/images/ten-xe.jpg hoặc https://…" /></label>
            <div className="admin-form-actions"><button className="button button-primary" type="submit">{busy ? 'Đang lưu…' : 'Lưu xe'}</button>
              <button className="button button-outline" type="button" onClick={() => setShowForm(false)}>Hủy</button></div>
          </fieldset></form>
        </section>}
      </div>
      {deleting && <ConfirmAction title="Xóa xe?" label="Xóa xe" busy={busy} onConfirm={remove} onCancel={() => setDeleting(null)}>
        Xóa {deleting.productName} khỏi danh sách? Chỉ có thể xóa xe chưa có đơn thuê.
      </ConfirmAction>}
    </>
  );
}

export default function AdminCarsPage() {
  return <AdminLayout active="cars" title="Quản lý xe" description="Thêm xe mới, cập nhật thông tin và quản lý danh sách xe cho thuê."><CarsManager /></AdminLayout>;
}
