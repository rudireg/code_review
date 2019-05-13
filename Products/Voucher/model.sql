    DROP TYPE IF EXISTS PRODUCTSTYPE CASCADE;
	CREATE TYPE PRODUCTSTYPE AS ENUM (
		'voucher', -- тип ваучер
		'delivery', -- тип доставка
		'school', -- тип школа пилотов
		'child', -- тип детский праздник
		'corporative', -- тип корпоротив
		'excursion', -- тип экскурсия
		'prolong', -- тип пролонгация
		'excursion', -- тип экскурсия
		'smart_voucher', -- тип smart ваучер
		'lowcost_voucher', -- тип ваучера со сниженной ценой
	    'booking', -- тип бронирования с оплатой
	    'boarding' -- тип посадочный талон
	);

--	Базовый тип продуктов
	DROP SEQUENCE IF EXISTS products_id_seq CASCADE;
	CREATE SEQUENCE products_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
	DROP TABLE IF EXISTS products CASCADE;
	CREATE TABLE products (
	--	уникальный идентификатор типа продукта
		id INTEGER DEFAULT nextval('products_id_seq'::regclass) NOT NULL PRIMARY KEY,
	--	наименование продукта (языкозависимое поле)
		title JSONB,
	--	краткое описание типа продукта (языкозависимое поле)
		descr JSONB,
	--	тип продукта
		type PRODUCTSTYPE NOT NULL,
	--	цена продукта
		price INTEGER,
	--	флаг "доcтупно для покупки клиентом"
		show BOOLEAN NOT NULL DEFAULT false
	);

