-- Du lieu demo: moi hang mot xe, gia thue tinh bang VND/ngay.
-- Chay thu cong tren MySQL; file nay khong tu chay khi khoi dong backend.
-- Giu nguyen xe da ton tai cung brand va product_name.
-- Honda va Hyundai chua co anh trong project nen img de NULL.

USE `velo`;

START TRANSACTION;

INSERT INTO `car` (`product_name`, `brand`, `price_per_day`, `img`, `status`)
SELECT 'Toyota Corolla Cross', 'Toyota', 950000, '/images/corolla-cross.jpg', 'AVAILABLE'
WHERE NOT EXISTS (
    SELECT 1 FROM `car` WHERE `brand` = 'Toyota' AND `product_name` = 'Toyota Corolla Cross'
);

INSERT INTO `car` (`product_name`, `brand`, `price_per_day`, `img`, `status`)
SELECT 'Honda Civic', 'Honda', 900000, NULL, 'AVAILABLE'
WHERE NOT EXISTS (
    SELECT 1 FROM `car` WHERE `brand` = 'Honda' AND `product_name` = 'Honda Civic'
);

INSERT INTO `car` (`product_name`, `brand`, `price_per_day`, `img`, `status`)
SELECT 'Mazda 3', 'Mazda', 790000, '/images/mazda3.jpg', 'AVAILABLE'
WHERE NOT EXISTS (
    SELECT 1 FROM `car` WHERE `brand` = 'Mazda' AND `product_name` = 'Mazda 3'
);

INSERT INTO `car` (`product_name`, `brand`, `price_per_day`, `img`, `status`)
SELECT 'Hyundai Accent', 'Hyundai', 650000, NULL, 'AVAILABLE'
WHERE NOT EXISTS (
    SELECT 1 FROM `car` WHERE `brand` = 'Hyundai' AND `product_name` = 'Hyundai Accent'
);

INSERT INTO `car` (`product_name`, `brand`, `price_per_day`, `img`, `status`)
SELECT 'Kia Carnival', 'Kia', 1650000, '/images/carnival.jpg', 'AVAILABLE'
WHERE NOT EXISTS (
    SELECT 1 FROM `car` WHERE `brand` = 'Kia' AND `product_name` = 'Kia Carnival'
);

COMMIT;

SELECT `id`, `brand`, `product_name`, `price_per_day`, `img`, `status`
FROM `car`
WHERE (`brand`, `product_name`) IN (
    ('Toyota', 'Toyota Corolla Cross'),
    ('Honda', 'Honda Civic'),
    ('Mazda', 'Mazda 3'),
    ('Hyundai', 'Hyundai Accent'),
    ('Kia', 'Kia Carnival')
)
ORDER BY `brand`;
