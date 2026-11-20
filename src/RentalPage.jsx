import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, CalendarDays, Clock3, RefreshCw, Tag, Truck, UserRound,
} from 'lucide-react';
import Brand from './Brand.jsx';
import { useAccount, roleLabel, accountLabel } from './accountSession.js';
import { createRental, getCars, getCartQuote } from './rentalApi.js';
import CarImage from './CarImage.jsx';
import RentalCostBreakdown from './RentalCostBreakdown.jsx';
import { readRentalCart, rememberRentalCart, rentalHref } from './rentalCart.js';
import { addDays, dateKey, formatPrice, rentalDays } from './rental.js';
import './rental-page.css';

function displayDate(value) {
  return value.slice(0, 10).split('-').reverse().join('/');
}

function rentalErrorMessage(error, promotionCode) {
  if (error.status === 409) return 'Một xe đang được giữ hoặc đã có lịch thuê. Vui lòng kiểm tra lại xe và ngày thuê.';
  if (error.status === 422 && promotionCode) return 'Không áp dụng được mã khuyến mãi. Kiểm tra mã hoặc bỏ mã để tiếp tục.';
  return error.message;
}

function DailyCosts({ quote }) {
  const [visible, setVisible] = useState(7);
  return (
    <details className="rental-daily" open>
      <summary>Chi phí từng ngày <span>{quote.rentalDays} ngày</span></summary>
      <ul>
        {Array.from({ length: Math.min(visible, quote.rentalDays) }, (_, index) => (
          <li key={index}><span>{displayDate(addDays(quote.startDate, index))}</span><strong>{formatPrice(quote.pricePerDay)}</strong></li>
        ))}
      </ul>
      {visible < quote.rentalDays && (
        <button className="rental-text-button" type="button" onClick={() => setVisible(visible + 7)}>Xem thêm ngày thuê</button>
      )}
    </details>
  );
}

