import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, CalendarDays, CarFront, ChevronDown,
  CircleCheck, Fuel, KeyRound, MapPin, Search, Settings2, UsersRound,
} from 'lucide-react';
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/700.css';
import '@fontsource/be-vietnam-pro/800.css';
import BookingDialog from './BookingDialog.jsx';
import { categories, fleet, locations } from './fleet.js';
import { addDays, dateKey, formatPrice, isCarAvailable, rentalDays } from './rental.js';
import './styles.css';

const steps = [
  { icon: Search, title: 'Tìm xe', detail: 'Chọn thành phố, ngày nhận và ngày trả để xem các xe phù hợp.' },
  { icon: CalendarDays, title: 'Chốt lịch', detail: 'Xem thông tin xe và tổng chi phí dự kiến theo số ngày thuê.' },
  { icon: KeyRound, title: 'Xác nhận', detail: 'Hoàn tất đặt thử và nhận mã đặt xe ngay trên màn hình.' },
];

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="Velo, trang chủ">
      <span className="brand-mark"><CarFront size={20} strokeWidth={2.25} aria-hidden="true" /></span>
      <span>velo<span className="brand-dot">.</span></span>
    </a>
  );
}

function CarCard({ car, onSelect }) {
  return (
    <article className="car-card">
      <div className="car-photo">
        <img src={car.image} alt={car.name} width="512" height="324" loading="lazy" />
        <span className="car-category">{car.category}</span>
      </div>
      <div className="car-body">
        <h3>{car.name}</h3>
        <ul className="car-specs" aria-label="Thông số xe">
          <li><UsersRound size={15} aria-hidden="true" />{car.seats} chỗ</li>
          <li><Settings2 size={15} aria-hidden="true" />{car.transmission}</li>
          <li><Fuel size={15} aria-hidden="true" />{car.fuel}</li>
        </ul>
        <div className="car-footer">
          <p><strong>{formatPrice(car.price)}</strong><span> / ngày</span></p>
          <button
            className="button button-outline car-select"
            type="button"
            aria-label={`Xem xe ${car.name}`}
            onClick={() => onSelect(car)}
          >
            Xem xe <ArrowUpRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

function App() {
  const today = dateKey();
  const [draft, setDraft] = useState(() => ({
    location: '',
    pickup: addDays(today, 1),
    dropoff: addDays(today, 2),
  }));
  const [search, setSearch] = useState(draft);
  const [category, setCategory] = useState('Tất cả');
  const [error, setError] = useState('');
  const [selectedCar, setSelectedCar] = useState(null);
  const availableCars = fleet.filter((car) => (
    (category === 'Tất cả' || car.category === category)
    && (!search.location || car.locations.includes(search.location))
    && isCarAvailable(car, search.pickup, search.dropoff)
  ));

  function updateSearchField(event) {
    const { name, value } = event.target;
    setError('');
    setDraft((current) => {
      const updated = { ...current, [name]: value };
      if (name === 'pickup' && value && updated.dropoff <= value) {
        updated.dropoff = addDays(value, 1);
      }
      return updated;
    });
  }

  function handleSearch(event) {
    event.preventDefault();
    if (!draft.pickup || draft.pickup < today) {
      setError('Chọn ngày nhận xe từ hôm nay trở đi.');
      return;
    }
    if (!(rentalDays(draft.pickup, draft.dropoff) > 0)) {
      setError('Ngày trả xe phải sau ngày nhận xe.');
      return;
    }
    setSearch(draft);
    setCategory('Tất cả');
    document.getElementById('fleet-heading').focus({ preventScroll: true });
    document.getElementById('fleet').scrollIntoView();
  }

  function resetFilters() {
    const defaults = { location: '', pickup: addDays(today, 1), dropoff: addDays(today, 2) };
    setDraft(defaults);
    setSearch(defaults);
    setCategory('Tất cả');
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
          <a className="button button-outline header-action" href="#fleet">
            Khám phá xe <ArrowUpRight size={16} aria-hidden="true" />
          </a>
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

          <form id="search" className="search-panel" aria-label="Tìm xe theo địa điểm và ngày thuê" onSubmit={handleSearch} noValidate>
            <div className="search-row">
              <label className="search-field search-location">
                <MapPin size={20} className="field-icon" aria-hidden="true" />
                <span className="field-content">
                  <span className="field-label">Nơi nhận xe</span>
                  <select name="location" value={draft.location} onChange={updateSearchField}>
                    <option value="">Tất cả thành phố</option>
                    {locations.map((location) => <option key={location}>{location}</option>)}
                  </select>
                </span>
                <ChevronDown size={15} className="select-chevron" aria-hidden="true" />
              </label>
              <label className="search-field">
                <CalendarDays size={20} className="field-icon" aria-hidden="true" />
                <span className="field-content">
                  <span className="field-label">Ngày nhận xe</span>
                  <input type="date" name="pickup" value={draft.pickup} min={today} onChange={updateSearchField} required />
                </span>
              </label>
              <label className="search-field">
                <CalendarDays size={20} className="field-icon" aria-hidden="true" />
                <span className="field-content">
                  <span className="field-label">Ngày trả xe</span>
                  <input
                    type="date"
                    name="dropoff"
                    value={draft.dropoff}
                    min={addDays(draft.pickup && draft.pickup >= today ? draft.pickup : today, 1)}
                    onChange={updateSearchField}
                    required
                  />
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
              <p>Từ xe 5 chỗ đi phố đến xe 7 chỗ cho cả gia đình.</p>
            </div>
            <span className="results-count" role="status">
              <CircleCheck size={16} aria-hidden="true" />
              {availableCars.length} xe phù hợp{search.location && ` · ${search.location}`}
            </span>
          </div>

          <div className="filters" role="group" aria-label="Lọc theo loại xe">
            {categories.map((item) => (
              <button
                className="filter-button"
                key={item}
                type="button"
                aria-pressed={item === category}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {availableCars.length ? (
            <div className="car-grid">
              {availableCars.map((car) => <CarCard key={car.id} car={car} onSelect={setSelectedCar} />)}
            </div>
          ) : (
            <div className="empty-state">
              <CarFront size={30} aria-hidden="true" />
              <h3>Chưa có xe phù hợp</h3>
              <p>Thử đổi loại xe, thành phố hoặc ngày thuê.</p>
              <button className="button button-outline" type="button" onClick={resetFilters}>Đặt lại bộ lọc</button>
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

      {selectedCar && (
        <BookingDialog key={selectedCar.id} car={selectedCar} selection={search} onClose={() => setSelectedCar(null)} />
      )}
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
