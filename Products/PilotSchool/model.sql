-- типы школьных программ
DROP TYPE IF EXISTS SCHOOL_PROGRAM CASCADE;
CREATE TYPE SCHOOL_PROGRAM AS ENUM (
	'full', -- полная программа обучения
	'beginner' -- программа обучения для начинающих
);

-- справочник школы пилотов
DROP TABLE IF EXISTS products_school CASCADE;
CREATE TABLE products_school (
--	уникальный идентификатор
	id INTEGER DEFAULT nextval('products_id_seq'::regclass) NOT NULL PRIMARY KEY,
	--	тип продукта
	type PRODUCTSTYPE NOT NULL DEFAULT 'school',
	-- тип программы обучения
	program SCHOOL_PROGRAM NOT NULL,
	-- скидка
    discount INTEGER DEFAULT 0
) INHERITS (products);

-- начальные значения
INSERT INTO products_school (id, program, title, descr, price, show) VALUES
        -- FULL PROGRAM
        (17, 'full', '{"ru":"Полная программа", "en":"The full program"}'::jsonb,
        '{"ru":"Школа пилотов, полная программа", "en":"Pilot school, the full program"}'::jsonb,
        27000, true),
        -- BEGINNER PROGRAM
        (34, 'beginner', '{"ru":"Программа для начинающих", "en":"The beginner program"}'::jsonb,
        '{"ru":"Школа пилотов, программа для начинающих", "en":"Pilot school, the beginner program"}'::jsonb,
        12000, true);
