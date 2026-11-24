package com.velo.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record AdminStatistics(int year, Instant generatedAt, Inventory inventory, Totals totals,
                              List<StatusCount> statuses, List<Month> months, List<TopCar> topCars) {
    public record Inventory(long accounts, long bannedAccounts, long cars, long rentingCars) {}
    public record Totals(long orders, BigDecimal orderValue, BigDecimal paidValue,
                         long paidOrders, long pendingPayments) {}
    public record StatusCount(String status, long count) {}
    public record Month(int month, long orders, BigDecimal orderValue, BigDecimal paidValue) {}
    public record TopCar(long id, String productName, String brand, long rentals) {}
}
