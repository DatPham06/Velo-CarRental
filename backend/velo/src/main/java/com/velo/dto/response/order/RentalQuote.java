package com.velo.dto.response.order;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RentalQuote(
        Long carId,
        String productName,
        LocalDate startDate,
        LocalDate expireDate,
        long rentalDays,
        BigDecimal pricePerDay,
        BigDecimal rentalSubtotal,
        BigDecimal lateFeePerDay) {
}
