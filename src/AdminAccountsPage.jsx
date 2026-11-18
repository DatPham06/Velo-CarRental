import { useEffect, useState } from 'react';
import { Ban, RefreshCw, Search, ShieldCheck, Users } from 'lucide-react';
import AdminLayout, { AdminError, ConfirmAction } from './AdminLayout.jsx';
import { roleLabel } from './accountSession.js';
import { requestApi } from './api.js';

function AccountsManager() {
  const [accounts, setAccounts] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [revision, setRevision] = useState(0);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const refresh = () => setRevision(value => value + 1);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    requestApi('/account/getall', { signal: controller.signal }).then(setAccounts)
      .catch(err => { if (!controller.signal.aborted) { setError(err); setAccounts(null); } });
    return () => controller.abort();
  }, [revision]);

  async function changeBan() {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    const banned = !target.banned;
    try {
      await requestApi(`/account/${target.id}/ban?banned=${banned}`, { method: 'POST' });
      setNotice({ type: 'success', text: `${banned ? 'Đã cấm' : 'Đã bỏ cấm'} tài khoản ${target.email}.` });
      refresh();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
      if (err.status === 404) refresh();
    } finally { setTarget(null); setBusy(false); }
  }

  const filtered = (accounts || []).filter(account => `${account.fullName || ''} ${account.email || ''} ${account.phone || ''}`
    .toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')));

  return (
    <>
      <div className="admin-toolbar">
        <label className="admin-search"><Search size={18} aria-hidden="true" />
          <input aria-label="Tìm tài khoản" placeholder="Tìm tên, email hoặc số điện thoại…" value={query} onChange={event => setQuery(event.target.value)} />
        </label>
        <div className="admin-toolbar-actions">
          {accounts && <span>{accounts.length} tài khoản · {accounts.filter(account => account.banned).length} đã cấm</span>}
          <button className="admin-icon-button" disabled={busy} onClick={refresh} aria-label="Làm mới danh sách tài khoản"><RefreshCw size={17} /></button>
        </div>
      </div>
      {notice && <p className="admin-notice" data-type={notice.type} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.text}</p>}
      {error ? <AdminError error={error} retry={refresh} />
        : !accounts ? <p className="admin-state" role="status">Đang tải danh sách tài khoản…</p>
          : !filtered.length ? <div className="admin-state"><Users size={32} aria-hidden="true" /><p>Không có tài khoản khớp tìm kiếm.</p></div>
            : <div className="admin-table-wrap"><table className="admin-table admin-accounts-table">
              <caption className="admin-visually-hidden">Danh sách tài khoản</caption>
              <thead><tr><th scope="col">Họ và tên</th><th scope="col">Email</th><th scope="col">Số điện thoại</th><th scope="col">Vai trò</th><th scope="col">Trạng thái</th><th scope="col">Thao tác</th></tr></thead>
              <tbody>{filtered.map(account => <tr key={account.id}>
                <td><strong>{account.fullName || 'Chưa cập nhật'}</strong><small>Mã tài khoản #{account.id}</small></td>
                <td>{account.email}</td><td className="admin-phone">{account.phone || 'Chưa cập nhật'}</td>
                <td>{roleLabel(account.role)}</td>
                <td><span className="admin-badge" data-banned={account.banned ? 'true' : 'false'}>{account.banned ? 'Đã cấm' : 'Hoạt động'}</span></td>
                <td>{account.role === 'ADMIN' ? <span className="admin-protected"><ShieldCheck size={15} aria-hidden="true" />Quản trị viên</span>
                  : <button className={`admin-text-button${account.banned ? '' : ' danger'}`} disabled={busy} onClick={() => setTarget(account)}>
                    {account.banned ? <ShieldCheck size={15} aria-hidden="true" /> : <Ban size={15} aria-hidden="true" />}{account.banned ? 'Bỏ cấm' : 'Cấm tài khoản'}
                  </button>}</td>
              </tr>)}</tbody>
            </table></div>}
      {target && <ConfirmAction title={target.banned ? 'Bỏ cấm tài khoản?' : 'Cấm tài khoản?'} label={target.banned ? 'Bỏ cấm' : 'Cấm tài khoản'}
        danger={!target.banned} busy={busy} onConfirm={changeBan} onCancel={() => setTarget(null)}>
        {target.banned ? `${target.email} sẽ có thể đăng nhập và sử dụng tài khoản trở lại.`
          : `${target.email} sẽ không thể đăng nhập hoặc tiếp tục sử dụng phiên đăng nhập hiện tại.`}
      </ConfirmAction>}
    </>
  );
}

export default function AdminAccountsPage() {
  return <AdminLayout active="accounts" title="Quản lý tài khoản" description="Xem thông tin liên hệ, cấm hoặc bỏ cấm tài khoản người dùng."><AccountsManager /></AdminLayout>;
}
