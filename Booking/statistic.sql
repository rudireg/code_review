--	подсчет свободных слотов для статистики
 -- DROP FUNCTION tft_free_slots_statistic(date);
 CREATE OR REPLACE FUNCTION tft_free_slots_statistic(
   date, -- дата с которой провести расчет
   --	возвращаемые значения
   out "start" timestamp, -- начало полета
   out "items" int -- кол-во свободных получасовых слотов
 )
   RETURNS setof record AS $$
 DECLARE
   day_start timestamp;
   day_end timestamp;
   slot_start timestamp;
   slot_end timestamp;
   current_hour INT;
   cnt INT;
 BEGIN
   day_start := date_trunc('day', $1);
   day_end := date_trunc('day', CURRENT_TIMESTAMP);
   FOR slot_start IN
   SELECT generate_series FROM generate_series(day_start, day_end, '30 minutes')
   LOOP
     current_hour := to_char(slot_start, 'HH24');
     IF current_hour >= 10 AND current_hour < 22 THEN
       slot_end := slot_start + INTERVAL '30 minutes';
       cnt :=0;
       IF tft_timeslots_overlap_check(1, slot_start, slot_end) IS FALSE THEN cnt := cnt+1; END IF;
       IF tft_timeslots_overlap_check(2, slot_start, slot_end) IS FALSE THEN cnt := cnt+1; END IF;
       IF cnt > 0 THEN
         "start" := slot_start;
         "items" := cnt;
         RETURN NEXT;
       END IF;
     END IF;
   END LOOP;
 END;
 $$ LANGUAGE plpgsql;

-- Запрос для materialized view
--WITH free_slots AS (
--    SELECT start, items
--    FROM tft_free_slots_statistic('2018-10-05')
--    )
--SELECT to_char(start, 'HH24:MI') AS hour_start, sum(items) AS sum FROM free_slots
--GROUP BY hour_start
--ORDER BY sum DESC, hour_start ASC;
