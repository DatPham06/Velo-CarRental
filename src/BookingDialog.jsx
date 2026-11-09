import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, CircleCheck, Fuel, Settings2, Users, X } from 'lucide-react';
import { addDays, dateKey, formatPrice, isCarAvailable, rentalDays } from './rental.js';
import './booking.css';

function displayDate(date) {
  return date.split('-').reverse().join('/');
}

export default function BookingDialog({ car, selection, onClose }) {
  const dialogRef = useRef(null);
  const confirmationRef = useRef(null);
  const [location, setLocation] = useState(() => {
    if (car?.locations.includes(selection?.location)) return selection.location;
    return car?.locations[0] ?? '';
  });
  const [pickup, setPickup] = useState(selection?.pickup ?? '');
  const [dropoff, setDropoff] = useState(selection?.dropoff ?? '');
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const opener = document.activeElement;
    dialog.showModal();

    return () => {
      dialog.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [car]);

  useEffect(() => {
    if (reference) confirmationRef.current?.focus();
  }, [reference]);

  if (!car) return null;

  const today = dateKey();
  const days = rentalDays(pickup, dropoff);
  const validPickup = pickup >= today && Number.isFinite(rentalDays(today, pickup));
  const validDates = validPickup && days > 0;
  const available = validDates && isCarAvailable(car, pickup, dropoff);
  const total = available ? formatPrice(car.price * days) : null;
  const earliestDropoff = addDays(validPickup ? pickup : today, 1);

  function updateField(setValue, value) {
    setValue(value);
    setError('');
  }

  function confirmBooking(event) {
    event.preventDefault();

    if (!car.locations.includes(location)) {
      setError('Vui lòng chọn địa điểm nhận xe.');
      return;
    }
    if (!validPickup) {
      setError('Ngày nhận xe phải từ hôm nay trở đi.');
      return;
    }
    if (!validDates) {
      setError('Ngày trả xe phải sau ngày nhận xe ít nhất 1 ngày.');
      return;
    }
    if (!available) {
      setError('Xe đã có lịch thuê trùng khoảng thời gian này. Vui lòng chọn ngày khác.');
      return;
    }

    const code = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
    setReference(`VR-${code}`);
  }

  return (
    <dialog
      ref={dialogRef}
      className="booking-dialog"
      aria-labelledby="booking-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="booking-content">
        <button type="button" className="booking-close" aria-label="Đóng cửa sổ đặt xe" onClick={onClose} autoFocus>
          <X size={20} aria-hidden="true" />
        </button>

        {reference ? (
          <section className="booking-confirmation">
            <div className="booking-confirmation-icon"><CircleCheck size={32} aria-hidden="true" /></div>
            <h2 id="booking-title" ref={confirmationRef} tabIndex={-1}>Đã tạo đơn thuê thử!</h2>
            <p>Đơn demo cho <strong>{car.name}</strong> đã được xác nhận.</p>
            <dl className="booking-receipt">
              <div><dt>Mã đơn</dt><dd>{reference}</dd></div>
              <div><dt>Điểm nhận xe</dt><dd>{location}</dd></div>
              <div><dt>Thời gian</dt><dd>{displayDate(pickup)} – {displayDate(dropoff)}</dd></div>
              <div><dt>Tổng tiền</dt><dd>{total}</dd></div>
            </dl>
            <button type="button" className="booking-primary" onClick={onClose}>Quay lại danh sách xe</button>
          </section>
        ) : (
          <>
            <header className="booking-header">
              <p className="booking-eyebrow">CHI TIẾT XE</p>
              <h2 id="booking-title">{car.name}</h2>
            </header>

            <div className="booking-car">
              <img src={car.image} alt={car.name} style={{ objectPosition: car.imagePosition }} />
              <div>
                <p className="booking-category">{car.category}</p>
                <ul className="booking-specs" aria-label="Thông số xe">
                  <li><Users size={15} aria-hidden="true" /> {car.seats} chỗ</li>
                  <li><Settings2 size={15} aria-hidden="true" /> {car.transmission}</li>
                  <li><Fuel size={15} aria-hidden="true" /> {car.fuel}</li>
                </ul>
                <p className="booking-rate"><strong>{formatPrice(car.price)}</strong> / ngày</p>
              </div>
            </div>

            <form className="booking-form" onSubmit={confirmBooking} noValidate>
              <h3><CalendarDays size={19} aria-hidden="true" /> Lịch thuê xe</h3>
              <label>
                Điểm nhận xe
                <select value={location} onChange={(event) => updateField(setLocation, event.target.value)} required>
                  {car.locations.map((city) => <option key={city}>{city}</option>)}
                </select>
              </label>
              <div className="booking-dates">
                <label>
                  Ngày nhận
                  <input type="date" min={today} value={pickup} onChange={(event) => updateField(setPickup, event.target.value)} required />
                </label>
                <label>
                  Ngày trả
                  <input type="date" min={earliestDropoff} value={dropoff} onChange={(event) => updateField(setDropoff, event.target.value)} required />
                </label>
              </div>

              {error && <p className="booking-error" role="alert">{error}</p>}

              <div className="booking-total" aria-live="polite">
                <span>{available ? `Tổng tiền · ${days} ngày` : 'Tổng tiền'}</span>
                <strong>{total ?? (validDates ? 'Xe bận' : 'Chọn ngày thuê')}</strong>
              </div>
              <button type="submit" className="booking-primary">
                Xác nhận thuê thử <ArrowRight size={18} aria-hidden="true" />
              </button>
              <p className="booking-note">Đặt xe mô phỏng · Không phát sinh thanh toán</p>
            </form>
          </>
        )}
      </div>
    </dialog>
  );
}
