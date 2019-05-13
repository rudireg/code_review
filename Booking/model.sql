-- типы бронирования
	DROP TYPE IF EXISTS BOOKINGTYPE CASCADE;
	CREATE TYPE BOOKINGTYPE AS ENUM(
		'flight', -- полет
		'buffer', -- буфер
		'maintenance', -- ТО
		'marketing', -- маркетинг
		'friend', -- Полет для своих
		'school', -- Школа пилотов
		'child', -- Детский праздник
		'corporative', -- Корпоротив
		'excursion' -- экскурсия
	);

	--  типы статусов бронирования
	DROP TYPE IF EXISTS BOOKINGSTATUS CASCADE;
	CREATE TYPE BOOKINGSTATUS AS ENUM(
		'new', -- новое бронирование
		'rebooking', -- перенос бронирования
		'complete', -- полет состоялся в штатном режиме
		'fail', -- полет не состоялся по вине клиента
		'refund', -- отмена и возврат денег за полет (по неким основаниям, подробности в логе)
		'technical', -- полет отменен или перенесен по причине поломки симулятора (красный цвет таймслота)
		'majeure', -- перенос или отмена полета по ув. причине клиента (подробности в логе)
		'archive', -- бронирование перемещенно в архив
		'technical_rebooking', -- перенос по причине технических проблем
	  'temp' -- временное бронирование (применяется при бронировании с оплатой)
	);

--	таблица бронирований времени симуляторов
	DROP SEQUENCE IF EXISTS bookings_id_seq CASCADE;
	CREATE SEQUENCE bookings_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
	DROP TABLE IF EXISTS bookings CASCADE;
	CREATE TABLE bookings (
	--	уникальный идентификатор брони
		id INTEGER DEFAULT nextval('bookings_id_seq'::regclass) NOT NULL PRIMARY KEY,
	--	рандомный код для защиты от вычисления номера брони
		pin INTEGER NOT NULL DEFAULT trunc(random() * (9999-1000) + 1000),
	--	идентификатор администратора создавший запись в календаре
		uid INTEGER REFERENCES users DEFERRABLE,
	--	таймстамп начала таймслота
		start TIMESTAMP WITH TIME ZONE,
	--	длительность в минутах
		duration INTERVAL,
	--	идентификатор типа симулятора
		simulator INTEGER REFERENCES simulators DEFERRABLE,
	--	перенос брони на новое время
		rebooking INTEGER REFERENCES bookings DEFERRABLE,
	--	идентификатор клиента, который бронировал время (NULL - бронь администратором)
		customer INTEGER REFERENCES customers DEFERRABLE,
	--	идентификатор дополнительного контактного лица
		customer2 INTEGER REFERENCES customers DEFERRABLE,
	--	идентификатор сертификата, по которому осуществляется бронирование
		voucher INTEGER REFERENCES vouchers DEFERRABLE,
	--  идентификатор талона, по которому было осуществлено бронирование
		boarding INTEGER REFERENCES boardings DEFERRABLE,
	--	флаг "подтверждено" (устанавливается администратором e.g. при бронировании с сайта)
		confirmed BOOLEAN NOT NULL DEFAULT false,
	--  тип бронирования
		type BOOKINGTYPE NOT NULL DEFAULT 'flight',
	--	идентификатор пилота, осуществившего полет (ссылается на id в таблице staff)
		pilot INTEGER REFERENCES staff DEFERRABLE,
	--	примечание администратора
		comment TEXT,
	--	флаг "быть особо внимательным к клиенту"
		vip BOOLEAN NOT NULL DEFAULT false,
	--	комментарий к флагу важности
		vip_comment TEXT,
	--	флаг "бронь для школы пилотов", будет ссылкой на ID записи школы
		school INTEGER,
	--	флаг "бронь по детскому празднику", будет ссылкой на ID записи праздника
		child INTEGER,
	--	флаг "бронь по корпоративу", будет ссылкой на ID записи корпоратива
		corporative INTEGER,
	--  указатель экскурсии
		excursion INTEGER REFERENCES excursions DEFERRABLE,
	--	статус бронирования
		status BOOKINGSTATUS,
	--  указатель но прошлый ID бронирования
		preview INTEGER REFERENCES bookings DEFERRABLE,
	--	дополнительные данные события в формате json
		event_data JSONB,
	--  дата создания записи в таблице
		created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
	--  дата создания записи в таблице
		last_modified TIMESTAMP WITH TIME ZONE DEFAULT NULL,
	--  Сумма доплаты за полет. Ваучер может быть куплен на пол часа и быть продлен на 1 час.
	    surcharge INTEGER DEFAULT 0
	);

