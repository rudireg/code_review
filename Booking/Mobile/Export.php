<?php
namespace takeoff\Booking\Mobile;

/**
 * Class Export
 * @package takeoff\Booking\Mobile
 */
class Export extends \kanri\App\Action
{
	/**
	 * Export constructor.
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
	function Select()
	{
		$params = $this->request->getFields();
		$type  = !empty($params['type'])?  $params['type']  : 'all';
		$start = !empty($params['start'])? $params['start'] : null;
		$items = $this->Export($type, $start);
		return $items;
	}

	function Export($type='all', $start=null)
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
				throw new \Exception('Invalid export type for Mobile scheduler.');
				break;
		}

		$result = array_merge($events, $receptions, $pilots);
		// Set the headers
		header('Content-type: application/json; charset=utf-8');
		echo json_encode($result);
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
		$color = ($job==='pilot')? '#d84315' : '#ffa726';
		$minutes = ($job==='pilot')? '00' : '30';
		$start = $start? : date('Y-m-d');
		$sql = "SELECT concat(st.id, '_$job') AS id,
					   date_trunc('day', st.worktime) + time '09:$minutes' AS start_date, 
					   date_trunc('day', st.worktime) + time '09:$minutes' + interval ' 30 minute' AS end_date, 
					   s.title AS text,
					   '' AS details,
					   '$color' AS color
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
		$filter = ($simulator === null)? '' : ('b.simulator=' . $simulator . ' AND');
		$sql = "SELECT
                    concat(b.id, '_booking') AS id,
                    b.type,
                    b.start AS start_date,
                    b.start + b.duration AS end_date,
                    b.simulator, 
                    b.event_data,
                    concat(
                    	(CASE WHEN b.type = 'school' THEN 'School ' ELSE '' END), 
                    	(CASE WHEN b.type IN ('buffer','maintenance') THEN 'Buffer' ELSE (CASE WHEN b.simulator = 1 THEN 'B737' ELSE 'A320' END) END), 
                    	' - ', 
                    	to_char(b.duration, 'HH24:MI'),
                    	' ',
                    	c.title
                    ) AS text,
                    '' AS details
				FROM bookings b
				LEFT JOIN customers c ON c.id=b.customer AND b.customer IS NOT NULL
				WHERE " . $filter . " 
				b.status IN ('new', 'rebooking', 'technical_rebooking') 
				AND date_trunc('day', b.start) >= date_trunc('day', ?::DATE)
				AND date_trunc('day', b.start) <= date_trunc('day', ?::DATE + interval '10 days') 
				ORDER BY b.start";

		$res = $this->db->selectRows($sql, [$start, $start]);
		$staffInstance = new \takeoff\Staff\Store($this->app);
		foreach ($res as &$item) {
			if (!empty($item['event_data'])) {
				$item['event_data'] = json_decode($item['event_data'], true);
				// Если есть пилоты которых не хотят
				if (!empty($item['event_data']['dont_need_pilot'])) {
					$pilotsIds = explode(',', $item['event_data']['dont_need_pilot']);
					if (!empty($pilotsIds)) {
						foreach ($pilotsIds as $pilotsId) {
							$staff = $staffInstance->getStaffById((int)$pilotsId);
							if ($staff) {
								$item['without_pilots'][] = $staff->title;
							}
						};
					}
				}
			}
			if (!empty($item['without_pilots'])) {
				$item['details'] = "Не хотят пилотов: " . implode(', ', $item['without_pilots']);
			}
		};
		unset($item);

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

	protected $db;
}