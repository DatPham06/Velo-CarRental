USE `velo`;

CREATE TABLE IF NOT EXISTS `promotion` (
    `code` VARCHAR(32) PRIMARY KEY,
    `discount_percent` INT NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO `promotion` (`code`, `discount_percent`, `active`)
SELECT 'VELO10', 10, TRUE
WHERE NOT EXISTS (SELECT 1 FROM `promotion` WHERE `code` = 'VELO10');

INSERT INTO `promotion` (`code`, `discount_percent`, `active`)
SELECT 'VELO15', 15, TRUE
WHERE NOT EXISTS (SELECT 1 FROM `promotion` WHERE `code` = 'VELO15');
