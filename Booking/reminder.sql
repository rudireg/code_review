--	таблица напоминания для клиентов
	DROP SEQUENCE IF EXISTS bookings_reminders_id_seq CASCADE;
	CREATE SEQUENCE bookings_reminders_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
	DROP TABLE IF EXISTS bookings_reminders CASCADE;
	CREATE TABLE bookings_reminders (
	--	уникальный идентификатор напоминания
		id INTEGER DEFAULT nextval('bookings_reminders_id_seq'::regclass) NOT NULL PRIMARY KEY,
	--	идентификатор администратора создавший напоминание
		uid INTEGER NOT NULL REFERENCES users DEFERRABLE,
	--	Дата напоминания
		start DATE NOT NULL,
	--  Имя
	    name TEXT,
	--	идентификатор клиента
		customer INTEGER REFERENCES customers DEFERRABLE,
	--	идентификатор дополнительного контактного лица
		customer2 INTEGER REFERENCES customers DEFERRABLE,
	--  id симулятора (1 - боинг, 2 - аэрбас, 4 - боинг или аэрбас)
		simulator INTEGER NOT NULL REFERENCES simulators DEFERRABLE,
	--  идентификатор бронирования клиента
		booking INTEGER REFERENCES bookings DEFERRABLE,
	--	идентификатор сертификата, по которому осуществляется бронирование
		voucher INTEGER REFERENCES vouchers DEFERRABLE,
	--	длительность в минутах (Данное время задаётся администратором и может отличаться от того что храниться в gifts)
		admin_duration INTERVAL,
	--	флаг "подтверждено" (устанавливается администратором)
		confirmed BOOLEAN NOT NULL DEFAULT false,
	--	примечание администратора
		comment TEXT
	);

--  Уникальный Индекс: юзер + дата
	CREATE UNIQUE INDEX bookings_reminders_customer_start_uindex ON bookings_reminders (customer, start);
--  Индексы:
    CREATE INDEX bookings_reminders_start_idx ON bookings_reminders (start);
    CREATE INDEX bookings_reminders_confirmed_idx ON bookings_reminders (confirmed);
    CREATE INDEX bookings_reminders_start_confirmed_idx ON bookings_reminders (start, confirmed);