-- индекс
	CREATE INDEX booking_created ON bookings (created);
	CREATE INDEX booking_last_modified ON bookings (last_modified);
	CREATE INDEX booking_start ON bookings (start);
	CREATE INDEX booking_status ON bookings (status);
	CREATE INDEX booking_voucher ON bookings (voucher);
	CREATE INDEX booking_boarding ON bookings (boarding);
	CREATE INDEX booking_customer ON bookings (customer);
	CREATE INDEX booking_customer2 ON bookings (customer2);
	CREATE INDEX booking_uid ON bookings (uid);
	CREATE INDEX booking_surcharge ON bookings (surcharge);

--	Проверка на пересечение таймслотов. Если пересечение найдено, возвращает TRUE.
	CREATE OR REPLACE FUNCTION tft_timeslots_overlap_check(	
		int, -- симулятор	
		timestamp, -- начало полета	
		timestamp, -- конец полета
		int DEFAULT 0 -- идентификатор проверяемой записи (для апдейта), или 0 (для инсерта или расчета слотов)
	)
	RETURNS boolean AS $$
		DECLARE
			overlap_check boolean;
		BEGIN
			SELECT TRUE INTO overlap_check
			FROM bookings t
			WHERE t.status <> 'archive'::BOOKINGSTATUS AND t.simulator = $1 AND date_trunc('day', t.start) = date_trunc('day', $2)
				AND (t.start, t.start + t.duration) OVERLAPS ($2, $3)
				AND NOT t.id = $4;
			IF overlap_check IS NULL THEN
				overlap_check := FALSE;
			END IF;
			RETURN overlap_check;
		END;
	$$ LANGUAGE plpgsql;

