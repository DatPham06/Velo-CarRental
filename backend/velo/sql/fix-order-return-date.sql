-- Ngay tra thuc te chua co khi don moi duoc tao.
-- Giu nguyen kieu datetime(6) va du lieu hien co, chi cho phep NULL.
USE `velo`;

ALTER TABLE `orders`
    MODIFY COLUMN `return_date` DATETIME(6) NULL DEFAULT NULL;

SELECT `COLUMN_NAME`, `COLUMN_TYPE`, `IS_NULLABLE`, `COLUMN_DEFAULT`
FROM `information_schema`.`COLUMNS`
WHERE `TABLE_SCHEMA` = DATABASE()
  AND `TABLE_NAME` = 'orders'
  AND `COLUMN_NAME` = 'return_date';
