package com.velo.service;

import com.velo.dto.response.AdminStatistics;
import com.velo.dto.response.AdminStatistics.*;
import com.velo.repository.StatisticsRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class StatisticsService {
    private final StatisticsRepository statistics;

    public StatisticsService(StatisticsRepository statistics) {
        this.statistics = statistics;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public AdminStatistics overview(Integer requestedYear) {
        int year = requestedYear == null ? LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).getYear() : requestedYear;
        if (year < 2000 || year > 2100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Năm thống kê phải từ 2000 đến 2100.");
        }
        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = start.plusYears(1);
        Inventory inventory = statistics.inventory();
        Totals totals = statistics.totals(start, end);
        Map<String, Long> counts = new LinkedHashMap<>();
        for (String status : List.of("PENDING", "CONFIRMED", "RENTING", "RETURNED", "CANCELLED", "OTHER")) {
            counts.put(status, 0L);
        }
        for (StatusCount row : statistics.statuses(start, end)) {
            String status = switch (row.status()) {
                case "COMPLETED" -> "RETURNED";
                case "CANCELED" -> "CANCELLED";
                default -> counts.containsKey(row.status()) ? row.status() : "OTHER";
            };
            counts.merge(status, row.count(), Long::sum);
        }
        Map<Integer, Month> existingMonths = new LinkedHashMap<>();
        for (Month month : statistics.months(start, end)) existingMonths.put(month.month(), month);
        List<Month> months = new ArrayList<>();
        for (int month = 1; month <= 12; month++) {
            months.add(existingMonths.getOrDefault(month, new Month(month, 0, BigDecimal.ZERO, BigDecimal.ZERO)));
        }
        return new AdminStatistics(year, Instant.now(), inventory, totals,
                counts.entrySet().stream().map(row -> new StatusCount(row.getKey(), row.getValue())).toList(),
                months, statistics.topCars(start, end));
    }
}
