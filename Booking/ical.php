<?php
namespace takeoff\Booking;

/**
 * Class Ical
 * @package takeoff\Ical
 */
class ical extends \kanri\App\Action
{
	const EOL = "\r\n";

	/**
	 * Ical constructor.
	 * @param \kanri\App $app
	 */
	function __construct(\kanri\App $app)
	{
		parent::__construct($app);
		$this->db = $app->pdo();
	}

	/**
	 * Точка входа с NGINX
	 */
	function API_Webhook()
	{
		$params = $this->request->getFields();
		$this->Export(
			!empty($params['type'])?  $params['type']  : 'all',
			!empty($params['start'])? $params['start'] : null
		);
	}

	/**
	 * Экспорт календаря в формате Ical
	 * @param $type - Тип данных календаря: (возможные значения: a320, b737, staff, all)
	 * @param null $start - День начала выборки (включительно). Если NULL - за основу берется текущая дата.
	 * @return string
	 * @throws \Exception
	 */
	function Export($type, $start = null)
	{
		$events = $pilots = $receptions = [];
		$type = strtolower($type);
		switch ($type) {
			case 'all':
				// Получаем расписание полетов
				$events = $this->getBookingEvents($start);
				// Получаем расписание работы пилотов
				$pilots = $this->getWorkerScheduler('pilot', $start);
				// Получаем расписание работы администраторов
				$receptions = $this->getWorkerScheduler('reception', $start);
				break;
			case 'b737':
				// Получаем расписание полетов для B737
				$events = $this->getBookingEvents($start, 1);
				break;
			case 'a320':
				// Получаем расписание полетов для A320
				$events = $this->getBookingEvents($start, 2);
				break;
			case 'staff':
				// Получаем расписание работы пилотов
				$pilots = $this->getWorkerScheduler('pilot', $start);
				// Получаем расписание работы администраторов
				$receptions = $this->getWorkerScheduler('reception', $start);
				break;
			default:
				throw new \Exception('Invalid export type for ICAL.');
				break;
		}

		// HEADER календаря
		$body = "BEGIN:VCALENDAR" . self::EOL .
				"VERSION:2.0" . self::EOL .
				"PRODID:-//Google Inc//Google Calendar 70.9054//EN" . self::EOL .
				"CALSCALE:GREGORIAN" . self::EOL .
				"METHOD:PUBLISH" . self::EOL .
				"X-WR-CALNAME:Booking" . self::EOL;
//				"X-WR-TIMEZONE:Europe/Moscow" . self::EOL .
//				"BEGIN:VTIMEZONE" . self::EOL .
//				"TZID:Europe/Moscow" . self::EOL .
//				"X-LIC-LOCATION:Europe/Moscow" . self::EOL .
//				"BEGIN:STANDARD" . self::EOL .
//				"TZOFFSETFROM:+0300" . self::EOL .
//				"TZOFFSETTO:+0300" . self::EOL .
//				"TZNAME:MSK" . self::EOL .
//				"DTSTART:19700101T000000" . self::EOL .
//				"END:STANDARD" . self::EOL .
//				"END:VTIMEZONE" . self::EOL;

		// Pilots
		foreach ($pilots as $pilot) {
			$body .=
				"BEGIN:VEVENT" . self::EOL .
				"DTSTART;VALUE=DATE:" . $pilot['dtstart'] . self::EOL .
				"DTEND;VALUE=DATE:" . $pilot['dtstart'] . self::EOL .
				"DTSTAMP:" . $this->dateToCal($pilot['worktime']) . self::EOL .
				"UID:" . md5($pilot['worktime']) . 'pilot@tft.aero' . self::EOL .
				"DESCRIPTION:111" . self::EOL .
				"LOCATION:" . self::EOL .
				"CREATED:" . $this->dateToCal(time()) . self::EOL .
				"SUMMARY:Pilot " . substr(htmlspecialchars($pilot['fio']), 0, 60) . self::EOL .
				"END:VEVENT" . self::EOL;
		};

		// Reception
		foreach ($receptions as $reception) {
			$body .=
				"BEGIN:VEVENT" . self::EOL .
				"DTSTART;VALUE=DATE:" . $reception['dtstart'] . self::EOL .
				"DTEND;VALUE=DATE:" . $reception['dtstart'] . self::EOL .
				"DTSTAMP:" . $this->dateToCal($reception['worktime']) . self::EOL .
				"UID:" . md5($reception['worktime']) . 'reception@tft.aero' . self::EOL .
				"DESCRIPTION:222" . self::EOL .
				"LOCATION:" . self::EOL .
				"CREATED:" . $this->dateToCal(time()) . self::EOL .
				"SUMMARY:Admin " . substr(htmlspecialchars($reception['fio']), 0, 60) . self::EOL .
				"END:VEVENT" . self::EOL;
		};

		// Events
		foreach ($events as $event) {
			switch ($event['type']) {
				case 'buffer':
					$simulatorName = 'Буфер ' . $this->getNameSim($event['simulator']);
					break;
				case 'maintenance':
					$simulatorName = 'ТО ' . $this->getNameSim($event['simulator']);
					break;
				default:
					$simulatorName = $this->getNameSim($event['simulator']);
					break;
			}
			$body .=
				"BEGIN:VEVENT" . self::EOL .
				"DTSTART:" . $this->dateToCal($event['start']) . self::EOL .
				"DTEND:" . $this->dateToCal($event['finish']) . self::EOL .
				"DTSTAMP:" . $this->dateToCal($event['start']) . self::EOL .
				"UID:" . $event['id'] . '@tft.aero' . self::EOL .
				"DESCRIPTION:" . $event['comment'] . self::EOL .
				"LOCATION:" . self::EOL .
				"CREATED:" . $this->dateToCal(time()) . self::EOL .
				"SUMMARY: " . $simulatorName . " - " . $event['shot_duration'] . self::EOL .
				"END:VEVENT" . self::EOL;
		};

		// FOOTER календаря
		$body .= "END:VCALENDAR";

		// Set the headers
		header('Content-type: text/calendar; charset=utf-8');
		header('Content-Disposition: attachment; filename=calendar.ics');
		echo $body;
		exit;
	}

