package com.velo.repository;

import com.velo.dto.response.AdminStatistics.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.List;

@Repository
public class StatisticsRepository {
    private static final String NOT_CANCELLED = "UPPER(TRIM(o.status)) NOT IN ('CANCELLED', 'CANCELED')";
    private final JdbcTemplate jdbc;

    public StatisticsRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Inventory inventory() {
        return jdbc.queryForObject("""
                SELECT (SELECT COUNT(*) FROM account) AS accounts,
                       (SELECT COUNT(*) FROM account WHERE banned = TRUE) AS banned_accounts,
                       (SELECT COUNT(*) FROM car) AS cars,
                       (SELECT COUNT(DISTINCT d.car_id) FROM order_detail d
                        JOIN orders o ON o.id = d.order_id WHERE UPPER(TRIM(o.status)) = 'RENTING') AS renting_cars
                """, (rs, row) -> new Inventory(rs.getLong("accounts"), rs.getLong("banned_accounts"),
                rs.getLong("cars"), rs.getLong("renting_cars")));
    }

    public Totals totals(LocalDate start, LocalDate end) {
        // Không JOIN order_detail ở đây: một đơn có nhiều xe vẫn chỉ được cộng tiền một lần.
        return jdbc.queryForObject("""
                SELECT COUNT(*) AS orders,
                       COALESCE(SUM(CASE WHEN %s THEN o.total_price ELSE 0 END), 0) AS order_value,
                       COALESCE(SUM(CASE WHEN %s AND UPPER(TRIM(p.status)) = 'PAID'
                                         THEN o.total_price ELSE 0 END), 0) AS paid_value,
                       COALESCE(SUM(CASE WHEN %s AND UPPER(TRIM(p.status)) = 'PAID' THEN 1 ELSE 0 END), 0) AS paid_orders,
                       COALESCE(SUM(CASE WHEN %s AND UPPER(TRIM(p.status)) = 'PENDING' THEN 1 ELSE 0 END), 0) AS pending_payments
                FROM orders o LEFT JOIN payment p ON p.order_id = o.id
                WHERE o.start_date >= ? AND o.start_date < ?
                """.formatted(NOT_CANCELLED, NOT_CANCELLED, NOT_CANCELLED, NOT_CANCELLED),
                (rs, row) -> new Totals(rs.getLong("orders"), rs.getBigDecimal("order_value"),
                        rs.getBigDecimal("paid_value"), rs.getLong("paid_orders"), rs.getLong("pending_payments")),
                timestamp(start), timestamp(end));
    }

    public List<StatusCount> statuses(LocalDate start, LocalDate end) {
        return jdbc.query("""
                SELECT UPPER(TRIM(status)) AS status, COUNT(*) AS total FROM orders
                WHERE start_date >= ? AND start_date < ? GROUP BY UPPER(TRIM(status))
                """, (rs, row) -> new StatusCount(rs.getString("status"), rs.getLong("total")),
                timestamp(start), timestamp(end));
    }

    public List<Month> months(LocalDate start, LocalDate end) {
        return jdbc.query("""
                SELECT MONTH(o.start_date) AS month_number, COUNT(*) AS orders,
                       COALESCE(SUM(CASE WHEN %s THEN o.total_price ELSE 0 END), 0) AS order_value,
                       COALESCE(SUM(CASE WHEN %s AND UPPER(TRIM(p.status)) = 'PAID'
                                         THEN o.total_price ELSE 0 END), 0) AS paid_value
                FROM orders o LEFT JOIN payment p ON p.order_id = o.id
                WHERE o.start_date >= ? AND o.start_date < ?
                GROUP BY MONTH(o.start_date) ORDER BY month_number
                """.formatted(NOT_CANCELLED, NOT_CANCELLED),
                (rs, row) -> new Month(rs.getInt("month_number"), rs.getLong("orders"),
                        rs.getBigDecimal("order_value"), rs.getBigDecimal("paid_value")), timestamp(start), timestamp(end));
    }

    public List<TopCar> topCars(LocalDate start, LocalDate end) {
        return jdbc.query("""
                SELECT c.id, c.product_name, c.brand, COUNT(DISTINCT o.id) AS rentals
                FROM order_detail d JOIN orders o ON o.id = d.order_id JOIN car c ON c.id = d.car_id
                WHERE o.start_date >= ? AND o.start_date < ? AND %s
                GROUP BY c.id, c.product_name, c.brand ORDER BY rentals DESC, c.id ASC LIMIT 5
                """.formatted(NOT_CANCELLED), (rs, row) -> new TopCar(rs.getLong("id"),
                        rs.getString("product_name"), rs.getString("brand"), rs.getLong("rentals")),
                timestamp(start), timestamp(end));
    }

    private Timestamp timestamp(LocalDate date) {
        return Timestamp.valueOf(date.atStartOfDay());
    }
}