--	расчет свободных слотов для одного дня конкретной даты конкретного симулятора
	CREATE OR REPLACE FUNCTION tft_timeslots_free(
		int, --	идентификатор симулятора
		date, -- дата, по которой провести расчет	
		interval, -- интервал полетов
		--	возвращаемые значения	
		out simulator int, -- идентификатор симулятора	
		out "start" timestamp, -- начало полета	
		out "end" timestamp -- конец полета
	)
	RETURNS setof record AS $$
		DECLARE
			d timestamp;
			day_start timestamp;
			day_end timestamp;
			slot_start timestamp;
			slot_end timestamp;
		BEGIN
			simulator := $1;
			d = date_trunc('day', $2);
			day_start := d + interval '10 hour';
			IF day_start <= CURRENT_TIMESTAMP THEN
				day_start := date_trunc('hour', CURRENT_TIMESTAMP) + interval '1 hour';
			END IF;
			day_end := d + interval '22 hour';
			FOR slot_start IN
				SELECT generate_series FROM generate_series(day_start, day_end, '1 hour')
			LOOP
				slot_end := slot_start + $3;
				IF ($3 <= interval '40 minutes' OR NOT extract(HOUR FROM slot_start) IN (12, 15, 18, 21))
					AND slot_end <= day_end AND tft_timeslots_overlap_check(simulator, slot_start, slot_end) IS FALSE
				THEN
					"start" := slot_start;
					"end" := slot_end;
					RETURN NEXT;
				END IF;
			END LOOP;
		END;
	$$ LANGUAGE plpgsql;

	--	расчет свободных слотов для одного дня конкретной даты конкретного симулятора
	CREATE OR REPLACE FUNCTION tft_timeslots_free_v2(
		int, --	идентификатор симулятора
		date, -- дата, по которой провести расчет
		interval, -- интервал полетов
		interval, -- начало рабочего дня
		interval, -- конец рабочего дня
		--	возвращаемые значения
		out simulator int, -- идентификатор симулятора
		out "start" timestamp, -- начало полета
		out "end" timestamp -- конец полета
	)
	  RETURNS setof record AS $$
	DECLARE
	  d timestamp;
	  day_start timestamp;
	  day_end timestamp;
	  slot_start timestamp;
	  slot_end timestamp;
	BEGIN
	  simulator := $1;
	  d = date_trunc('day', $2);
	  day_start := d + $4;
	  day_end := d + $5;
	  FOR slot_start IN
	  SELECT generate_series FROM generate_series(day_start, day_end, '30 minutes')
	  LOOP
		slot_end := slot_start + $3;
		IF slot_end <= day_end AND tft_timeslots_overlap_check(simulator, slot_start, slot_end) IS FALSE
		THEN
		  "start" := slot_start;
		  "end" := slot_end;
		  RETURN NEXT;
		END IF;
	  END LOOP;
	END;
	$$ LANGUAGE plpgsql;

	--	расчет свободных слотов для конкретной даты для любого симулятора
	CREATE OR REPLACE FUNCTION tft_timeslots_free_any_simulator(
		int, --	идентификатор симулятора
		date, -- дата, по которой провести расчет
		interval, -- интервал полетов
		interval, -- начало рабочего дня
		interval, -- конец рабочего дня
		--	возвращаемые значения
		out simulator int, -- идентификатор симулятора
		out "start" timestamp, -- начало полета
		out "end" timestamp -- конец полета
	)
	RETURNS setof record AS $$
	DECLARE
		d timestamp;
		day_start timestamp;
		day_end timestamp;
		slot_start timestamp;
		slot_end timestamp;
	BEGIN
		-- simulator := $1;
		d = date_trunc('day', $2);
		day_start := d + $4;
		day_end := d + $5;
		FOR slot_start IN
			SELECT generate_series FROM generate_series(day_start, day_end, '30 minutes')
			LOOP
				slot_end := slot_start + $3;
				IF slot_end <= day_end AND tft_timeslots_overlap_check(1, slot_start, slot_end) IS FALSE
				THEN
					simulator := 1;
					"start" := slot_start;
					"end" := slot_end;
					RETURN NEXT;
				ELSIF	slot_end <= day_end AND tft_timeslots_overlap_check(2, slot_start, slot_end) IS FALSE
				THEN
					simulator := 2;
					"start" := slot_start;
					"end" := slot_end;
					RETURN NEXT;
				END IF;
			END LOOP;
	END;
	$$ LANGUAGE plpgsql;

--	триггер для проверки пересечений при изменении таблицы брони
	CREATE OR REPLACE FUNCTION tft_timeslots_overlap_trigger() RETURNS trigger AS $$
		DECLARE
			id int;
			simulator int;
			slot_start timestamp;
			duration interval;
		BEGIN
			IF TG_OP = 'INSERT' THEN id := 0; ELSE id := OLD.id; END IF;
			IF NOT NEW.simulator IS NULL THEN simulator := NEW.simulator; ELSE simulator := OLD.simulator; END IF;
			IF NOT NEW.start IS NULL THEN slot_start := NEW.start; ELSE slot_start := OLD.start; END IF;
			IF NOT NEW.duration IS NULL THEN duration := NEW.duration; ELSE duration := OLD.duration; END IF;
			IF tft_timeslots_overlap_check(simulator, slot_start, slot_start + duration, id) IS TRUE THEN
				RAISE EXCEPTION 'TIMESLOTS_OVERLAPS';
			END IF;
			RETURN NEW;
		END;
	$$ LANGUAGE plpgsql;
	CREATE TRIGGER tft_timeslots_overlap_trigger 
		BEFORE INSERT OR UPDATE ON bookings 
		FOR EACH ROW EXECUTE PROCEDURE tft_timeslots_overlap_trigger();
