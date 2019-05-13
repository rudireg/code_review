-- Создание предопределнных буферов
CREATE OR REPLACE FUNCTION booking_buffers_range(
    date, -- Дата начала (включительно)
    date,  -- Дата окончания
    time, -- Время начала рабочего дня
    interval DEFAULT '3 hours' -- Интервал (Сюда включен и размер самого буфера)
)
  RETURNS boolean AS $$
DECLARE
  day_start timestamp;
  day_end timestamp;
  slot_start timestamp;
  step interval;
BEGIN
  day_start := date_trunc('day', $1);
  day_start := day_start + $3;
  day_end := date_trunc('day', $2);
  step := $4;
  IF step IS NULL THEN
    step := '3 hours';
  END IF;
  FOR slot_start IN
  SELECT generate_series FROM generate_series(day_start, day_end, step)
  LOOP
    IF extract(HOUR FROM slot_start) >= extract(HOUR FROM $3)
    THEN
      BEGIN
        INSERT INTO bookings (start, duration, simulator, type, status) -- Для Boing
        VALUES (slot_start, '30 minutes', 1, 'buffer', 'new');
        EXCEPTION
        WHEN others THEN
          RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
      END;
      BEGIN
        INSERT INTO bookings (start, duration, simulator, type, status) -- Для Airbus
        VALUES (slot_start, '30 minutes', 2, 'buffer', 'new');
        EXCEPTION
        WHEN others THEN
          RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
      END;
    END IF;
  END LOOP;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;