--	справочник типов сертификатов
	DROP TABLE IF EXISTS products_voucher CASCADE;
	CREATE TABLE products_voucher (
		--	уникальный идентификатор типа продукта
		id INTEGER DEFAULT nextval('products_id_seq'::regclass) NOT NULL PRIMARY KEY,
		--	тип продукта
		type PRODUCTSTYPE NOT NULL DEFAULT 'voucher',
		--	срок действия сертификата в днях
		expire_duration INTEGER NOT NULL DEFAULT 90,
		--	время полета в минутах
		fly_duration INTERVAL,
		--	симулятор
		simulator INTEGER REFERENCES simulators DEFERRABLE,
		--	флаг срока действия (плюсуется к сроку действия сертификата или задает отсрочку начала активации)
		lag INTEGER NOT NULL DEFAULT 0,
		--	флаг хита продаж
		hit BOOLEAN NOT NULL DEFAULT false,
		--	флаг вывода на лендинге
		landing BOOLEAN NOT NULL DEFAULT false,
		--	флаг блокировки для продажи (архивные типы сертификатов)
		archived BOOLEAN NOT NULL DEFAULT false,
		--	флаги экспорта в агрегаторы
		exports BOOLEAN,
		-- скидка для инвестиционного ваучера (проценты %)
		discount INTEGER
	) INHERITS (products);

	-- начальные значения по типам сертификатов
	INSERT INTO products_voucher (id, title, price, expire_duration, fly_duration, simulator, show, hit, landing, archived, exports, descr) VALUES
	-- boing                                           price  e_d  f_d                     s  show   hit    land   arch   exp    des
	  (1, '{"ru":"1 минута", "en":"1 minute"}'::jsonb, 1,     90,  '1 minute'::interval,   1, false, false, false, false, false, '{}'::jsonb),
	  (2, '{"ru":"30 минут", "en":"30 minutes"}'::jsonb, 5000,  90,  '30 minutes'::interval, 1, true,  false, true,  false, false, '{}'::jsonb),
	  (3, '{"ru":"1 час", "en":"1 hour"}'::jsonb,    9000,  90,  '1 hour'::interval,     1, true,  true,  true,  false, false, '{}'::jsonb),
	  (4, '{"ru":"90 минут", "en":"90 minutes"}'::jsonb, 14000, 90,  '90 minutes'::interval, 1, true,  false, false, false, false, '{}'::jsonb),
	  (5, '{"ru":"2 часа", "en":"2 hours"}'::jsonb,   18000, 90,  '2 hours'::interval,    1, true,  false, false, false, false, '{}'::jsonb),
    -- airbus
	  (6, '{"ru":"1 минута", "en":"1 minute"}'::jsonb, 1,     90,  '1 minute'::interval,   2, false, false, false, false, false, '{}'::jsonb),
	  (7, '{"ru":"30 минут", "en":"30 minutes"}'::jsonb, 5000,  90,  '30 minutes'::interval, 2, true,  false, true,  false, false, '{}'::jsonb),
	  (8, '{"ru":"1 час", "en":"1 hour"}'::jsonb,    9000,  90,  '1 hour'::interval,     2, true,  true,  true,  false, false, '{}'::jsonb),
	  (9, '{"ru":"90 минут", "en":"90 minutes"}'::jsonb, 14000, 90,  '90 minutes'::interval, 2, true,  false, false, false, false, '{}'::jsonb),
	  (10, '{"ru":"2 часа", "en":"2 hours"}'::jsonb,   18000, 90,  '2 hours'::interval,    2, true,  false, false, false, false, '{}'::jsonb),
    -- boing + airbus
	  (11, '{"ru":"1 минута", "en":"1 minute"}'::jsonb, 1,     180, '1 minute'::interval,   4, false, false, false, false, true,  '{"ru" : "Почувствуйте себя пилотом авиалайнера. Захватывающий полет на авиатренажере-симуляторе. Подвижная платформа передает все полетные ускорения. Точная копия кабины и органов управления самолета, пилот-инструктор, выбор маршрутов по всему миру. В кабине - три человека (кроме инструктора)."}'::jsonb),
	  (12, '{"ru":"30 минут", "en":"30 minutes"}'::jsonb, 5000,  180, '30 minutes'::interval, 4, true,  false, true,  false, true,  '{"ru" : "Почувствуйте себя пилотом авиалайнера. Захватывающий полет на авиатренажере-симуляторе. Подвижная платформа передает все полетные ускорения. Точная копия кабины и органов управления самолета, пилот-инструктор, выбор маршрутов по всему миру. В кабине - три человека (кроме инструктора)."}'::jsonb),
	  (13, '{"ru":"1 час", "en":"1 hour"}'::jsonb,    9000,  180, '1 hour'::interval,     4, true,  true,  true,  false, true,  '{"ru" : "Почувствуйте себя пилотом авиалайнера. Захватывающий полет на авиатренажере-симуляторе. Подвижная платформа передает все полетные ускорения. Точная копия кабины и органов управления самолета, пилот-инструктор, выбор маршрутов по всему миру. В кабине - три человека (кроме инструктора)."}'::jsonb),
	  (14, '{"ru":"90 минут", "en":"90 minutes"}'::jsonb, 14000, 180, '90 minutes'::interval, 4, true,  false, false, false, true,  '{"ru" : "Почувствуйте себя пилотом авиалайнера. Захватывающий полет на авиатренажере-симуляторе. Подвижная платформа передает все полетные ускорения. Точная копия кабины и органов управления самолета, пилот-инструктор, выбор маршрутов по всему миру. В кабине - три человека (кроме инструктора)."}'::jsonb),
	  (15, '{"ru":"2 часа", "en":"2 hours"}'::jsonb,   18000, 180, '2 hours'::interval,    4, true,  false, false, false, true,  '{"ru" : "Почувствуйте себя пилотом авиалайнера. Захватывающий полет на авиатренажере-симуляторе. Подвижная платформа передает все полетные ускорения. Точная копия кабины и органов управления самолета, пилот-инструктор, выбор маршрутов по всему миру. В кабине - три человека (кроме инструктора)."}'::jsonb);


-- справочник smart ваучеров
	DROP TABLE IF EXISTS products_smart_voucher CASCADE;
	CREATE TABLE products_smart_voucher (
		--	уникальный идентификатор типа продукта
		id INTEGER DEFAULT nextval('products_id_seq'::regclass) NOT NULL PRIMARY KEY,
		--	тип продукта
		type PRODUCTSTYPE NOT NULL DEFAULT 'smart_voucher',
		--	срок действия сертфиката в днях
		expire_duration INTEGER NOT NULL DEFAULT 365
	) INHERITS (products_voucher);

	-- добавляем тип smart_voucher
	INSERT INTO products_smart_voucher (id, title, price, expire_duration, fly_duration, simulator, show, hit, landing, archived, exports, descr) VALUES
	  (21, '{"ru":"1 час", "en":"1 hour"}'::jsonb, 9000, 360, '1 hour'::interval, 4, false, true, true, false, true, '{"ru" : "Смарт ваучер. Вложите свой капитал под проценты."}'::jsonb);

-- справочник доставок
	DROP TABLE IF EXISTS products_delivery CASCADE;
	CREATE TABLE products_delivery (
	--	уникальный идентификатор
		id INTEGER DEFAULT nextval('products_id_seq'::regclass) NOT NULL PRIMARY KEY,
		--	тип продукта
		type PRODUCTSTYPE NOT NULL DEFAULT 'delivery'
	) INHERITS (products);

