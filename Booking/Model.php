<?php
namespace takeoff\Booking;

use kanri\App;
use takeoff\Model\Base;
use takeoff\Products\Voucher\Voucher;

/**
 * Class Model
 * @package takeoff\Booking
 */
class Model extends Base implements IBookingModel
{
	/**
	 * Model constructor.
	 * @param App|NULL $app
	 * @param Db|NULL $storage
	 * @throws \Exception
	 */
	public function __construct(App $app = NULL, Db $storage = NULL) {
		parent::__construct($app);
		$this->storage = $storage? : new Db($this->app);
	}

	/**
	 * Добавить новое бронирование
	 * @param \DateTime|string $start - дата и время начала полета
	 * @param \DateInterval|string $duration - продолжительность полета
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
	 * @throws \Exception
	 */
	public function add(
		$start,
		$duration,
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
		$uid = (int)$this->getUid();
		$start = ($start instanceof \DateTime)? $start:(new \DateTime($start));
		$duration = ($duration instanceof \DateInterval)? $duration:(new \DateInterval($duration));
		return $this->storage->add($uid, $start, $duration, $voucherId, $boardingId, $simulatorId, $customerId, $status, $type,
								   $eventData, $surcharge, $comment, $vip, $vipComment, $pilotId, $preview,
			                       $excursion, $corporative, $child, $school, $customer2, $rebooking, $confirmed);
	}

	/**
	 * Валидация кода ваучера
	 * @param string $code - строка содержит код, ожидается вид: pin-id
	 * @return array - массив из 2-ух элементов, где первый элемент это PIN а второй ID
	 * @throws \Exception
	 */
	public function validateCode(string $code): array
	{
		$code = trim($code);
		if (empty($code)) throw new \Exception('The voucher code is empty for check.', 706);
		if (strpos($code, '-')) {
			list($pin, $id) = explode('-', $code);
		} else {
			$pin = substr($code, 0, 4);
			$id  = substr($code, 4);
		}
		if (!(int)$pin || !(int)$id) throw new \Exception('Не верный код сертификата',706);
		return [$pin, $id];
	}

	/**
	 * Валидация ваучера
	 * @param int $pin - PIN ваучера
	 * @param int $id - ID ваучера
	 * @return bool
	 * @throws \Exception
	 */
	public function validateVoucher(int $pin, int $id): bool
	{
		if (empty($pin) || empty($id)) {$this->_validateCode = self::VOUCHER_INVALID_PIN_ID; return false;}
		$voucher = new Voucher($id);
		if ($voucher->isNull()) {$this->_validateCode = self::VOUCHER_NOT_FOUND; return false;}
		if ($pin !== $voucher->pin) {$this->_validateCode = self::VOUCHER_INVALID_PIN; return false;}
		if (!$voucher->isPaid()) {$this->_validateCode = self::VOUCHER_NOT_PAID; return false;}
		if (!$voucher->isActivated()) {$this->_validateCode = self::VOUCHER_NOT_ACTIVATED; return false;}
		if ($voucher->isDisabled()) {$this->_validateCode = self::VOUCHER_TYPE_DISABLED; return false;}
		if (in_array($voucher->getStatus(), ['new', 'archived', 'refund', 'fail', 'avisoError', 'cancelled', 'checkoutError'])) {
			$this->_validateCode = self::VOUCHER_INVALID_PIN; return false;
		}
		// Если мы тут, значит ваучер валидный, но может иметь ограничения: 1) просрочен 2) уже имеет активное бронирование
		$this->bookingCollection = new Collection($id);
		if ($this->bookingCollection->isHasBooked()) { // уже имеет активное бронирование
			$this->_validateCode = self::VOUCHER_HAS_ACTIVE_BOOKING;
		} elseif (!$voucher->isValidExpire()) { // просрочен
			$this->_validateCode = self::VOUCHER_INVALID_EXPIRE;
		} else {
			$this->_validateCode = self::VOUCHER_OK;
		}
		return true;
	}

	/**
	 * Проверка даты выборки слотов с expire продукта
	 * Успешная выборка слотов если:
	 * 				Expire продукта больше чем дата выборки
	 * Успешная выборка слотов, но с ограничением пролонгации если:
	 * 				Дата выборки старше expire, но не более чем 30 дней
	 * В остальных случаях выборка не действительна.
	 * @param $expire - Expire ваучера
	 * @param $date - Дата выборки
	 * @return int - константа
	 * @throws \Exception
	 */
	public function validateLookUpDate($expire, $date): int
	{
		$expire = !($expire instanceof \DateTime)? new \DateTime($expire) : $expire;
		$date = !($date instanceof \DateTime)? new \DateTime($date) : $date;
		$expire->setTime(0,0,0,0);
		$date->setTime(0,0,0,0);
		$tomorrow = (new \DateTime())->add(new \DateInterval('P1D'))->setTime(0, 0, 0, 0);
		// Если дата поиска меньше чем завтра (разрешается только с завтрашнего дня)
		if ($date < $tomorrow) { return self::LOOK_UP_FAIL; }
		// Если Expire продукта больше искомой даты
		if ($expire >= $date) { return self::LOOK_UP_OK; }
		// Если Expire продукта больше искомой даты не более чем на 30 дней
		$expire->add(new \DateInterval("P30D"));
		if ($this->isPeriodValid($expire, $date)) {	return self::LOOK_UP_LIMITED; }
		return self::LOOK_UP_FAIL;
	}

