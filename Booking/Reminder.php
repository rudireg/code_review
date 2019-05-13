<?php
namespace takeoff\Booking;
use kanri\PDO\Exception;
use \kanri\PDO\Pgsql\Type\Money;
use \kanri\ActiveRecord\Field;

class Reminder extends \kanri\App\Action {
	use \takeoff\Customers\tShared;

	function __construct(\kanri\App $app) {
		parent::__construct($app);
		$this->db = $app->pdo();
		$this->table = 'bookings_reminders';
	}

	/**
	 * Выборка напоминаний.
	 * @param $date - С какой даты делать выборку (включительно)
	 * @param $count - Период кол-ва дней для выборки
	 * @return array список напоминаний
	 */
	function Select($date, $count)
	{
		$date = date('Y-m-d', strtotime($date));
		$interval = date('Y-m-d', strtotime($date. ' + ' . $count . ' days'));
		$sql = "SELECT 
					br.id,
					br.id AS notice_id,
					br.uid,
					br.start,
					br.customer,
					br.customer2,
					br.booking,
					br.simulator,
					br.voucher,
					br.admin_duration,
					br.confirmed,
					br.comment,
					CASE WHEN br.name IS NOT NULL THEN br.name ELSE c.title END AS fio,
					-- br.name as fio,
					c.email,
					c.phone,
					v.status,
					v.pin,
					pv.fly_duration AS duration,
					(SELECT name FROM simulators WHERE id=br.simulator) AS simulator_name
				FROM bookings_reminders br
				LEFT JOIN customers c ON br.customer = c.id AND br.customer IS NOT NULL
				LEFT JOIN vouchers v ON br.voucher = v.id
				LEFT JOIN products_voucher pv ON pv.id = v.pid
				WHERE br.start >=? AND br.start <?";

		return $this->db->selectRows($sql, [$date, $interval]);
	}

	/**
	 * Добавить новое напоминание
	 * @param $start - Дата напоминания
	 * @param $customer - идентификатор клиента
	 * @param null $customer2 - идентификатор дополнительного контактного лица
	 * @param int $simulator - тип симулятора (1-боинг, 2-аэрбас, 4-боинг или аэрбас)
	 * @param null $booking - идентификатор бронирования клиента
	 * @param null $voucher - идентификатор сертификата, по которому осуществляется бронирование
	 * @param null $admin_duration - Время длительности полета (задается администратором либо автоматически. Если администратором то оно может не совпадать с временм длительности на сертификате)
	 * @param string $comment - примечание администратора
	 * @param bool $confirmed - //todo: в будущем может пригодиться
	 * @param string $name - Имя (Передается если создается запись без ID сертификата)
	 * @param string $phone - Телефон (Передается если создается запись без ID сертификата)
	 * @param string $email - Email (Передается если создается запись без ID сертификата)
	 * @return int
	 * @throws \Exception
	 */
	function Add($start, $customer = null, $simulator = null, $customer2 = null, $booking = null, $voucher = null,
				 $admin_duration = null, $comment = '', $confirmed = false, $name = null, $phone = null, $email = null
	){
		// Если задан телефон, значит создается запись без ID сертификата.
		// Получаем customer по номеру телефона, если его нет, то создаем.
		if ($customer === null && ($phone !== null || $email !== null)) {
			$customer = $this->getCustomerIdByPhone($phone, $name, $email);
		}
		$uid = $this->app->user()->uid(); // Идентификатор администратора создавший напоминание
		$sql = "INSERT INTO bookings_reminders
				(uid, start, name, customer, customer2, simulator, booking, voucher, admin_duration, comment, confirmed) 
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?::INTERVAL, ?, ?)";

		try {
			$lastId = $this->db->insert($sql, [
				$uid,
				$start,
				$name,
				$customer,
				$customer2,
				$simulator,
				$booking,
				$voucher,
				$admin_duration,
				$comment,
				$confirmed
			], 'bookings_reminders');
		} catch (\Exception $e) {
			$msg = $e->getMessage();
			if (false !== strpos($msg, 'bookings_reminders_customer_start_uindex')) {
				throw new \Exception('The reminder already exists.', 705);
			}
			throw new \Exception($e->getMessage(), 500);
		}
		return $lastId;
	}

	/**
	 * Удалить запись
	 * @param $id - ID записи
	 * @return bool
	 */
	function Delete($id)
	{
		if (empty($id) || !is_numeric($id)) {
			return false;
		}
		try {
			$this->db->execute('DELETE FROM bookings_reminders WHERE id=?', [$id]);
		} catch (\Exception $e) {
			return false;
		}
		return true;
	}

	/**
	 * Обновить напоминание
	 * @param $data
	 * @return bool
	 */
	function Update($data)
	{
		if (empty($data)) return false;
		$data = json_decode($data, true);
		if (empty($data['id'])) return false;
		$id = $data['id'];
		unset($data['id']);
		if (empty($data)) return false;
		$sql = "UPDATE {$this->table} SET ";
		foreach ($data AS $key => $val) {
			$sql .= " $key =? ";
		};
		$sql .= " WHERE id=?";
		$data = array_values($data);
		$data[] = $id;
		try {
			$this->db->execute($sql, $data);
		} catch (\Exception $e) {
			return false;
		}
		return true;
	}

	protected $db, $table, $idSeqName;

}