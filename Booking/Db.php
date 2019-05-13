<?php
namespace takeoff\Booking;

use kanri\App;

/**
 * Class Db
 * @package takeoff\Booking
 */
class Db extends \kanri\PDO\Db
{
	/**
	 * Db constructor.
	 * @param App|null $app
	 */
	public function __construct(App $app = NULL) {
		parent::__construct($app);
	}

	/**
	 * Получить массив ID бронирований, относящиеся к переданному по ID ваучеру
	 * @param int $id - ID ваучера
	 * @return array - массив ID бронирований
	 */
	public function getBookingIdsByVoucherId(int $id): array {
		return $this->db->selectList("SELECT id FROM bookings WHERE voucher=?", [$id]);
	}

	/**
	 * Добавить новое бронирование
	 * @param int $uid
	 * @param \DateTime $start - дата и время начала полета
	 * @param \DateInterval $duration - продолжительность полета
	 * @param int|NULL $voucherId - ID ваучера
	 * @param int|NULL $boardingId - ID посадочного талона
	 * @param int $simulatorId - ID симулятора
	 * @param int $customerId - ID покупателя
	 * @param string $status - статус бронирования (new, rebooking, etc.)
	 * @param string $type - тип бронирования (flight, buffer, etc.)
	 * @param array $eventData - доп. данные к бронированию
	 * @param int $surcharge - сигнал о доплате (сумма)
	 * @param string $comment - комментарий к бронированию
	 * @param bool $vip - флаг VIP пользователя
	 * @param string $vipComment - комментарий к VIP пользователю
	 * @param int|NULL $pilotId - ID пилота
	 * @param int|NULL $preview - указатель но прошлый ID бронирования
	 * @param int|NULL $excursion - указатель экскурсии
	 * @param int|NULL $corporative - указатель корпоратива
	 * @param int|NULL $child - указатель детского праздника
	 * @param int|NULL $school - указатель школы пилотов
	 * @param int|NULL $customer2 - ID добавочного контакта
	 * @param int|NULL $rebooking - перенос брони на новое время
	 * @param bool $confirmed - флаг "подтверждено" (устанавливается администратором e.g. при бронировании с сайта)
	 * @return int
	 */
	public function add(
		int $uid,
		\DateTime $start,
		\DateInterval $duration,
		? int $voucherId,
		? int $boardingId,
		int $simulatorId,
		int $customerId,
		string $status,
		string $type='flight',
		array $eventData=[],
		int $surcharge=0,
		string $comment='',
		bool $vip=false,
		string $vipComment='',
		int $pilotId=NULL,
		int $preview=NULL,
		int $excursion=NULL,
		int $corporative=NULL,
		int $child=NULL,
		int $school=NULL,
		int $customer2=NULL,
		int $rebooking=NULL,
		bool $confirmed=false
	): int {
		$uid = !empty($uid)?$uid:NULL;
		$start = $start->format('Y-m-d H:i');
		$duration = $this->dateIntervalToSql($duration);

		$sql = "INSERT INTO bookings 
				(uid, start, duration, voucher, boarding, simulator, customer, status, type, event_data, surcharge, comment, vip, vip_comment, pilot, preview,
				 excursion, corporative, child, school, customer2, rebooking, confirmed) 
				VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
		$arg = [$uid, $start, $duration, $voucherId, $boardingId, $simulatorId, $customerId, $status, $type, json_encode($eventData), $surcharge, $comment, $vip,
			$vipComment, $pilotId, $preview, $excursion, $corporative, $child, $school, $customer2, $rebooking, $confirmed];
		return $this->db->insert($sql, $arg, 'bookings');
	}
}