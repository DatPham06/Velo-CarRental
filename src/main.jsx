import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, CalendarDays, CarFront,
  Check, ClipboardList, KeyRound, MapPin, RefreshCw, Search, ShoppingBag, UserRound,
} from 'lucide-react';
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/700.css';
import '@fontsource/be-vietnam-pro/800.css';
import AccountPage from './AccountPage.jsx';
import RentalPage from './RentalPage.jsx';
import OrdersPage from './OrdersPage.jsx';
import PaymentPage from './PaymentPage.jsx';
import AdminCarsPage from './AdminCarsPage.jsx';
import AdminAccountsPage from './AdminAccountsPage.jsx';
import { useAccount, accountLabel } from './accountSession.js';
import Brand from './Brand.jsx';
import CarImage from './CarImage.jsx';
import { getCars } from './rentalApi.js';
import { readRentalCart, rememberRentalCart, rentalHref } from './rentalCart.js';
import { formatPrice } from './rental.js';
import './styles.css';

const steps = [
  { icon: Search, title: 'Chọn xe', detail: 'Tìm xe theo tên hoặc hãng, rồi chọn một hoặc nhiều xe cho chuyến đi.' },
  { icon: CalendarDays, title: 'Chốt lịch', detail: 'Xem thông tin xe và tổng chi phí dự kiến theo số ngày thuê.' },
  { icon: KeyRound, title: 'Xác nhận', detail: 'Gửi yêu cầu thuê và nhận mã đơn cho các xe đã chọn.' },
];

