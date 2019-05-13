--	тип посадочный талон
DROP TABLE IF EXISTS products_boarding CASCADE;
CREATE TABLE products_boarding (
  --	уникальный идентификатор типа продукта
  id INTEGER DEFAULT nextval('products_id_seq'::regclass) NOT NULL PRIMARY KEY,
  --	тип продукта
  type PRODUCTSTYPE NOT NULL DEFAULT 'boarding',
  --	время полета в минутах
  fly_duration INTERVAL,
  --	симулятор
  simulator INTEGER REFERENCES simulators DEFERRABLE,
  --	флаг хита продаж
  hit BOOLEAN NOT NULL DEFAULT false,
  --	флаг вывода на лендинге
  landing BOOLEAN NOT NULL DEFAULT false,
  --	флаг блокировки для продажи (архивные типы сертификатов)
  archived BOOLEAN NOT NULL DEFAULT false,
  --	флаги экспорта в агрегаторы
  exports BOOLEAN,
  -- скидка
  discount INTEGER DEFAULT 0
) INHERITS (products);

-- начальные значения
INSERT INTO products_boarding (id, title, price, fly_duration, simulator, show, hit, landing, archived, exports, descr) VALUES
        -- boeing
        (24, '{"ru":"1 минута", "en":"1 min"}'::jsonb, 1, '1 minute'::interval,   1, false, false, false, false, false, '{}'::jsonb),
        (25, '{"ru":"30 минут", "en":"30 min"}'::jsonb, 5000, '30 minutes'::interval, 1, true,  false, true,  false, false, '{}'::jsonb),
        (26, '{"ru":"1 час", "en":"1 hour"}'::jsonb,    9000, '1 hour'::interval,     1, true,  true,  true,  false, false, '{}'::jsonb),
        (27, '{"ru":"90 минут", "en":"90 min"}'::jsonb, 14000, '90 minutes'::interval, 1, true,  false, false, false, false, '{}'::jsonb),
        (28, '{"ru":"2 часа", "en":"2 hours"}'::jsonb,   18000, '2 hours'::interval,    1, true,  false, false, false, false, '{}'::jsonb),
        -- airbus
        (29, '{"ru":"1 минута", "en":"1 min"}'::jsonb, 1, '1 minute'::interval,   2, false, false, false, false, false, '{}'::jsonb),
        (30, '{"ru":"30 минут", "en":"30 min"}'::jsonb, 5000, '30 minutes'::interval, 2, true,  false, true,  false, false, '{}'::jsonb),
        (31, '{"ru":"1 час", "en":"1 hour"}'::jsonb,    9000, '1 hour'::interval,     2, true,  true,  true,  false, false, '{}'::jsonb),
        (32, '{"ru":"90 минут", "en":"90 min"}'::jsonb, 14000, '90 minutes'::interval, 2, true,  false, false, false, false, '{}'::jsonb),
        (33, '{"ru":"2 часа", "en":"2 hours"}'::jsonb,   18000, '2 hours'::interval,    2, true,  false, false, false, false, '{}'::jsonb);