	/**
	 * Выбрать дни работы сотрудников
	 * @param null $job - Тип сотрудника (возможные значения: pilot, reception)
	 * @param null $start - Дата начала выборки (включительно)
	 * @return array
	 */
	protected function getWorkerScheduler($job = null, $start = null)
	{
		$job = $job? : 'pilot';
		$start = $start? : date('Y-m-d');
		$sql = "SELECT st.worktime, 
					   to_char(st.worktime, 'YYYYMMDD') AS dtstart,
					   st.duration, 
					   st.comment,
					   s.title AS fio
				FROM staff_timesheet st
				INNER JOIN staff s ON st.uid = s.id 
				WHERE date_trunc('day', st.worktime) >= date_trunc('day', ?::DATE)
					  AND s.job = ?::STAFFJOB
				ORDER BY st.worktime";

		return $this->db->selectRows($sql, [$start, $job]);
	}

	/**
	 * Выбрать ВСЕ события календаря начиная с даты $start
	 * @param null $simulator - Тип симулятора (возможные значения: 1,2)
	 * @param null $start - Дата начала выборки (включительно)
	 * @return array
	 */
	protected function getBookingEvents($start = null, $simulator = null)
	{
		$start = $start? : date('Y-m-d');
		$filter = ($simulator === null)? '' : ('simulator=' . $simulator . ' AND');
		$sql = "SELECT *, 
					to_char(duration, 'HH24:MI') AS shot_duration, 
					start + duration AS finish
				FROM bookings
				WHERE " . $filter . " 
				status IN ('new', 'rebooking', 'technical_rebooking') 
				AND date_trunc('day', start) >= date_trunc('day', ?::DATE)
				AND date_trunc('day', start) <= date_trunc('day', ?::DATE + interval '10 days') 
				ORDER BY start";

		$res = $this->db->selectRows($sql, [$start, $start]);
		return $res;
	}

	/**
	 * Вернуть текстовое представление симулятора
	 * @param $simulator
	 * @return string
	 */
	protected function getNameSim($simulator)
	{
		switch ($simulator) {
			case 1:
				return 'B737';
				break;
			case 2:
				return 'A320';
				break;
			default:
				return 'A&B';
		}
	}

	protected function dateToCal($timestamp) {
		return gmdate('Ymd\THis\Z', strtotime($timestamp));
	}

	protected function escapeString($string) {
		return preg_replace('/([\,;])/','\\\$1', $string);
	}

	protected $db;
}