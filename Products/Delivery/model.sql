--  статусы доставки
	DROP TYPE IF EXISTS DELIVERYSTATUS CASCADE;
	CREATE TYPE DELIVERYSTATUS AS ENUM(
	  'pending',    -- новая доставка
	  'prepared',   -- подготовка для курьера
	  'inprogress', -- идет процес доставки
	  'complete',   -- доставка состоялась
		'refund',     -- отмена доставки с возвратом денег
	  'archived',   -- в архиве
		'fail',       -- доставка не удалась
		'cancel'      -- доставка отменена
	);

-- список доставок
	DROP SEQUENCE IF EXISTS deliveries_id_seq CASCADE;
	CREATE SEQUENCE deliveries_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
	DROP TABLE IF EXISTS deliveries CASCADE;
	CREATE TABLE deliveries (
	--	уникальный идентификатор доставки
		id INTEGER DEFAULT nextval('deliveries_id_seq'::regclass) NOT NULL PRIMARY KEY,
    --  тип доставки (в нём указана цена и валюта)
		pid INTEGER REFERENCES products_delivery DEFERRABLE,
	--  массив ID товаров требующих доставки (указывает на таблицу vouchers)
	    order_id INTEGER UNIQUE REFERENCES orders DEFERRABLE,
	--  ID владельца
	    customer INTEGER NOT NULL REFERENCES customers DEFERRABLE,
	--	адрес доставки
		address TEXT,
	--  желаемая дата начала доставки
		date_delivery TIMESTAMP WITH TIME ZONE DEFAULT NULL,
	--  желаемая дата окончания доставки
		date_delivery_to TIMESTAMP WITH TIME ZONE DEFAULT NULL,
	--  статус доставки
	    status DELIVERYSTATUS NOT NULL DEFAULT 'pending',
	--	примечания клиента по условиям доставки (время, домофон etc)
		comments TEXT,
	--	примечания администратора для курьера (по результатам уточнений с администратором)
		comments_admin jsonb,
  -- дата когда доставка случилась.
		date_final_delivery TIMESTAMP WITH TIME ZONE DEFAULT NULL
	);

-- индексы
	CREATE INDEX deliveries_pid ON deliveries (pid);
	CREATE INDEX deliveries_order_id ON deliveries (order_id);
	CREATE INDEX deliveries_customer ON deliveries (customer);
	CREATE INDEX deliveries_date_delivery ON deliveries (date_delivery);
	CREATE INDEX deliveries_status ON deliveries (status);
