-- Chay thu cong tren MySQL; file nay khong tu chay khi khoi dong backend.
-- USER:  user.demo@velo.test  / User@123456
-- ADMIN: admin.demo@velo.test / Admin@123456
-- Email da ton tai se duoc giu nguyen, khong doi mat khau hoac role.

USE `velo`;

START TRANSACTION;

INSERT INTO `account` (`full_name`, `user_name`, `email`, `password`, `phone`, `role`)
SELECT 'Demo User', 'demo_user', 'user.demo@velo.test', 'User@123456', '0900000001', 'USER'
WHERE NOT EXISTS (
    SELECT 1 FROM `account` WHERE `email` = 'user.demo@velo.test'
);

INSERT INTO `account` (`full_name`, `user_name`, `email`, `password`, `phone`, `role`)
SELECT 'Demo Admin', 'demo_admin', 'admin.demo@velo.test', 'Admin@123456', '0900000002', 'ADMIN'
WHERE NOT EXISTS (
    SELECT 1 FROM `account` WHERE `email` = 'admin.demo@velo.test'
);

COMMIT;

SELECT `id`, `full_name`, `email`, `role`
FROM `account`
WHERE `email` IN ('user.demo@velo.test', 'admin.demo@velo.test')
ORDER BY `role`;
