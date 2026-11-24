-- Chi dung tren database test trong; khong chay tren database dang su dung.
INSERT INTO account (id, full_name, email, password, phone, role, banned) VALUES
(1, 'Demo User', 'user.demo@velo.test', 'User@123456', '0900000001', 'USER', FALSE),
(2, 'Demo Admin', 'admin.demo@velo.test', 'Admin@123456', '0900000002', 'ADMIN', FALSE),
(3, 'Banned Test User', 'banned.test@velo.test', 'Test@123456', NULL, 'USER', TRUE);

INSERT INTO car (id, product_name, brand, price_per_day, img, status) VALUES
(1, 'Toyota Corolla Cross', 'Toyota', 950000, '/images/corolla-cross.jpg', 'AVAILABLE'),
(2, 'Mazda 3', 'Mazda', 790000, '/images/mazda3.jpg', 'AVAILABLE'),
(3, 'Honda Civic', 'Honda', 900000, NULL, 'AVAILABLE'),
(4, 'Hyundai Accent', 'Hyundai', 650000, NULL, 'AVAILABLE'),
(5, 'Kia Carnival', 'Kia', 1650000, '/images/carnival.jpg', 'AVAILABLE');

INSERT INTO orders (id, account_id, start_date, expire_date, return_date, status, total_price, late_fee_per_day, delivery_fee, discount_amount) VALUES
(1, 1, '2026-01-05 00:00:00', '2026-01-06 00:00:00', NULL, 'PENDING',   1000000, 100000, 150000, 100000),
(2, 1, '2026-02-02 00:00:00', '2026-02-04 00:00:00', NULL, 'CONFIRMED', 2000000, 100000, 0, 0),
(3, 1, '2026-02-05 00:00:00', '2026-02-08 00:00:00', NULL, 'RENTING',   3000000, 100000, 0, 0),
(4, 1, '2026-11-02 00:00:00', '2026-11-06 00:00:00', '2026-11-06 00:00:00', 'COMPLETED', 4000000, 100000, 0, 0),
(5, 1, '2026-11-04 00:00:00', '2026-11-05 00:00:00', '2026-11-05 00:00:00', 'RETURNED', 500000, 100000, 0, 0),
(6, 1, '2026-11-10 00:00:00', '2026-11-11 00:00:00', NULL, 'CANCELED',  9000000, 100000, 0, 0),
(7, 1, '2026-12-02 00:00:00', '2026-12-03 00:00:00', NULL, 'CANCELLED', 8000000, 100000, 0, 0),
(8, 1, '2026-03-02 00:00:00', '2026-03-03 00:00:00', NULL, 'MANUAL',     100000, 100000, 0, 0),
(9, 1, '2025-12-31 00:00:00', '2026-01-02 00:00:00', NULL, 'RENTING',    700000, 100000, 0, 0);

INSERT INTO order_detail (order_id, car_id, rental_price_per_day) VALUES
(1, 1, 450000), (1, 2, 500000), (2, 2, 1000000), (3, 1, 1000000),
(4, 2, 1000000), (5, 1, 500000), (6, 3, 9000000), (7, 4, 8000000), (8, 3, 100000), (9, 5, 350000);

INSERT INTO payment (order_id, payment_method, status) VALUES
(2, 'BANK_TRANSFER', 'PENDING'), (3, 'CASH', 'PAID'), (4, 'BANK_TRANSFER', 'PAID'),
(6, 'CASH', 'PAID'), (7, 'CASH', 'PENDING'), (9, 'CASH', 'PAID');
