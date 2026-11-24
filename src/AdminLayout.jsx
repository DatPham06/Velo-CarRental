import { useEffect, useId, useRef } from 'react';
import { ArrowLeft, BarChart3, CarFront, ClipboardList, ShieldCheck, UserRound, Users } from 'lucide-react';
import Brand from './Brand.jsx';
import { useAccount, accountLabel } from './accountSession.js';
import './admin.css';

export function AdminNav({ active }) {
  return (
    <nav className="admin-nav" aria-label="Quản trị">
      {[
        ['statistics', '/admin/statistics', BarChart3, 'Thống kê'],
        ['orders', '/admin/orders', ClipboardList, 'Quản lý đơn thuê'],
        ['cars', '/admin/cars', CarFront, 'Quản lý xe'],
        ['accounts', '/admin/accounts', Users, 'Quản lý tài khoản'],
      ].map(([key, href, Icon, label]) => (
        <a key={key} href={href} aria-current={active === key ? 'page' : undefined}>
          <Icon size={17} aria-hidden="true" />{label}
        </a>
      ))}
    </nav>
  );
}

export function AdminError({ error, retry }) {
  return (
    <div className="admin-state">
      <ShieldCheck size={30} aria-hidden="true" />
      <p role="alert">{error.status === 403 ? 'Chỉ quản trị viên được sử dụng chức năng này.' : error.message}</p>
      {error.status === 401 ? <a className="button button-primary" href={`/account?next=${window.location.pathname}`}>Đăng nhập</a>
        : error.status === 403 ? <a className="button button-outline" href="/account">Về tài khoản</a>
          : <button className="button button-outline" onClick={retry}>Thử lại</button>}
    </div>
  );
}

export function ConfirmAction({ title, children, label, busy, onConfirm, onCancel, danger = true }) {
  const ref = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog className="admin-dialog" ref={ref} aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }}>
      <h2 id={titleId}>{title}</h2>
      <p id={descriptionId}>{children}</p>
      <div className="admin-dialog-actions">
        <button className="button button-outline" disabled={busy} onClick={onCancel} autoFocus>Quay lại</button>
        <button className={`button ${danger ? 'button-danger' : 'button-primary'}`} disabled={busy} onClick={onConfirm}>
          {busy ? 'Đang xử lý…' : label}
        </button>
      </div>
    </dialog>
  );
}

export default function AdminLayout({ active, title, description, children }) {
  const { account, loading, error, retry } = useAccount();
  useEffect(() => { document.title = `${title} · Velo`; }, [title]);
  return (
    <>
      <a className="skip-link" href="#admin-main">Đến nội dung chính</a>
      <header className="container header-content">
        <Brand href="/" />
        <a className="button button-outline" href="/account" title={account ? accountLabel(account) : undefined}><UserRound size={17} aria-hidden="true" /><span className="account-link-name">{accountLabel(account)}</span></a>
      </header>
      <main className="container admin-page" id="admin-main">
        <a className="admin-back" href="/account"><ArrowLeft size={16} aria-hidden="true" />Về tài khoản của tôi</a>
        <header className="admin-heading"><h1>{title}</h1><p>{description}</p></header>
        {loading ? <p className="admin-state" role="status">Đang kiểm tra quyền quản trị…</p>
          : error ? <AdminError error={{ message: error }} retry={retry} />
            : !account ? <AdminError error={{ status: 401, message: 'Đăng nhập bằng tài khoản quản trị để tiếp tục.' }} />
              : account.role !== 'ADMIN' ? <AdminError error={{ status: 403 }} />
                : <><AdminNav active={active} />{children}</>}
      </main>
    </>
  );
}
