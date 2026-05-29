-- ============================================================
-- Schemat bazy danych: Stopy procentowe i ceny mieszkań w Polsce
-- Baza: MySQL 8+, silnik: InnoDB, kodowanie: utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS mieszkania
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mieszkania;

-- ------------------------------------------------------------
-- 1. Użytkownicy (JWT auth)
-- ------------------------------------------------------------
CREATE TABLE users (
    id            BIGINT         NOT NULL AUTO_INCREMENT,
    username      VARCHAR(64)    NOT NULL,
    password_hash VARCHAR(255)   NOT NULL,
    email         VARCHAR(128)   NOT NULL,
    role          ENUM('ADMIN','USER') NOT NULL DEFAULT 'USER',
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email    UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 2. Regiony (17 miast NBP)
-- ------------------------------------------------------------
CREATE TABLE regions (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    city        VARCHAR(64)  NOT NULL,
    voivodeship VARCHAR(64)  NOT NULL,
    CONSTRAINT pk_regions PRIMARY KEY (id),
    CONSTRAINT uq_regions_city UNIQUE (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 3. Typy nieruchomości (rynek × rodzaj ceny)
-- ------------------------------------------------------------
CREATE TABLE property_types (
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    market_type ENUM('pierwotny','wtórny') NOT NULL,
    price_type  ENUM('ofertowa','transakcyjna','hedoniczna') NOT NULL,
    CONSTRAINT pk_property_types PRIMARY KEY (id),
    CONSTRAINT uq_property_types UNIQUE (market_type, price_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 4. Stopy procentowe NBP (źródło: XML)
-- ------------------------------------------------------------
CREATE TABLE interest_rates (
    id         BIGINT        NOT NULL AUTO_INCREMENT,
    rate_id    VARCHAR(8)    NOT NULL,   -- ref, lom, dep, red, dys
    rate_name  VARCHAR(64)   NOT NULL,
    value      DECIMAL(5,2)  NOT NULL,
    valid_from DATE          NOT NULL,
    valid_to   DATE          NULL,       -- NULL = obowiązuje do teraz
    CONSTRAINT pk_interest_rates PRIMARY KEY (id),
    INDEX idx_interest_rates_rate_id   (rate_id),
    INDEX idx_interest_rates_valid_from (valid_from)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- 5. Ceny mieszkań (źródło: XLSX, tabela faktów)
-- ------------------------------------------------------------
CREATE TABLE apartment_prices (
    id               BIGINT         NOT NULL AUTO_INCREMENT,
    region_id        BIGINT         NOT NULL,
    property_type_id BIGINT         NOT NULL,
    price_per_sqm    DECIMAL(10,2)  NOT NULL,
    year             SMALLINT       NOT NULL,
    quarter          TINYINT        NOT NULL,  -- 1..4
    fetched_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_apartment_prices    PRIMARY KEY (id),
    CONSTRAINT fk_ap_region           FOREIGN KEY (region_id)
        REFERENCES regions (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_ap_property_type    FOREIGN KEY (property_type_id)
        REFERENCES property_types (id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uq_ap_unique           UNIQUE (region_id, property_type_id, year, quarter),
    CONSTRAINT chk_ap_quarter         CHECK (quarter BETWEEN 1 AND 4),
    CONSTRAINT chk_ap_year            CHECK (year BETWEEN 2000 AND 2100),
    INDEX idx_ap_year_quarter         (year, quarter),
    INDEX idx_ap_region               (region_id),
    INDEX idx_ap_property_type        (property_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Dane słownikowe (seed)
-- ============================================================

-- Regiony: 16 miast wojewódzkich + Gdynia
INSERT INTO regions (city, voivodeship) VALUES
  ('Białystok',    'podlaskie'),
  ('Bydgoszcz',    'kujawsko-pomorskie'),
  ('Gdańsk',       'pomorskie'),
  ('Gdynia',       'pomorskie'),
  ('Katowice',     'śląskie'),
  ('Kielce',       'świętokrzyskie'),
  ('Kraków',       'małopolskie'),
  ('Lublin',       'lubelskie'),
  ('Łódź',         'łódzkie'),
  ('Olsztyn',      'warmińsko-mazurskie'),
  ('Opole',        'opolskie'),
  ('Poznań',       'wielkopolskie'),
  ('Rzeszów',      'podkarpackie'),
  ('Szczecin',     'zachodniopomorskie'),
  ('Warszawa',     'mazowieckie'),
  ('Wrocław',      'dolnośląskie'),
  ('Zielona Góra', 'lubuskie');

-- Typy nieruchomości (6 kombinacji)
INSERT INTO property_types (market_type, price_type) VALUES
  ('pierwotny', 'ofertowa'),
  ('pierwotny', 'transakcyjna'),
  ('pierwotny', 'hedoniczna'),
  ('wtórny',    'ofertowa'),
  ('wtórny',    'transakcyjna'),
  ('wtórny',    'hedoniczna');

-- ============================================================
-- Przykładowe transakcje z różnymi poziomami izolacji
-- (do zademonstrowania wymagania projektowego)
-- ============================================================

-- Transakcja 1: READ COMMITTED
-- Odczyt aktualnych cen dla danego miasta i kwartału
-- Izolacja chroni przed dirty reads, dopuszcza non-repeatable reads
DELIMITER $$
CREATE PROCEDURE get_prices_read_committed(
    IN p_city VARCHAR(64),
    IN p_year SMALLINT,
    IN p_quarter TINYINT
)
BEGIN
    SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
    START TRANSACTION;
        SELECT r.city, pt.market_type, pt.price_type,
               ap.price_per_sqm, ap.year, ap.quarter
        FROM apartment_prices ap
        JOIN regions r        ON ap.region_id        = r.id
        JOIN property_types pt ON ap.property_type_id = pt.id
        WHERE r.city = p_city
          AND ap.year    = p_year
          AND ap.quarter = p_quarter
        ORDER BY pt.market_type, pt.price_type;
    COMMIT;
END$$
DELIMITER ;

-- Transakcja 2: SERIALIZABLE
-- Import wsadowy danych z XLSX — gwarancja spójności przy równoległym zapisie
DELIMITER $$
CREATE PROCEDURE upsert_apartment_price(
    IN p_city        VARCHAR(64),
    IN p_market_type VARCHAR(16),
    IN p_price_type  VARCHAR(16),
    IN p_price       DECIMAL(10,2),
    IN p_year        SMALLINT,
    IN p_quarter     TINYINT
)
BEGIN
    DECLARE v_region_id        BIGINT;
    DECLARE v_property_type_id BIGINT;

    SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
    START TRANSACTION;
        SELECT id INTO v_region_id
        FROM regions WHERE city = p_city LIMIT 1;

        SELECT id INTO v_property_type_id
        FROM property_types
        WHERE market_type = p_market_type
          AND price_type  = p_price_type
        LIMIT 1;

        INSERT INTO apartment_prices
            (region_id, property_type_id, price_per_sqm, year, quarter)
        VALUES
            (v_region_id, v_property_type_id, p_price, p_year, p_quarter)
        ON DUPLICATE KEY UPDATE
            price_per_sqm = VALUES(price_per_sqm),
            fetched_at    = CURRENT_TIMESTAMP;
    COMMIT;
END$$
DELIMITER ;
