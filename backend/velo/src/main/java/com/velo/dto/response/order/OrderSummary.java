package com.velo.dto.response.order;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record OrderSummary(Long id, String customerName, String customerEmail, String status,
                           LocalDate startDate, LocalDate expireDate, LocalDate returnDate,
                           BigDecimal totalPrice, BigDecimal lateFeePerDay, Long lateDays, List<Car> cars,
                           List<String> allowedStatuses) {
    public record Car(Long id, String productName, String img, BigDecimal rentalPricePerDay) {}
    public record Page(List<OrderSummary> orders, int page, int totalPages, long totalOrders) {}
}