-- начальные значения для типов доставки
	INSERT INTO products_delivery (id, title, descr, price, show) VALUES	(16, '{"ru":"Доставка курьером"}'::jsonb, '{"ru":"Доставка курьером"}'::jsonb, 500, TRUE);

-- справочник детских мероприятий
	DROP TABLE IF EXISTS products_child CASCADE;
	CREATE TABLE products_child (
	--	уникальный идентификатор
		id INTEGER DEFAULT nextval('products_id_seq'::regclass) NOT NULL PRIMARY KEY,
		--	тип продукта
		type PRODUCTSTYPE NOT NULL DEFAULT 'child'
	) INHERITS (products);

-- начальные значения для детских мероприятий
	INSERT INTO products_child (id, title, descr, price) VALUES	(18, '{"ru":"Детское мероприятие"}'::jsonb, '{"ru":"Детское мероприятие"}'::jsonb, 1);


-- справочник корпоративов
	DROP TABLE IF EXISTS products_corporative CASCADE;
	CREATE TABLE products_corporative (
	--	уникальный идентификатор
		id INTEGER DEFAULT nextval('products_id_seq'::regclass) NOT NULL PRIMARY KEY,
		--	тип продукта
		type PRODUCTSTYPE NOT NULL DEFAULT 'corporative'
	) INHERITS (products);

-- начальные значения для корпоративов
	INSERT INTO products_corporative (id, title, descr, price) VALUES	(19, '{"ru":"Корпоратив"}'::jsonb, '{"ru":"Корпоратив"}'::jsonb, 1);


-- справочник экскурсии
	DROP TABLE IF EXISTS products_excursion CASCADE;
	CREATE TABLE products_excursion (
	--	уникальный идентификатор
		id INTEGER DEFAULT nextval('products_id_seq'::regclass) NOT NULL PRIMARY KEY,
		--	тип продукта
		type PRODUCTSTYPE NOT NULL DEFAULT 'excursion'
	) INHERITS (products);

-- начальные значения для экскурсии
	INSERT INTO products_excursion (id, title, descr, price) VALUES	(20, '{"ru":"Экскурсия"}'::jsonb, '{"ru":"Экскурсия"}'::jsonb, 1);

-- продление срока действия продукта
	DROP TABLE IF EXISTS products_prolong CASCADE;
	CREATE TABLE products_prolong (
	--	уникальный идентификатор
		id INTEGER DEFAULT nextval('products_id_seq'::regclass) NOT NULL PRIMARY KEY,
		--	тип продукта
		type PRODUCTSTYPE NOT NULL DEFAULT 'prolong',
		--  тип какого продукта пролонгируем
		prolong PRODUCTSTYPE NOT NULL
	) INHERITS (products);

	INSERT INTO products_prolong (id, prolong, title, descr, price, show) VALUES	(22, 'voucher'::PRODUCTSTYPE, '{"ru":"Пролонгация","en":"Prolongation"}'::jsonb, '{"ru":"Пролонгация","en":"Prolongation"}'::jsonb, 1000, true);

-- тип хранит PRIME TIME значение
	CREATE TYPE PRIMETIME AS (
   	 	start_slot INTERVAL,
   		end_slot INTERVAL
	);

-- получасовой ваучер со сниженной ценой (lowcost_voucher)
	DROP TABLE IF EXISTS products_lowcost_voucher CASCADE;
	CREATE TABLE products_lowcost_voucher (
	--	уникальный идентификатор
		id INTEGER DEFAULT nextval('products_id_seq'::regclass) NOT NULL PRIMARY KEY,
		--	тип продукта
		type PRODUCTSTYPE NOT NULL DEFAULT 'lowcost_voucher',
		-- интервал доступного отрезка времени при выборе слотов онлайн бронирования
		slot_duration INTERVAL DEFAULT '24 hours'::interval,
		-- точечные исключения времени
		prime_times PRIMETIME[] DEFAULT NULL
	) INHERITS (products_voucher);

-- значения для ваучеров со сниженной ценой
	INSERT INTO products_lowcost_voucher
	(id, title, price, expire_duration, fly_duration, simulator, show, hit, landing, archived, exports, descr, slot_duration)
	VALUES
	(23, '{"ru":"30 минут", "en":"30 minutes"}'::jsonb, 2500, 30, '30 minutes'::interval, 4, true, false, false, false, true,  '{"ru":"Полет по низкой цене","en":"Low cost flight"}'::jsonb, '24 hours'::interval);
