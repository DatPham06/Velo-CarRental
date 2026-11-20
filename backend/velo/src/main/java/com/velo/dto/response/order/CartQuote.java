package com.velo.dto.response.order;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CartQuote(LocalDate startDate, LocalDate expireDate, long rentalDays,
                        List<RentalQuote> items, BigDecimal pricePerDay, BigDecimal rentalSubtotal,
                        BigDecimal lateFeePerDay, String deliveryMethod, BigDecimal deliveryFee,
                        String promotionCode, BigDecimal discountAmount, BigDecimal totalPrice) {
}
