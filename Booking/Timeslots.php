<?php
namespace takeoff\Booking;
use \kanri\PDO\Pgsql\Type\Money;
use \kanri\ActiveRecord\Field;

class Timeslots extends \kanri\App\Action {
	function __construct(\kanri\App $app) {
		parent::__construct($app);
		$this->db = $app->pdo();
	}
	/**
	 * Выборка таймслотов.
	 * @return PDOStatement список таймслотов
	 */
	function Select() {
		$sql = "SELECT pv.id AS id, lang(pv.title)||' '||lang(s.title) AS value
				FROM products_voucher pv, simulators s
				WHERE pv.simulator = s.id AND pv.show
				ORDER BY pv.simulator, CURRENT_TIMESTAMP + pv.fly_duration";
		return $this->db->selectRows($sql);
	}

	/**
	 * Получить события
	 * @param $date - Дата
	 * @param $simulator - тип симулятора
	 * @return array
	 */
	function getBusySlots($date, $simulator)
	{
		$sql = "SELECT 
					id,
					start,
					duration
				FROM bookings
				WHERE date_trunc('day', start) = date_trunc('day', ?::DATE)
				AND	simulator = ?
				AND status <> 'archive'::BOOKINGSTATUS";

		return $this->db->selectRows($sql, [$date, $simulator]);
	}
}