	/**
	 * Возвращает массив свободных слотов для конткретной даты, конкреткного симулятора и конкретного типа ваучера
	 * @param int $pid - ID типа ваучера
	 * @param int $simulatorId - ID симулятора
	 * @param $date - дата выборки
	 * @return array
	 * @throws \Exception
	 */
	public function getFreeTimeSlots(int $pid, int $simulatorId, $date): array
	{
		$store = new \takeoff\Booking\Store($this->app);
		return $store->getFreeTimeSlots($pid, $simulatorId, $date);
	}

	/**
	 * Выобрка массива свободных time-slot для online бронирования
	 * @param int $pid - ID проудкта
	 * @param int|NULL $simulatorId - ID симулятора
	 * @param string|NULL $dayTime - Дата выборки в формате '2018-10-22'
	 * @param string $startTime - Начало работчего дня ('10 hours')
	 * @param string $endTime - Конец рабочего дня ('22 hours')
	 * @return array
	 * @throws \Exception
	 */
	public function getLowcostFreeTimeSlots(int $pid, int $simulatorId=NULL, string $dayTime=NULL, $startTime='10 hours', $endTime='22 hours'): array
	{
		$voucherInstance = new \takeoff\Booking\Store($this->app);
		$startHour = explode(' ', $startTime)[0];
		$endHour   = explode(' ', $endTime)[0];
		$todaySlots = $tomorrowSlots = [];
		$dayTime = NULL;
		// на сегодня
		$hour = (int)(new \DateTime())->add(new \DateInterval("PT1H"))->format('H'); // Сейчас + 1 час
		if ($hour <= $endHour) {
			$hour .= ($hour > 1)? ' hours' : ' hour';
			$todaySlots[] = $voucherInstance->getFreeTimeSlots($pid, $simulatorId, $dayTime, $hour, $endTime);
		}
		$productInfo = $this->getProductType($pid);
		$endpoint = new \DateTime($productInfo->endpoint);
		$iterator = (new \DateTime())->add(new \DateInterval("P1D"))->setTime($startHour,0,0,0);
		// на завтра
		if ($endpoint > $iterator) {
			$dayTime = $iterator->format('Y-m-d');
			if ($endpoint->format("j") > $iterator->format("j")) {
				$hour = $endHour;
			} else {
				$hour = $endpoint->format("H");
				$hour = ($hour > $endHour)? $endHour:$hour;
			}
			if ($hour > $startHour) {
				$hour .= ($hour > 1)? ' hours' : ' hour';
				$tomorrowSlots[] = $voucherInstance->getFreeTimeSlots($pid, $simulatorId, $dayTime, $startTime, $hour);
			}
		}
		// остальные дни, если период выборки превышает завтрашний день
		$daySlots = [];
		$iterator->add(new \DateInterval("P1D"));
		while ($endpoint > $iterator) {
			$dayTime = $iterator->format('Y-m-d');
			if ($endpoint->format("j") > $iterator->format("j")) {
				$hour = $endHour;
			} else {
				$hour = $endpoint->format("H");
				$hour = ($hour > $endHour)? $endHour:$hour;
			}
			if ($hour > $startHour) {
				$hour .= ($hour > 1)? ' hours' : ' hour';
				$daySlots[$dayTime] = $voucherInstance->getFreeTimeSlots($pid, $simulatorId, $dayTime, $startTime, $hour);
			}
			$iterator->add(new \DateInterval("P1D"));
		};
		$slots = !empty($todaySlots[0])? $todaySlots[0] : [];
		foreach ($slots AS &$slot) {
			$slot['label'] = 'Сегодня';
			$slot['lowcost'] = 1;
		};
		unset($slot);
		if (!empty($tomorrowSlots[0])) {
			foreach ($tomorrowSlots[0] as $val) {
				$val['label'] = 'Завтра';
				$val['lowcost'] = 1;
				$slots[] = $val;
			}
		}
		if (!empty($daySlots)) {
			foreach ($daySlots AS $d=>$vals) {
				foreach ($vals AS $val) {
					$val['label'] = $d;
					$val['lowcost'] = 1;
					$slots[] = $val;
				}
			};
		}
		return $slots;
	}

	/**
	 * Вернуть Код статуса после проверки ваучера на доступность к бронированию
	 * @return int
	 */
	public function getValidateCode(): int {
		return $this->_validateCode;
	}

	/**
	 * Вернуть активную (ожидающую полет) бронь
	 * @return IBooking
	 */
	public function getBookedBook(): IBooking {
		return $this->bookingCollection->getBooked();
	}

	/**
	 * Доступен ли выбор симулятора для тренажерного центра
	 * @return bool
	 */
	public function isAvailableSimulatorSelect(): bool {
		return true;
	}

	/**
	 * Работа с БД
	 * @var Db
	 */
	protected $storage;
	/**
	 * Статус ваучера
	 * @var
	 */
	protected $_validateCode = NULL;
	/**
	 * @var Collection
	 */
	protected $bookingCollection = NULL;

	/**
	 * Коды проверки Expire продукта с датой поиска слотов
	 */
	CONST LOOK_UP_OK = 1;
	CONST LOOK_UP_LIMITED = 2;
	CONST LOOK_UP_FAIL = 3;

	/**
	 * Коды статусов после проверки Booking на доступность к бронированию
	 */
	CONST VOUCHER_INVALID_PIN_ID = 1;
	CONST VOUCHER_NOT_FOUND = 2;
	CONST VOUCHER_INVALID_PIN = 3;
	CONST VOUCHER_NOT_ACTIVE = 4;
	CONST VOUCHER_HAS_ACTIVE_BOOKING = 5;
	CONST VOUCHER_OK = 6;
	CONST VOUCHER_INVALID_EXPIRE = 7;
	CONST VOUCHER_TYPE_DISABLED = 8;
	CONST VOUCHER_NOT_ACTIVATED = 9;
	CONST VOUCHER_NOT_PAID = 10;
}