function CarCard({ car, chosen, onSelect }) {
  return (
    <article className="car-card">
      <div className="car-photo">
        <CarImage key={car.id} car={car} />
        {(car.brand || car.Brand) && <span className="car-category">{car.brand || car.Brand}</span>}
      </div>
      <div className="car-body">
        <h3>{car.productName}</h3>
        <div className="car-footer">
          <p><strong>{car.pricePerDay == null ? 'Chưa có giá' : formatPrice(car.pricePerDay)}</strong><span> / ngày</span></p>
          <button
            className="button button-outline car-select"
            type="button"
            aria-label={`${chosen ? 'Bỏ chọn' : 'Chọn'} ${car.productName}`}
            aria-pressed={chosen}
            onClick={() => onSelect(car)}
          >
            {chosen ? 'Đã chọn' : 'Chọn xe'} <Check size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

function App() {
  const { account } = useAccount();
  const admin = account?.role === 'ADMIN';
  const [initialCart] = useState(readRentalCart);
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('Tất cả');
  const [error, setError] = useState('');
  const [cars, setCars] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [carIds, setCarIds] = useState(initialCart.carIds);
  const brands = ['Tất cả', ...new Set((cars || []).map((car) => car.brand || car.Brand).filter(Boolean))];
  const availableCars = (cars || []).filter((car) => (
    (brand === 'Tất cả' || (car.brand || car.Brand) === brand)
    && `${car.productName} ${car.brand || car.Brand || ''}`.toLocaleLowerCase('vi')
      .includes(search.trim().toLocaleLowerCase('vi'))
  ));
  const selectedCars = (cars || []).filter((car) => carIds.includes(car.id));
  const missingCars = cars !== null && selectedCars.length !== carIds.length;
  const cart = { carIds, startDate: initialCart.startDate, expireDate: initialCart.expireDate };

  useEffect(() => {
    const controller = new AbortController();
    let loadingCars = false;
    async function refreshCars() {
      if (loadingCars || document.hidden) return;
      loadingCars = true;
      try {
        const data = await getCars(controller.signal);
        if (controller.signal.aborted) return;
        setCars(data);
        setLoadError('');
      } catch (err) {
        if (!controller.signal.aborted) setLoadError(err.message);
      } finally {
        loadingCars = false;
      }
    }
    refreshCars();
    window.addEventListener('focus', refreshCars);
    document.addEventListener('visibilitychange', refreshCars);
    const timer = window.setInterval(refreshCars, 15000);
    return () => {
      controller.abort();
      window.removeEventListener('focus', refreshCars);
      document.removeEventListener('visibilitychange', refreshCars);
      window.clearInterval(timer);
    };
  }, [retry]);

  useEffect(() => {
    rememberRentalCart({ ...readRentalCart(), carIds });
  }, [initialCart, carIds]);

  function toggleCar(car) {
    setError('');
    setCarIds((current) => current.includes(car.id) ? current.filter((id) => id !== car.id) : [...current, car.id]);
  }

  function startRental(event) {
    if (!carIds.length || !cars || loadError || missingCars) {
      event.preventDefault();
      setError(missingCars ? 'Một xe đã chọn không còn trong danh sách. Đặt lại lựa chọn để tiếp tục.' : 'Vui lòng chọn xe trước khi thuê.');
      document.getElementById('fleet-heading').focus();
      return;
    }
    rememberRentalCart({ ...readRentalCart(), ...cart });
  }

  function handleSearch(event) {
    event.preventDefault();
    setError('');
    setSearch(keyword);
    setBrand('Tất cả');
    document.getElementById('fleet-heading').focus({ preventScroll: true });
    document.getElementById('fleet').scrollIntoView();
  }

  function resetFilters() {
    setKeyword('');
    setSearch('');
    setBrand('Tất cả');
    setError('');
    document.getElementById('fleet-heading').focus();
  }

  return (
    <>
      <a className="skip-link" href="#main">Đến nội dung chính</a>
      <header className="site-header" id="top">
        <div className="container header-content">
          <Brand />
          <nav className="header-nav" aria-label="Điều hướng chính">
            <a href="#fleet" className="nav-primary">Đội xe</a>
            <a href="#how">Cách thuê xe</a>
          </nav>
          <div className="header-actions">
            <a className="button button-outline header-account" href={admin ? '/admin/orders' : '/orders'} aria-label={admin ? 'Quản lý đơn thuê' : 'Đơn thuê của tôi'}>
              <ClipboardList size={17} aria-hidden="true" /><span>{admin ? 'Quản lý đơn thuê' : 'Đơn thuê của tôi'}</span>
            </a>
            <a className="button button-outline header-account" href="/account" title={account ? accountLabel(account) : undefined}>
              <UserRound size={17} aria-hidden="true" /> <span className="account-link-name">{accountLabel(account)}</span>
            </a>
            <a className="button button-outline header-action" href={rentalHref(cart)} onClick={startRental}>
              Thuê xe{carIds.length > 0 && ` (${carIds.length})`} <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>

      <main id="main">
        <div className="container hero-wrap">
          <section className="hero" aria-labelledby="hero-heading">
            <div className="hero-content">
              <p className="hero-eyebrow"><span /> THUÊ XE TỰ LÁI</p>
              <h1 id="hero-heading">Chọn xe dễ.<br /><em>Đi xa hơn.</em></h1>
              <p className="hero-description">
                Cuối tuần đi đâu? Tìm chiếc xe hợp chuyến đi và lên lịch theo ý mình.
              </p>
              <a className="hero-link" href="#search">
                Tìm xe cho chuyến đi
                <span><ArrowDown size={16} aria-hidden="true" /></span>
              </a>
            </div>
            <div className="hero-visual">
              <img className="hero-image" src="/images/mountain-drive.jpg" alt="" fetchPriority="high" />
              <p className="hero-caption"><MapPin size={15} aria-hidden="true" /> Đường đèo miền Bắc</p>
            </div>
          </section>

          <form id="search" className="search-panel" aria-label="Tìm xe theo tên hoặc hãng" onSubmit={handleSearch}>
            <div className="search-row">
              <label className="search-field">
                <CarFront size={20} className="field-icon" aria-hidden="true" />
                <span className="field-content">
                  <span className="field-label">Tên xe hoặc hãng</span>
                  <input name="keyword" value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="Tìm chiếc xe vừa ý" />
                </span>
              </label>
              <button type="submit" className="button button-primary search-button">
                <Search size={19} aria-hidden="true" /> Tìm xe
              </button>
            </div>
            {error && <p className="search-error" role="alert">{error}</p>}
          </form>
        </div>

        <section className="container fleet-section" id="fleet" aria-labelledby="fleet-heading">
          <div className="section-heading">
            <div>
              <p className="section-label"><span /> ĐỘI XE VELO</p>
              <h2 id="fleet-heading" tabIndex={-1}>Tìm chiếc xe hợp chuyến đi</h2>
              <p>Chọn xe rồi bấm Thuê xe để chọn ngày và xem tổng chi phí.</p>
            </div>
            <span className="results-count" role="status">
              <ShoppingBag size={16} aria-hidden="true" />
              Đã chọn {carIds.length} xe
            </span>
          </div>

          <div className="filters" role="group" aria-label="Lọc theo hãng xe">
            {brands.map((item) => (
              <button
                className="filter-button"
                key={item}
                type="button"
                aria-pressed={item === brand}
                onClick={() => setBrand(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {loadError ? (
            <div className="empty-state">
              <p role="alert">{loadError}</p>
              <button className="button button-outline" type="button" onClick={() => setRetry(retry + 1)}><RefreshCw size={16} aria-hidden="true" /> Tải lại</button>
            </div>
          ) : cars === null ? (
            <p className="rental-muted" role="status">Đang tải danh sách xe…</p>
          ) : availableCars.length ? (
            <div className="car-grid">
              {availableCars.map((car) => <CarCard key={car.id} car={car} chosen={carIds.includes(car.id)} onSelect={toggleCar} />)}
            </div>
          ) : (
            <div className="empty-state">
              <CarFront size={30} aria-hidden="true" />
              <h3>Chưa có xe phù hợp</h3>
              <p>Thử tên xe hoặc hãng xe khác.</p>
              <button className="button button-outline" type="button" onClick={resetFilters}>Đặt lại bộ lọc</button>
            </div>
          )}
          {carIds.length > 0 && (
            <div className="home-rental-cart" aria-label="Xe đã chọn">
              <div className="home-cart-selection">
                <ShoppingBag size={22} aria-hidden="true" />
                <span><strong>Đã chọn {carIds.length} xe</strong><small>{selectedCars.map((car) => car.productName).join(', ')}</small></span>
              </div>
              {missingCars && <p role="alert">Một xe đã chọn không còn trong danh sách.</p>}
              <div className="home-cart-actions">
                <button className="rental-text-button" type="button" onClick={() => setCarIds([])}>Bỏ chọn tất cả</button>
                <a className="button button-primary" href={rentalHref(cart)} onClick={startRental}>Thuê {carIds.length} xe <ArrowRight size={17} aria-hidden="true" /></a>
              </div>
            </div>
          )}
        </section>

        <section className="how-section" id="how" aria-labelledby="how-heading">
          <div className="container">
            <p className="section-label"><span /> CÁCH THUÊ XE</p>
            <h2 id="how-heading">Đặt xe trong 3 bước</h2>
            <ol className="steps">
              {steps.map(({ icon: Icon, title, detail }, index) => (
                <li key={title}>
                  <div className="step-top"><span className="step-icon"><Icon size={21} aria-hidden="true" /></span><span>0{index + 1}</span></div>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </li>
              ))}
            </ol>
            <a className="button button-primary" href="#fleet">Chọn xe <ArrowRight size={17} aria-hidden="true" /></a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-content">
          <Brand />
          <p>Bản demo thuê xe tự lái · Dữ liệu và hình ảnh minh họa</p>
          <a href="#top">Về đầu trang <ArrowUp size={14} aria-hidden="true" /></a>
        </div>
      </footer>

    </>
  );
}

let page = <App />;
const paymentRoute = /^\/payment\/(\d+)\/?$/.exec(window.location.pathname);
if (paymentRoute) page = <PaymentPage orderId={paymentRoute[1]} />;
if (/^\/account\/?$/.test(window.location.pathname)) page = <AccountPage />;
if (/^\/rent\/?$/.test(window.location.pathname)) page = <RentalPage />;
if (/^\/orders\/?$/.test(window.location.pathname)) page = <OrdersPage />;
if (/^\/admin\/orders\/?$/.test(window.location.pathname)) page = <OrdersPage admin />;
if (/^\/admin\/cars\/?$/.test(window.location.pathname)) page = <AdminCarsPage />;
if (/^\/admin\/accounts\/?$/.test(window.location.pathname)) page = <AdminAccountsPage />;
window.addEventListener('pageshow', event => {
  if (event.persisted) window.location.reload();
});
createRoot(document.getElementById('root')).render(page);
