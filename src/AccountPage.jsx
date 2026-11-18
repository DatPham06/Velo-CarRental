import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, CircleCheck, Eye, EyeOff, MapPin } from 'lucide-react';
import Brand from './Brand.jsx';
import { submitAccount } from './accountApi.js';
import { useAccount, roleLabel } from './accountSession.js';
import { requestApi } from './api.js';
import './account.css';

export default function AccountPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const { account, setAccount, loading, error: sessionError, retry } = useAccount();
  const next = new URLSearchParams(window.location.search).get('next');
  const headingRef = useRef(null);
  const isRegister = mode === 'register';
  const title = isRegister ? 'Tạo tài khoản' : 'Đăng nhập';

  useEffect(() => {
    document.title = `${title} · Velo`;
    if (account) headingRef.current?.focus();
  }, [account, title]);

  function switchMode(nextMode) {
    if (nextMode === mode) return;

    setMode(nextMode);
    setShowPassword(false);
    setFeedback(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    const fields = new FormData(event.currentTarget);
    const data = { email: fields.get('email').trim().toLowerCase(), password: fields.get('password') };
    if (isRegister) {
      data.fullName = fields.get('fullName').trim();
      const phone = fields.get('phone').trim();
      if (phone) data.phone = phone;
      if (!data.fullName) {
        setFeedback({ type: 'error', text: 'Vui lòng nhập họ và tên.' });
        return;
      }
      if (data.password !== fields.get('confirmPassword')) {
        setFeedback({ type: 'error', text: 'Hai mật khẩu chưa khớp.' });
        return;
      }
    }

    setBusy(true);
    setFeedback(null);
    try {
      const result = await submitAccount(mode, data);
      if (isRegister) {
        setEmail(result.email);
        switchMode('login');
        setFeedback({ type: 'success', text: 'Đã tạo tài khoản. Đăng nhập để tiếp tục.' });
      } else {
        setAccount(result);
        if (['/orders', '/admin/orders', '/rent'].includes(next) || /^\/payment\/[1-9]\d*$/.test(next)) {
          window.location.assign(next);
        }
      }
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setFeedback(null);
    try {
      await requestApi('/account/logout', { method: 'POST' });
      setAccount(null);
      setShowPassword(false);
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <a className="skip-link" href="#account-main">Đến nội dung chính</a>
      <header className="container header-content">
        <Brand href="/" />
        <a className="account-back" href="/"><ArrowLeft size={17} aria-hidden="true" /> Trang chủ</a>
      </header>

      <main className="container account-layout" id="account-main">
        <section className="account-panel" aria-labelledby="account-title">
          {loading ? <p role="status">Đang kiểm tra tài khoản…</p> : sessionError ? (
            <div><p role="alert">{sessionError}</p><button className="button button-outline" onClick={retry}>Thử lại</button></div>
          ) : account ? (
            <div className="account-confirmed">
              <div className="account-success-icon"><CircleCheck size={28} aria-hidden="true" /></div>
              <h1 id="account-title" ref={headingRef} tabIndex={-1}>Đăng nhập thành công</h1>
              <p>Chào {account.fullName || account.email}. Velo đã xác nhận thông tin tài khoản.</p>
              <p className="account-role">{roleLabel(account.role)}</p>
              <div className="account-success-actions">
                {account.role === 'ADMIN' && <a className="button button-primary" href="/admin/orders">Quản lý đơn thuê</a>}
                <a className="button button-outline" href="/orders">Đơn thuê của tôi</a>
                <a className="button button-primary" href="/rent">Thuê xe <ArrowRight size={17} aria-hidden="true" /></a>
                <button className="button button-outline" type="button" disabled={busy} onClick={logout}>Đăng xuất</button>
              </div>
              {feedback?.type === 'error' && <p role="alert">{feedback.text}</p>}
            </div>
          ) : (
            <>
              <div className="account-switch" role="group" aria-label="Thao tác tài khoản">
                <button type="button" aria-pressed={!isRegister} disabled={busy} onClick={() => switchMode('login')}>Đăng nhập</button>
                <button type="button" aria-pressed={isRegister} disabled={busy} onClick={() => switchMode('register')}>Đăng ký</button>
              </div>
              <div className="account-heading">
                <h1 id="account-title">{isRegister ? title : 'Đăng nhập Velo'}</h1>
                <p>{isRegister ? 'Điền thông tin bên dưới để tạo tài khoản Velo.' : 'Nhập email và mật khẩu tài khoản Velo.'}</p>
              </div>

              <form key={mode} className="account-form" onSubmit={handleSubmit} aria-labelledby="account-title">
                <fieldset disabled={busy}>
                  {isRegister && (
                    <label className="account-field">
                      Họ và tên
                      <input name="fullName" autoComplete="name" maxLength={255} placeholder="Nguyễn Văn An" required />
                    </label>
                  )}
                  <label className="account-field">
                    Email
                    <input
                      type="email" name="email" autoComplete="username" maxLength={255}
                      value={email} onChange={(event) => setEmail(event.target.value)}
                      placeholder="ban@example.com" required
                    />
                  </label>
                  {isRegister && (
                    <label className="account-field">
                      <span>Số điện thoại <small>(không bắt buộc)</small></span>
                      <input type="tel" name="phone" autoComplete="tel" maxLength={30} placeholder="090 000 0000" />
                    </label>
                  )}
                  <div className="account-field">
                    <label htmlFor="account-password">Mật khẩu</label>
                    <div className="account-password">
                      <input
                        id="account-password" name="password" type={showPassword ? 'text' : 'password'}
                        autoComplete={isRegister ? 'new-password' : 'current-password'}
                        minLength={isRegister ? 8 : undefined} maxLength={255} required
                        placeholder={isRegister ? 'Tối thiểu 8 ký tự' : 'Nhập mật khẩu'}
                      />
                      <button
                        type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                      </button>
                    </div>
                  </div>
                  {isRegister && (
                    <label className="account-field">
                      Nhập lại mật khẩu
                      <input
                        name="confirmPassword" type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password" minLength={8} maxLength={255}
                        placeholder="Nhập lại mật khẩu" required
                      />
                    </label>
                  )}

                  {feedback && (
                    <p className={`account-feedback account-feedback-${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
                      {feedback.text}
                    </p>
                  )}
                  <button className="button button-primary account-submit" type="submit">
                    {busy ? 'Đang gửi…' : title}
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                </fieldset>
              </form>
            </>
          )}
        </section>

        <aside className="account-visual" aria-label="Khám phá Velo">
          <img src="/images/mountain-drive.jpg" alt="Xe tự lái trên đường đèo miền Bắc" fetchPriority="high" />
          <div className="account-visual-footer">
            <span><MapPin size={16} aria-hidden="true" /> Đường đèo miền Bắc</span>
            <a href="/#fleet" aria-label="Khám phá đội xe"><ArrowUpRight size={20} aria-hidden="true" /></a>
          </div>
        </aside>
      </main>
    </>
  );
}
