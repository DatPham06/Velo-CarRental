import { formatPrice } from './rental.js';

export default function RentalCostBreakdown({ pricing }) {
  return (
    <>
      <dl className="rental-cost-breakdown">
        <div><dt>Tiền thuê theo lịch</dt><dd>{formatPrice(pricing.rentalSubtotal ?? pricing.totalPrice)}</dd></div>
        {pricing.deliveryMethod === 'DELIVERY' && (
          <div><dt>Phí giao xe</dt><dd>{formatPrice(pricing.deliveryFee)}</dd></div>
        )}
        {pricing.promotionCode && (
          <div><dt>Giảm giá ({pricing.promotionCode})</dt><dd>{formatPrice(-Number(pricing.discountAmount))}</dd></div>
        )}
      </dl>
      <div className="rental-grand-total"><span>Tổng thanh toán</span><strong>{formatPrice(pricing.totalPrice)}</strong></div>
    </>
  );
}
