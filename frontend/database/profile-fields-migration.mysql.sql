-- Adminer 5.4.0 MySQL 8.4.11 dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auditable_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `auditable_id` bigint unsigned DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `departments` (`id`, `name`, `code`, `type`, `is_active`, `created_at`, `updated_at`) VALUES
(1,	'Central Store',	'central-store',	'central_store',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:23:16'),
(2,	'Central Pharmacy',	'central-pharmacy',	'central_pharmacy',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:23:16'),
(3,	'Department 2',	'dept-2',	'dept_2',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:23:16');

DROP TABLE IF EXISTS `drug_units`;
CREATE TABLE `drug_units` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `drug_id` bigint unsigned NOT NULL,
  `unit_name` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `units_per_unit` int unsigned NOT NULL,
  `selling_price_naira` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `drug_unit_name_unique` (`drug_id`,`unit_name`),
  CONSTRAINT `drug_units_ibfk_1` FOREIGN KEY (`drug_id`) REFERENCES `drugs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `drug_units` (`id`, `drug_id`, `unit_name`, `units_per_unit`, `selling_price_naira`, `created_at`, `updated_at`) VALUES
(1,	107,	'Sachet',	12,	100,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02');

DROP TABLE IF EXISTS `drugs`;
CREATE TABLE `drugs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `barcode` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sku` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Unit',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  UNIQUE KEY `barcode` (`barcode`),
  KEY `drugs_name_idx` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `drugs` (`id`, `name`, `barcode`, `sku`, `category`, `unit`, `is_active`, `created_at`, `updated_at`) VALUES
(1,	'P1 (1k for Sack)',	NULL,	'DEMO-P1',	'Demo inventory',	'Unit',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(2,	'P2',	NULL,	'DEMO-P2',	'Demo inventory',	'Unit',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(3,	'P3',	NULL,	'DEMO-P3',	'Demo inventory',	'Unit',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(4,	'P4',	NULL,	'DEMO-P4',	'Demo inventory',	'Unit',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(5,	'PL1 (1k for Sack Cover)',	NULL,	'DEMO-PL1',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(6,	'PL2',	NULL,	'DEMO-PL2',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(7,	'PL3',	NULL,	'DEMO-PL3',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(8,	'PL4',	NULL,	'DEMO-PL4',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(9,	'PL5',	NULL,	'DEMO-PL5',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(10,	'Adult Pampers',	NULL,	'DEMO-ADULT-PAMPERS',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(11,	'Pad1 (Short)',	NULL,	'DEMO-PAD1',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(12,	'Pad2 (Long)',	NULL,	'DEMO-PAD2',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(13,	'Pad3 (Long by 2)',	NULL,	'DEMO-PAD3',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(14,	'Pad3 (Long by 2A)',	NULL,	'DEMO-PAD3A',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(15,	'Pad5 (Long no cover)',	NULL,	'DEMO-PAD5',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(16,	'Pad6 (Short no cover)',	NULL,	'DEMO-PAD6',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(17,	'Pad (Cover by 3) 8k',	NULL,	'DEMO-PAD-COVER',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(18,	'Pad (Long by 30)',	NULL,	'DEMO-PAD-LONG30',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(19,	'Pad (Long by 30 no cover)',	NULL,	'DEMO-PAD-LONG30-NC',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(20,	'Wiper Tissue 1 (Johnson baby)',	NULL,	'DEMO-WIPES1',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(21,	'Wiper Tissue 2 (Software)',	NULL,	'DEMO-WIPES2',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(22,	'Wiper Tissue 3 (Dr Browns)',	NULL,	'DEMO-WIPES3',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(23,	'Wiper Tissue 4 (Softcare)',	NULL,	'DEMO-WIPES4',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(24,	'Wiper Tissue 5 (Softcare) 100',	NULL,	'DEMO-WIPES5',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(25,	'Shaver',	NULL,	'DEMO-SHAVER',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(26,	'Tissue',	NULL,	'DEMO-TISSUE',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(27,	'Cotton Bot',	NULL,	'DEMO-COTTON-BOT',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(28,	'Baby powder',	NULL,	'DEMO-BABY-POWDER',	'Demo inventory',	'Bottle',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(29,	'Baby soap',	NULL,	'DEMO-BABY-SOAP',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(30,	'Cacatin (Pampers powder)',	NULL,	'DEMO-CACATIN',	'Demo inventory',	'Bottle',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(31,	'Cacatin (Pampers powder by 12)',	NULL,	'DEMO-CACATIN-12',	'Demo inventory',	'Sachet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(32,	'Maternity Pad',	NULL,	'DEMO-MAT-PAD',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(33,	'Gentamycine Cream',	NULL,	'DEMO-GENTA-CREAM',	'Demo inventory',	'Tube',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(34,	'Giving Set 50s',	NULL,	'DEMO-GIVING-SET',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(35,	'Globeta 625',	NULL,	'DEMO-GLOBETA',	'Demo inventory',	'Pack',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(36,	'Greentol tab Orange',	NULL,	'DEMO-GREENTOL',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(37,	'Hydralazine inj',	NULL,	'DEMO-HYDRALAZINE',	'Demo inventory',	'Ampoule',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(38,	'Hydrocortisone Inj x10',	NULL,	'DEMO-HYDROCORTISONE',	'Demo inventory',	'Ampoule',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(39,	'Hyperex-SR Tabs',	NULL,	'DEMO-HYPEREX',	'Demo inventory',	'Pack',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(40,	'Ibucap cold & flu Tabs',	NULL,	'DEMO-IBUCAP',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(41,	'Ibukrish-200',	NULL,	'DEMO-IBUKRISH',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(42,	'Iodine moko',	NULL,	'DEMO-IODINE',	'Demo inventory',	'Bottle',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(43,	'Jawaron 100ml',	NULL,	'DEMO-JAWARON',	'Demo inventory',	'Bottle',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(44,	'Jawasil plus 200ml',	NULL,	'DEMO-JAWASIL',	'Demo inventory',	'Bottle',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(45,	'Jopar genta eye drop box',	NULL,	'DEMO-JOPAR',	'Demo inventory',	'Bottle',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(46,	'Krisomine 25mg',	NULL,	'DEMO-KRISOMINE',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(47,	'Krisacid tab',	NULL,	'DEMO-KRISACID',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(48,	'Levofloxacin 500mg',	NULL,	'DEMO-LEVO',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(49,	'Liquid paraffin mopson',	NULL,	'DEMO-PARAFFIN',	'Demo inventory',	'Bottle',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(50,	'Lisin 10mg mecurie',	NULL,	'DEMO-LISIN',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(51,	'Loratadine afrab tab',	NULL,	'DEMO-LORATADINE',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(52,	'Losartan 50mg',	NULL,	'DEMO-LOSARTAN',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(53,	'Magnesium sulphate',	NULL,	'DEMO-MAG-SULPHATE',	'Demo inventory',	'Ampoule',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(54,	'Malamis 80/480',	NULL,	'DEMO-MALAMIS',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(55,	'Marycef 200mg Cefixim',	NULL,	'DEMO-MARYCEF',	'Demo inventory',	'Capsule',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(56,	'Meloxicam 7.5mg',	NULL,	'DEMO-MELOXICAM7',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(57,	'Meloxicam 15mg',	NULL,	'DEMO-MELOXICAM15',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(58,	'Meroxime 500mg',	NULL,	'DEMO-MEROXIME',	'Demo inventory',	'Vial',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(59,	'Metro White Vitabiotics',	NULL,	'DEMO-METRO-WHITE',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(60,	'Misoclear tab',	NULL,	'DEMO-MISOCLEAR',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(61,	'MMT Asad small',	NULL,	'DEMO-MMT',	'Demo inventory',	'Pack',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(62,	'Murnisik tablets',	NULL,	'DEMO-MURNISIK',	'Demo inventory',	'Pack',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(63,	'Navidoxin tab',	NULL,	'DEMO-NAVIDOXIN',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(64,	'Nelmentin Inj Augmentin 600mg',	NULL,	'DEMO-NELMENTIN',	'Demo inventory',	'Vial',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(65,	'Neurogesic cream 35g',	NULL,	'DEMO-NEURO35',	'Demo inventory',	'Tube',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(66,	'Neurogesic Cream 85g',	NULL,	'DEMO-NEURO85',	'Demo inventory',	'Tube',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(67,	'Nifedipine tabs',	NULL,	'DEMO-NIFEDIPINE',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(68,	'Norodexa eye drop',	NULL,	'DEMO-NORODEXA',	'Demo inventory',	'Bottle',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(69,	'Nylon 0',	NULL,	'DEMO-NYLON0',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(70,	'Nylon 2/0',	NULL,	'DEMO-NYLON20',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(71,	'Ocefix Susp 100mg Cefixim',	NULL,	'DEMO-OCEFIX',	'Demo inventory',	'Bottle',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(72,	'Ofloxacin',	NULL,	'DEMO-OFLOXACIN',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(73,	'Omeprazole caps 14 box',	NULL,	'DEMO-OMEPRAZOLE-CAPS',	'Demo inventory',	'Capsule',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(74,	'Omeprazole Inj',	NULL,	'DEMO-OMEPRAZOLE-INJ',	'Demo inventory',	'Vial',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(75,	'ORS fecox',	NULL,	'DEMO-ORS',	'Demo inventory',	'Sachet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(76,	'P-Alaxin syr',	NULL,	'DEMO-PALAXIN',	'Demo inventory',	'Bottle',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(77,	'Paragol',	NULL,	'DEMO-PARAGOL',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(78,	'Paragol tabs 1000s',	NULL,	'DEMO-PARAGOL1000',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(79,	'Penicillin GREEN DGF',	NULL,	'DEMO-PENICILLIN',	'Demo inventory',	'Vial',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(80,	'Plasil Inj',	NULL,	'DEMO-PLASIL',	'Demo inventory',	'Ampoule',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(81,	'Plaster 1inch',	NULL,	'DEMO-PLASTER1',	'Demo inventory',	'Roll',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(82,	'Plaster 2 inch',	NULL,	'DEMO-PLASTER2',	'Demo inventory',	'Roll',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(83,	'Priton Inj',	NULL,	'DEMO-PRITON',	'Demo inventory',	'Ampoule',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(84,	'Relipen eye drop',	NULL,	'DEMO-RELIPEN',	'Demo inventory',	'Bottle',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(85,	'Skycip susp 125 Cefuroxim',	NULL,	'DEMO-SKYCIP',	'Demo inventory',	'Bottle',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(86,	'Sodamint 1000s',	NULL,	'DEMO-SODAMINT',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(87,	'Sodium Bicarbonate',	NULL,	'DEMO-SODIUM-BICARB',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(88,	'Sportfix dry susp Cefixim 100mg',	NULL,	'DEMO-SPORTFIX',	'Demo inventory',	'Bottle',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(89,	'Sprit 100ml Aicon',	NULL,	'DEMO-SPIRIT',	'Demo inventory',	'Bottle',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(90,	'Surgical glove 7.5',	NULL,	'DEMO-GLOVE75',	'Demo inventory',	'Pair',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(91,	'Syringe 20ml',	NULL,	'DEMO-SYRINGE20',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(92,	'Syringes 5ml',	NULL,	'DEMO-SYRINGE5',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(93,	'Syringes 10ml',	NULL,	'DEMO-SYRINGE10',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(94,	'Tanzol Suspension',	NULL,	'DEMO-TANZOL',	'Demo inventory',	'Bottle',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(95,	'Urine Bag',	NULL,	'DEMO-URINE-BAG',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(96,	'Vasoprin tabs',	NULL,	'DEMO-VASOPRIN',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(97,	'Vega krish',	NULL,	'DEMO-VEGA',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(98,	'Vicryl 2',	NULL,	'DEMO-VICRYL2',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(99,	'Vicryl 2/0',	NULL,	'DEMO-VICRYL20',	'Demo inventory',	'Piece',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(100,	'Vit E 100mg everdestiny',	NULL,	'DEMO-VITE',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(101,	'Vit K3 Inj',	NULL,	'DEMO-VITK3',	'Demo inventory',	'Ampoule',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(102,	'Wormex susp',	NULL,	'DEMO-WORMEX',	'Demo inventory',	'Bottle',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(103,	'Xylocaine plain Inj',	NULL,	'DEMO-XYLO-PLAIN',	'Demo inventory',	'Vial',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(104,	'Xylocaine with adrenaline',	NULL,	'DEMO-XYLO-ADRENALINE',	'Demo inventory',	'Vial',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(105,	'Zinc Tab Archy',	NULL,	'DEMO-ZINC',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(106,	'Zucin eye drop',	NULL,	'DEMO-ZUCIN',	'Demo inventory',	'Bottle',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02'),
(107,	'Paracetamol 500mg',	NULL,	'DEMO-PCM500',	'Demo inventory',	'Tablet',	1,	'2026-10-20 14:23:16',	'2026-10-20 14:25:02');

DROP TABLE IF EXISTS `patients`;
CREATE TABLE `patients` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `folder_no` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nhis_number` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `folder_no` (`folder_no`),
  KEY `patients_name_idx` (`full_name`),
  KEY `patients_phone_idx` (`phone`),
  KEY `patients_nhis_idx` (`nhis_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `patients` (`id`, `folder_no`, `full_name`, `phone`, `nhis_number`, `created_at`, `updated_at`) VALUES
(1,	'DEMO-001',	'Demo Patient',	'08000000001',	'DEMO-NHIS-001',	'2026-10-20 14:23:16',	'2026-10-20 14:23:16');

DROP TABLE IF EXISTS `personal_access_tokens`;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `personal_access_tokens_owner_idx` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1,	'App\\Models\\User',	1,	'pharmacy',	'553fe83a0b0be02d0a1b21a1b7bd2feab89bc8e7600faabac2499e172a3a9213',	'[\"*\"]',	NULL,	NULL,	'2026-10-20 14:23:28',	'2026-10-20 14:23:28');

DROP TABLE IF EXISTS `pharmacy_settings`;
CREATE TABLE `pharmacy_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `pharmacy_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `prescription_items`;
CREATE TABLE `prescription_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `prescription_id` bigint unsigned NOT NULL,
  `drug_id` bigint unsigned NOT NULL,
  `quantity` int unsigned NOT NULL,
  `dispensed_quantity` int unsigned NOT NULL DEFAULT '0',
  `dosage` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instructions` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `prescription_id` (`prescription_id`),
  KEY `drug_id` (`drug_id`),
  CONSTRAINT `prescription_items_ibfk_1` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `prescription_items_ibfk_2` FOREIGN KEY (`drug_id`) REFERENCES `drugs` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `prescriptions`;
CREATE TABLE `prescriptions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `prescription_no` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `patient_id` bigint unsigned NOT NULL,
  `doctor_id` bigint unsigned NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `prescribed_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `prescription_no` (`prescription_no`),
  KEY `prescriptions_status_idx` (`status`,`prescribed_at`),
  KEY `patient_id` (`patient_id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `prescriptions_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `prescriptions_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `refund_requests`;
CREATE TABLE `refund_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sale_id` bigint unsigned NOT NULL,
  `requested_by` bigint unsigned NOT NULL,
  `approved_by` bigint unsigned DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `items` json NOT NULL,
  `requested_amount_naira` bigint unsigned NOT NULL,
  `approved_amount_naira` bigint unsigned DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `decision_note` text COLLATE utf8mb4_unicode_ci,
  `requested_at` timestamp NOT NULL,
  `decided_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `refund_requests_status_idx` (`status`,`requested_at`),
  KEY `sale_id` (`sale_id`),
  KEY `requested_by` (`requested_by`),
  KEY `approved_by` (`approved_by`),
  CONSTRAINT `refund_requests_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `refund_requests_ibfk_2` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `refund_requests_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `sale_items`;
CREATE TABLE `sale_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sale_id` bigint unsigned NOT NULL,
  `drug_id` bigint unsigned NOT NULL,
  `quantity` int unsigned NOT NULL,
  `sale_quantity` int unsigned NOT NULL DEFAULT '0',
  `sale_unit_name` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_price_naira` bigint unsigned NOT NULL,
  `cost_price_naira` bigint unsigned NOT NULL,
  `line_total_naira` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sale_id` (`sale_id`),
  KEY `drug_id` (`drug_id`),
  CONSTRAINT `sale_items_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sale_items_ibfk_2` FOREIGN KEY (`drug_id`) REFERENCES `drugs` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `sales`;
CREATE TABLE `sales` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `invoice_no` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_sale_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `patient_id` bigint unsigned DEFAULT NULL,
  `prescription_id` bigint unsigned DEFAULT NULL,
  `staff_id` bigint unsigned NOT NULL,
  `department_id` bigint unsigned NOT NULL,
  `subtotal_naira` bigint unsigned NOT NULL,
  `discount_naira` bigint unsigned NOT NULL DEFAULT '0',
  `total_naira` bigint unsigned NOT NULL,
  `client_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `patient_type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Outpatient',
  `payment_mode` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_synced` tinyint(1) NOT NULL DEFAULT '1',
  `sold_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_no` (`invoice_no`),
  UNIQUE KEY `client_sale_id` (`client_sale_id`),
  KEY `sales_department_sold_idx` (`department_id`,`sold_at`),
  KEY `patient_id` (`patient_id`),
  KEY `prescription_id` (`prescription_id`),
  KEY `staff_id` (`staff_id`),
  CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sales_ibfk_2` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sales_ibfk_3` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`),
  CONSTRAINT `sales_ibfk_4` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `staff_messages`;
CREATE TABLE `staff_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sender_id` bigint unsigned NOT NULL,
  `recipient_id` bigint unsigned NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `messages_inbox_idx` (`recipient_id`,`sender_id`,`read_at`),
  KEY `messages_pair_idx` (`sender_id`,`recipient_id`,`id`),
  CONSTRAINT `staff_messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `staff_messages_ibfk_2` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `stock_count_items`;
CREATE TABLE `stock_count_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `stock_count_id` bigint unsigned NOT NULL,
  `stock_id` bigint unsigned DEFAULT NULL,
  `drug_id` bigint unsigned NOT NULL,
  `batch_no` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expected_quantity` int unsigned NOT NULL,
  `counted_quantity` int unsigned DEFAULT NULL,
  `counted_by` bigint unsigned DEFAULT NULL,
  `counted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `count_stock_unique` (`stock_count_id`,`stock_id`),
  KEY `stock_id` (`stock_id`),
  KEY `drug_id` (`drug_id`),
  KEY `counted_by` (`counted_by`),
  CONSTRAINT `stock_count_items_ibfk_1` FOREIGN KEY (`stock_count_id`) REFERENCES `stock_counts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_count_items_ibfk_2` FOREIGN KEY (`stock_id`) REFERENCES `stocks` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_count_items_ibfk_3` FOREIGN KEY (`drug_id`) REFERENCES `drugs` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `stock_count_items_ibfk_4` FOREIGN KEY (`counted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `stock_counts`;
CREATE TABLE `stock_counts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reference` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_id` bigint unsigned NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'counting',
  `started_by` bigint unsigned NOT NULL,
  `completed_by` bigint unsigned DEFAULT NULL,
  `started_at` timestamp NOT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  KEY `stock_counts_dept_status_idx` (`department_id`,`status`),
  KEY `started_by` (`started_by`),
  KEY `completed_by` (`completed_by`),
  CONSTRAINT `stock_counts_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `stock_counts_ibfk_2` FOREIGN KEY (`started_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `stock_counts_ibfk_3` FOREIGN KEY (`completed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `stock_transfers`;
CREATE TABLE `stock_transfers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `transfer_no` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_department_id` bigint unsigned NOT NULL,
  `to_department_id` bigint unsigned NOT NULL,
  `drug_id` bigint unsigned NOT NULL,
  `from_stock_id` bigint unsigned DEFAULT NULL,
  `batch_no` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int unsigned NOT NULL,
  `created_by` bigint unsigned NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `transferred_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transfer_no` (`transfer_no`),
  KEY `from_department_id` (`from_department_id`),
  KEY `to_department_id` (`to_department_id`),
  KEY `drug_id` (`drug_id`),
  KEY `from_stock_id` (`from_stock_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `stock_transfers_ibfk_1` FOREIGN KEY (`from_department_id`) REFERENCES `departments` (`id`),
  CONSTRAINT `stock_transfers_ibfk_2` FOREIGN KEY (`to_department_id`) REFERENCES `departments` (`id`),
  CONSTRAINT `stock_transfers_ibfk_3` FOREIGN KEY (`drug_id`) REFERENCES `drugs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_transfers_ibfk_4` FOREIGN KEY (`from_stock_id`) REFERENCES `stocks` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_transfers_ibfk_5` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `stocks`;
CREATE TABLE `stocks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `drug_id` bigint unsigned NOT NULL,
  `department_id` bigint unsigned NOT NULL,
  `batch_no` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int unsigned NOT NULL DEFAULT '0',
  `cost_price_naira` bigint unsigned NOT NULL,
  `selling_price_naira` bigint unsigned NOT NULL,
  `expiry_date` date NOT NULL,
  `supplier_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stocks_lookup_idx` (`drug_id`,`department_id`,`expiry_date`),
  KEY `department_id` (`department_id`),
  KEY `supplier_id` (`supplier_id`),
  CONSTRAINT `stocks_ibfk_1` FOREIGN KEY (`drug_id`) REFERENCES `drugs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stocks_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stocks_ibfk_3` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `suppliers`;
CREATE TABLE `suppliers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `suppliers` (`id`, `name`, `phone`, `email`, `address`, `created_at`, `updated_at`) VALUES
(1,	'Demo Medical Supplier',	'08000000000',	'supplier@hospital.local',	'Demo address',	'2026-10-20 14:23:16',	'2026-10-20 14:23:16');

DROP TABLE IF EXISTS `sync_conflicts`;
CREATE TABLE `sync_conflicts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `client_sale_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_no` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `staff_id` bigint unsigned NOT NULL,
  `department_id` bigint unsigned NOT NULL,
  `payload` json NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `reviewed_by` bigint unsigned DEFAULT NULL,
  `review_note` text COLLATE utf8mb4_unicode_ci,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `client_sale_id` (`client_sale_id`),
  KEY `conflicts_status_idx` (`status`,`created_at`),
  KEY `staff_id` (`staff_id`),
  KEY `department_id` (`department_id`),
  KEY `reviewed_by` (`reviewed_by`),
  CONSTRAINT `sync_conflicts_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`),
  CONSTRAINT `sync_conflicts_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`),
  CONSTRAINT `sync_conflicts_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_id` bigint unsigned DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_photo_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `designation` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employee_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_phone` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `professional_license_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `users_department_fk` (`department_id`),
  CONSTRAINT `users_department_fk` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `role`, `department_id`, `is_active`, `remember_token`, `profile_photo_path`, `phone`, `designation`, `employee_id`, `address`, `emergency_contact_name`, `emergency_contact_phone`, `professional_license_no`, `created_at`, `updated_at`) VALUES
(1,	'Demo HOD',	'hod.demo@hospital.local',	NULL,	'$2b$12$HmTrg5jRuEPF/WotUGBoi.bBulQwDdB4BGc3i982HIcTk7Pmyv3Wu',	'hod',	NULL,	1,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	'2026-10-20 14:23:16',	'2026-10-20 14:23:16'),
(2,	'Demo Store Keeper',	'store.demo@hospital.local',	NULL,	'$2b$12$HmTrg5jRuEPF/WotUGBoi.bBulQwDdB4BGc3i982HIcTk7Pmyv3Wu',	'store_keeper',	1,	1,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	'2026-10-20 14:23:16',	'2026-10-20 14:23:16'),
(3,	'Demo Pharmacy Staff',	'pharmacy.demo@hospital.local',	NULL,	'$2b$12$HmTrg5jRuEPF/WotUGBoi.bBulQwDdB4BGc3i982HIcTk7Pmyv3Wu',	'pharmacy_staff',	2,	1,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	'2026-10-20 14:23:16',	'2026-10-20 14:23:16'),
(4,	'Demo Doctor',	'doctor.demo@hospital.local',	NULL,	'$2b$12$HmTrg5jRuEPF/WotUGBoi.bBulQwDdB4BGc3i982HIcTk7Pmyv3Wu',	'doctor',	NULL,	1,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	'2026-10-20 14:23:16',	'2026-10-20 14:23:16'),
(5,	'Demo Medical Director',	'md.demo@hospital.local',	NULL,	'$2b$12$HmTrg5jRuEPF/WotUGBoi.bBulQwDdB4BGc3i982HIcTk7Pmyv3Wu',	'md',	NULL,	1,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	'2026-10-20 14:23:16',	'2026-10-20 14:23:16');

-- 2026-10-20 14:25:30 UTC