export default function RentalPage() {
  const today = dateKey();
  const { account, setAccount, loading: accountLoading, error: accountError, retry: retryAccount } = useAccount();
  const [initialCart] = useState(readRentalCart);
  const carIds = initialCart.carIds;
  const [cars, setCars] = useState(null);
  const [startDate, setStartDate] = useState(initialCart.startDate);
  const [expireDate, setExpireDate] = useState(initialCart.expireDate);
  const [deliveryMethod, setDeliveryMethod] = useState(initialCart.deliveryMethod);
  const [deliveryAddress, setDeliveryAddress] = useState(initialCart.deliveryAddress);
  const [promotionDraft, setPromotionDraft] = useState(initialCart.promotionCode);
  const [promotionCode, setPromotionCode] = useState(initialCart.promotionCode);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [quoteResult, setQuoteResult] = useState(null);
  const [quoteError, setQuoteError] = useState(null);
  const [estimateDate, setEstimateDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const submittingRef = useRef(false);

  const selectedCars = (cars || []).filter((car) => carIds.includes(car.id));
  const missingCars = cars !== null && selectedCars.length !== carIds.length;
  const cart = { carIds, startDate, expireDate, deliveryMethod, deliveryAddress, promotionCode };
  const homeHref = rentalHref(cart, '/') + '#fleet';
  const days = rentalDays(startDate, expireDate);
  const validDates = startDate >= today && Number.isFinite(days) && days > 0;
  const quoteKey = JSON.stringify([carIds, startDate, expireDate, deliveryMethod, promotionCode]);
  const quote = quoteResult?.key === quoteKey ? quoteResult.data : null;
  const currentQuoteError = quoteError?.key === quoteKey ? quoteError.message : '';
  const lateDays = estimateDate && validDates ? Math.max(0, rentalDays(expireDate, estimateDate)) : 0;
  const lateEstimate = quote ? lateDays * Number(quote.lateFeePerDay) : 0;

  useEffect(() => {
    document.title = 'Thuê xe · Velo';
    const controller = new AbortController();
    setLoadError('');
    if (!carIds.length) {
      setCars([]);
      return undefined;
    }
    getCars(controller.signal).then((data) => {
      setCars(data);
    }).catch((error) => {
      if (!controller.signal.aborted) setLoadError(error.message);
    });
    return () => controller.abort();
  }, [retry, carIds]);

  useEffect(() => {
    rememberRentalCart({ carIds, startDate, expireDate, deliveryMethod, deliveryAddress, promotionCode });
  }, [carIds, startDate, expireDate, deliveryMethod, deliveryAddress, promotionCode]);

  useEffect(() => {
    if (!carIds.length || !cars || missingCars || !validDates || loadError) return undefined;
    const controller = new AbortController();
    setQuoteResult(null);
    setQuoteError(null);
    const timer = setTimeout(() => {
      getCartQuote({ carIds, startDate, expireDate, deliveryMethod, promotionCode }, controller.signal).then((data) => {
        if (!controller.signal.aborted) setQuoteResult({ key: quoteKey, data });
      }).catch((error) => {
        if (!controller.signal.aborted) setQuoteError({ key: quoteKey, message: rentalErrorMessage(error, promotionCode) });
      });
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [cars, carIds, missingCars, loadError, startDate, expireDate, deliveryMethod, promotionCode, quoteKey, retry, validDates]);

  function changeDates(event) {
    const { name, value } = event.target;
    setSubmitError('');
    setEstimateDate('');
    if (name === 'startDate') {
      setStartDate(value);
      if (value && expireDate <= value) setExpireDate(addDays(value, 1));
    } else {
      setExpireDate(value);
    }
  }

  function changeDelivery(event) {
    const method = event.target.value;
    setDeliveryMethod(method);
    if (method === 'PICKUP') setDeliveryAddress('');
    setSubmitError('');
  }

  function applyPromotion() {
    const code = promotionDraft.trim().toUpperCase();
    if (!code || creating) return;
    setPromotionDraft(code);
    setPromotionCode(code);
    setSubmitError('');
    if (code === promotionCode && currentQuoteError) setRetry(value => value + 1);
  }

  function removePromotion() {
    setPromotionDraft('');
    setPromotionCode('');
    setSubmitError('');
  }

  async function placeOrder(event) {
    event.preventDefault();
    if (!quote || !account || submittingRef.current) return;
    if (deliveryMethod === 'DELIVERY' && !deliveryAddress.trim()) {
      setSubmitError('Vui lòng nhập địa chỉ giao xe.');
      return;
    }
    submittingRef.current = true;
    setCreating(true);
    setSubmitError('');
    try {
      const result = await createRental(cart);
      rememberRentalCart({ carIds: [], startDate, expireDate });
      window.location.replace(`/payment/${result.id}`);
    } catch (error) {
      if (error.status === 401) setAccount(null);
      const message = rentalErrorMessage(error, promotionCode);
      if (error.status === 409 || error.status === 422) {
        setQuoteResult(null);
        setQuoteError({ key: quoteKey, message });
      } else {
        setSubmitError(message);
      }
      submittingRef.current = false;
      setCreating(false);
    }
  }

  return (
    <>
      <a className="skip-link" href="#rental-main">Đến nội dung chính</a>
      <header className="container header-content">
        <Brand href="/" />
        <nav className="rental-header-links" aria-label="Điều hướng thuê xe">
          <a href={homeHref} className="account-back"><ArrowLeft size={16} aria-hidden="true" /> Trang chủ</a>
          <a href="/account" className="button button-outline" title={account ? accountLabel(account) : undefined}><UserRound size={16} aria-hidden="true" /><span className="account-link-name">{accountLabel(account, 'Đăng nhập')}</span></a>
        </nav>
      </header>
      <main className="container rental-page" id="rental-main">
        <div className="rental-intro">
          <div>
            <h1>Xác nhận thuê xe</h1>
            <p>Kiểm tra các xe đã chọn, lịch thuê và tổng chi phí.</p>
          </div>
          {account && <p className="rental-account"><UserRound size={18} aria-hidden="true" /><span>{account.fullName || account.email}<small>{roleLabel(account.role)}</small></span></p>}
        </div>

        {!carIds.length ? (
          <section className="rental-panel rental-empty-cart">
            <h2>Chọn xe từ trang chủ để bắt đầu</h2>
            <p>Thêm một hoặc nhiều xe, sau đó quay lại xác nhận lịch thuê.</p>
            <a className="button button-primary" href="/#fleet">Về trang chọn xe <ArrowRight size={17} aria-hidden="true" /></a>
          </section>
        ) : (
          <form className="rental-layout" onSubmit={placeOrder}>
            <div className="rental-main-column">
              <section className="rental-panel" aria-labelledby="rental-dates-title">
                <h2 id="rental-dates-title"><CalendarDays size={21} aria-hidden="true" /> Lịch thuê xe</h2>
                <div className="rental-date-fields">
                  <label className="account-field">Ngày nhận xe
                    <input name="startDate" type="date" value={startDate} min={today} required disabled={creating} onChange={changeDates} />
                  </label>
                  <label className="account-field">Ngày trả theo lịch
                    <input name="expireDate" type="date" value={expireDate} min={addDays(startDate || today, 1)} required disabled={creating} onChange={changeDates} />
                  </label>
                </div>
                {!validDates && <p className="rental-error" role="alert">Ngày nhận phải từ hôm nay và ngày trả phải sau ngày nhận.</p>}
              </section>

              <section className="rental-panel rental-cars-section" aria-labelledby="rental-cars-title">
                <div className="rental-selected-heading">
                  <h2 id="rental-cars-title">Xe đã chọn ({carIds.length})</h2>
                  <a href={homeHref}>Thay đổi xe</a>
                </div>
                {loadError ? (
                  <div className="rental-empty"><p role="alert">{loadError}</p><button className="button button-outline" type="button" onClick={() => setRetry(retry + 1)}><RefreshCw size={16} aria-hidden="true" /> Tải lại</button></div>
                ) : cars === null ? (
                  <p className="rental-muted" role="status">Đang tải danh sách xe…</p>
                ) : missingCars ? (
                  <div className="rental-empty">
                    <p className="rental-error" role="alert">Một xe đã chọn đang được giữ hoặc không còn trong danh sách.</p>
                    <a className="button button-outline" href={homeHref}>Quay lại chọn xe</a>
                  </div>
                ) : (
                  <div className="rental-selected-cars">
                    {selectedCars.map((car) => (
                      <article className="rental-selected-car" key={car.id}>
                        <div className="rental-car-photo">
                          <CarImage key={car.id} car={car} />
                        </div>
                        <div className="rental-car-info">
                          <h3>{car.productName}</h3>
                          <p>{car.brand || car.Brand}</p>
                          <strong>
                            {car.pricePerDay == null ? 'Chưa có giá' : formatPrice(car.pricePerDay)}
                            <small> / ngày</small>
                          </strong>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="rental-panel" aria-labelledby="rental-delivery-title">
                <h2 id="rental-delivery-title"><Truck size={21} aria-hidden="true" /> Hình thức nhận xe</h2>
                <fieldset className="rental-delivery-options" aria-labelledby="rental-delivery-title" disabled={creating}>
                  <label className="rental-delivery-option">
                    <input type="radio" name="deliveryMethod" value="PICKUP" checked={deliveryMethod === 'PICKUP'} onChange={changeDelivery} />
                    <span><strong>Tự đến nhận xe</strong><small>Miễn phí giao xe</small></span>
                  </label>
                  <label className="rental-delivery-option">
                    <input type="radio" name="deliveryMethod" value="DELIVERY" checked={deliveryMethod === 'DELIVERY'} onChange={changeDelivery} />
                    <span><strong>Giao tận nơi</strong><small>{quote && deliveryMethod === 'DELIVERY' ? `${formatPrice(quote.deliveryFee)} / đơn` : 'Phí giao tính theo đơn'}</small></span>
                  </label>
                  {deliveryMethod === 'DELIVERY' && (
                    <label className="account-field rental-delivery-address">
                      Địa chỉ giao xe
                      <textarea name="deliveryAddress" value={deliveryAddress} maxLength={255} autoComplete="street-address"
                        rows={2} placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
                        onChange={event => { setDeliveryAddress(event.target.value); setSubmitError(''); }} required />
                    </label>
                  )}
                </fieldset>
              </section>

              <section className="rental-panel" aria-labelledby="rental-promotion-title">
                <h2 id="rental-promotion-title"><Tag size={20} aria-hidden="true" /> Mã khuyến mãi</h2>
                <div className="rental-promotion">
                  <div className="account-field">
                    <input name="promotionCode" aria-label="Nhập mã khuyến mãi" value={promotionDraft} maxLength={32} disabled={creating} placeholder="Nhập mã khuyến mãi"
                      onChange={event => setPromotionDraft(event.target.value)}
                      onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); applyPromotion(); } }} />
                  </div>
                  <button className="button button-outline" type="button" disabled={creating || !promotionDraft.trim()}
                    onClick={applyPromotion}>Áp dụng</button>
                </div>
                {promotionCode && (
                  <div className="rental-applied-promotion">
                    <span role="status">{quote?.promotionCode ? `Đã áp dụng ${quote.promotionCode}` : promotionCode}</span>
                    <button className="rental-text-button" type="button" disabled={creating} onClick={removePromotion}>Bỏ mã</button>
                  </div>
                )}
              </section>
            </div>

            <aside className="rental-panel rental-summary" aria-labelledby="rental-summary-title">
              <h2 id="rental-summary-title">Chi phí thuê xe</h2>
              <p className="rental-summary-car">{carIds.length} xe · Cùng lịch nhận và trả</p>
              {currentQuoteError ? (
                <div className="rental-empty"><p className="rental-error" role="alert">{currentQuoteError}</p><button className="rental-text-button" type="button" onClick={() => setRetry(retry + 1)}>Thử lại</button></div>
              ) : quote ? (
                <>
                  <ul className="rental-item-totals">
                    {quote.items.map((item) => (
                      <li key={item.carId}><span>{item.productName}<small>{formatPrice(item.pricePerDay)} × {quote.rentalDays} ngày</small></span><strong>{formatPrice(item.rentalSubtotal)}</strong></li>
                    ))}
                  </ul>
                  <DailyCosts key={quoteKey} quote={quote} />
                  <section className="rental-late-policy" aria-label="Phí trả trễ">
                    <div><Clock3 size={19} aria-hidden="true" /><strong>{formatPrice(quote.lateFeePerDay)} / ngày trễ</strong></div>
                    <p>Áp dụng cho cả đơn thuê, tính riêng cho mỗi ngày trả sau lịch hẹn.</p>
                  </section>
                  <details className="rental-late-preview">
                    <summary>Tính thử phí trễ hạn</summary>
                    <label className="account-field">Giả sử trả xe vào ngày
                      <input type="date" min={expireDate} value={estimateDate} onChange={(event) => setEstimateDate(event.target.value)} />
                    </label>
                    {estimateDate && (
                      <div className="rental-estimate" aria-live="polite">
                        <p>{lateDays} ngày trễ × {formatPrice(quote.lateFeePerDay)} <strong>{formatPrice(lateEstimate)}</strong></p>
                        <p>Tổng dự kiến <strong>{formatPrice(Number(quote.totalPrice) + lateEstimate)}</strong></p>
                      </div>
                    )}
                  </details>
                  <RentalCostBreakdown pricing={quote} />
                </>
              ) : (
                <p className="rental-muted" role="status">{loadError || missingCars ? 'Cần kiểm tra lại danh sách xe đã chọn.' : validDates ? 'Đang lấy báo giá…' : 'Chọn ngày hợp lệ để xem chi phí.'}</p>
              )}
              {submitError && <p className="rental-error" role="alert">{submitError}</p>}
              {accountLoading ? <p role="status">Đang kiểm tra tài khoản…</p> : accountError ? (
                <div><p className="rental-error" role="alert">{accountError}</p><button type="button" className="rental-text-button" onClick={retryAccount}>Thử lại</button></div>
              ) : account ? (
                <button className="button button-primary rental-submit" disabled={!quote || creating || missingCars || !!loadError} type="submit">{creating ? 'Đang tạo đơn…' : `Đặt thuê ${carIds.length} xe`}<ArrowRight size={17} aria-hidden="true" /></button>
              ) : (
                <a className="button button-primary rental-submit" href="/account?next=/rent">Đăng nhập để thuê xe <ArrowRight size={17} aria-hidden="true" /></a>
              )}
            </aside>
          </form>
        )}
      </main>
    </>
  );
}
