<?php
namespace takeoff\Products\Boarding;

use kanri\App;
use kanri\PDO\Model;
use takeoff\Logs\Log;
use kanri\ActiveRecord;
use takeoff\Helper\Help;
use takeoff\Products\IProduct;
use kanri\ActiveRecord\Field\Date;

/**
 * Class Boarding
 * @package takeoff\Products\Boarding
 */
class Boarding extends Model implements IProduct
{
	/**
	 * Boarding constructor.
	 * @param int $id - ID талона
	 * @param ActiveRecord|null $ar - Объект Active Record
	 * @param array $args - Список аргуметов
	 * @param App|null $app
	 */
	public function __construct(int $id, ActiveRecord $ar = NULL, array $args = [], App $app = NULL) {
		$this->app = $app ?? App::getInstance();
		$ar = $ar ?: new Entity($this->app->pdo(), $id);
		parent::__construct($id, $ar, $args, $this->app);
	}

	/**
	 * Выборка объекта из БД
	 * @param int $id - ID объекта
	 * @param array|null $args - хэш аргументов
	 * @return array|null
	 * @throws \Exception
	 */
	protected function query(int $id, ?array $args): ?array
	{
		$sql = "SELECT b.id,
					   b.pin,
					   b.pid,
					   b.customer_id,
					   b.status,
					   b.booking_id,
					   b.old_booking_id,
					   b.flight_start,
					   b.restart,
					   b.customer_comment,
					   b.admin_comment,
					   b.order_id,
					   b.need_pay_order_id,
					   b.voucher_id,
					   b.data,
					   b.price,
					   b.price_category,
					   b.discount,
					   b.sold,
					   b.used,
					   b.referrer,
					   b.delivery_id,
					   b.last_modified,
					   b.created,
					   pb.type AS p__type,
					   lang(pb.title, :l) AS p__title,
					   pb.simulator AS p__simulator,
					   pb.discount AS p__discount,
					   pb.price AS p__price,
					   pb.show AS p__show,
					   pb.fly_duration AS p__fly_duration,
					   lang(s.title, :l) AS s__title
 				FROM boardings b
 				LEFT JOIN products_boarding pb ON b.pid=pb.id
 				LEFT JOIN simulators s ON pb.simulator=s.id
 				WHERE b.id=:id";

		$rv = $this->db->selectRows($sql, ['id'=>$id, 'l'=>KANRI_LANG]);
		return !empty($rv[0])? $rv[0] : NULL;
	}

	/**
	 * Сохранить состояние объекта в БД
	 * @return int
	 */
	public function save(): int {
		return $this->ar->save();
	}

	/**
	 * Возвращает PIN ваучера
	 * @return string
	 */
	public function getPin(): string {
		return $this->pin;
	}

	/**
	 * Получить ID ваучера
	 * @return int
	 */
	public function getId(): int {
		return $this->id;
	}

	/**
	 * Возвращает ID заказа
	 * @return int
	 */
	public function getOrderId(): int {
		return $this->order_id;
	}

	/**
	 * Установить ID бронирования
	 * @param int $bookingId - ID бронирования
	 * @return Boarding
	 */
	public function setBookingId(int $bookingId): self {
		$this->booking_id = $bookingId;
		return $this;
	}

	/**
	 * Возвращает ID бронирования (если таковой есть)
	 * @return int|null
	 */
	public function getBookingId():? int {
		return $this->booking_id;
	}

	/**
	 * Возвращает ID типа проудкта
	 * @return int
	 */
	public function getPid(): int {
		return $this->pid;
	}

	/**
	 * Получить статус продукта
	 * @return string
	 */
	public function getStatus(): string {
		return $this->status;
	}

	/**
	 * Установить статус, при котором заказ оплачен, но талон на полет не имеет бронирования
	 * @return Boarding
	 */
	public function setBookedFail(): self {
		$this->status = 'booked_fail';
		return $this;
	}

	/**
	 * Установить статус, при котором заказ считается оплаченым, а слот забронирован
	 * @return Boarding
	 */
	public function setBooked(): IProduct {
		$this->status = 'booked';
		return $this;
	}

	/**
	 * Возвращает комментарий покупателя
	 * @return string
	 */
	public function getCustomerComment(): string {
		return $this->customer_comment? :'';
	}

	/**
	 * Возвращает комментарий администратора
	 * @return string
	 */
	public function getAdminComment(): string {
		return $this->admin_comment? :'';
	}

	/**
	 * Получить длительность услуги в строковом человеко-подобном формате
	 * @return string
	 */
	public function getDuration(): string {
		return $this->getTypeTitle();
	}

	/**
	 * Возвращает срок действия expire
	 * @param string $format - формат, в котором следует вернуть значение
	 * @return string
	 * @throws \Exception
	 */
	public function getExpire(string $format=''): string {
		return '';
	}

	/**
	 * @param string $format
	 * @return string
	 * @throws \Exception
	 */
	public function getCreateDate(string $format=''): string {
		if (empty($format)) return $this->created;
		return (new \DateTime($this->created))->format($format);
	}

	/**
	 * Отметить продукт как оплаченный
	 * @param string $payType - тип платежа (online, cash, etc.)
	 * @return mixed
	 * @throws \Exception
	 */
	public function setPaid(string $payType='online')
	{
		$this->sold   = (new \DateTime())->format("Y-m-d H:i:s");
		$this->clearNeedOrderPay()->save(); // Очищает флаг о том, что заказ должен быть оплачен
		// пытаемся забронирвоать слот
		$mBoarding= \takeoff\Model\Base::objectFactory('boarding');
		$bookingId = $mBoarding->tryBook($this);
		if ($bookingId) {
			$this->setBookingId($bookingId) // Инициализируем талон бронью
				->setBooked()
				->save();
		} else {
			$this->setBookedFail()->save();
		}
		return $this;
	}

	/**
	 * Устанавливает ID заказа, который должен быть оплачен
	 * @param int $orderId - ID заказа
	 * @return Boarding
	 */
	public function setNeedOrderPay(int $orderId): self {
		$this->need_pay_order_id = $orderId;
		return $this;
	}

	/**
	 * Очищает флаг о том, что заказ должен быть оплачен
	 * @return Boarding
	 */
	public function clearNeedOrderPay(): self {
		$this->need_pay_order_id = NULL;
		return $this;
	}

	/**
	 * Возвращает цену продукта
	 * @return float
	 */
	public function getPrice(): float {
		return $this->p__price;
	}

	/**
	 * Устанавливает ценовую категорию
	 * @param string $category - ценовая категория (тип в БД: PRICE_CATEGORY)
	 * @return Boarding
	 */
	public function setPriceCategory(string $category): self {
		$this->price_category = $category;
		return $this;
	}

	/**
	 * Устанавливает дату и время начала полета
	 * @param \DateTime $date - Дата и время начала полета
	 * @return Boarding
	 */
	public function setFlightStart(\DateTime $date): self {
		$this->flight_start = $date->format('Y-m-d H:i:s');
		return $this;
	}

	/**
	 * Возвращает дату и время начала полета
	 * @return \DateTime|null
	 * @throws \Exception
	 */
	public function getFlightStart():? \DateTime {
		return new \DateTime($this->flight_start);
	}

	/**
	 * Возвращает цену товара с учетом скидки если таковая имеется
	 * Если скидка положительное число, то цена будет уменьшено на заданное число процентов
	 * Если скидка отрицательное число, то цена будет увеличина на заданное число процентов
	 * @return float
	 */
	public function getDiscountPrice(): float {
		$discount = $this->getDiscountValue();
		if (!$discount) return $this->p__price;
		if ($discount > 0) {
			return ($this->p__price / 100) * (100 - $discount);
		}
		return ($this->p__price / 100) * (100 + abs($discount));
	}

	/**
	 * Возвращает размер скидки %
	 * @return float|null
	 */
	public function getDiscountValue(): ? float {
		return $this->discount;
	}

	/**
	 * Возвращает ID покупателя
	 * @return int
	 */
	public function getCustomerId(): int {
		return $this->customer_id;
	}

	/**
	 * Возвращает тип проудкта
	 * @return string
	 */
	public function getType(): string {
		return $this->p__type;
	}

	/**
	 * Возвращает ID симулятора
	 * @return int
	 */
	public function getSimulator(): int {
		return $this->p__simulator;
	}

	/**
	 * Возвращает title типа продукта
	 * @return string
	 */
	public function getTypeTitle():string {
		return $this->p__title;
	}

	/**
	 * Возвращает КОД продукта (PIN-ID)
	 * @return string
	 */
	public function getCode(): string {
		return $this->pin . '-' . $this->id;
	}

	/**
	 * Получить длительность полета
	 * @return \DateInterval
	 * @throws \Exception
	 */
	public function getFlyDuration(): \DateInterval {
		list ($hours, $minutes, $seconds) = explode(':', $this->p__fly_duration);
		$interval = new \DateInterval("PT{$hours}H{$minutes}M{$seconds}S");
		return $interval;
	}

	/**
	 * Устновить новый Order Id
	 * @param int $orderId - новый Order ID
	 * @return IProduct
	 */
	public function setOrderId(int $orderId): IProduct {
		$this->order_id = $orderId;
		return $this;
	}

	/**
	 * Проверка оплачен ли продукт
	 * @return bool
	 */
	public function isPaid(): bool {
		return $this->sold !== NULL;
	}

	/**
	 * Непросрочен ли продукт
	 * @return bool
	 * @throws \Exception
	 */
	public function isValidExpire(): bool {
		return true;
	}

	/**
	 * Активирован ли ваучер по дате
	 * @return bool
	 * @throws \Exception
	 */
	public function isActivated(): bool {
		return true;
	}

	/**
	 * Активирован ли тип продукта
	 * @return bool
	 */
	public function isDisabled(): bool {
		return !$this->p__show;
	}

	/**
	 * Установить новый Expire, либо обновить существующий
	 * @param \DateTime|NULL $date - новая дата expire
	 * @return IProduct
	 * @throws \Exception
	 */
	public function updateExpire(\DateTime $date=NULL): IProduct {
		return $this;
	}

	/**
	 * Установить доставку
	 * @param int|null $deliveryId
	 * @return IProduct
	 */
	public function setDelivery(? int $deliveryId): IProduct {
		$this->delivery_id = $deliveryId;
		return $this;
	}

	/**
	 * Получить ID доставки
	 * @return int|null
	 */
	public function getDelivery():? int {
		return $this->delivery_id;
	}

	/**
	 * Установить дату активации
	 * @param \DateTime $activateDate
	 * @return IProduct
	 */
	public function setActivateDate(? \DateTime $activateDate): IProduct {
		return $this;
	}

	/**
	 * Является ли тип симуляторы выборочным. Может быть: Boeing и Airbus
	 * @return bool
	 */
	public function isSelectable(): bool {
		return $this->getSimulator() === 4;
	}
}