<?php
namespace takeoff\Products\Voucher;

use kanri\App;
use kanri\PDO\Model;
use takeoff\Logs\Log;
use kanri\ActiveRecord;
use takeoff\Helper\Help;
use takeoff\Products\IProduct;
use kanri\ActiveRecord\Field\Date;

class Voucher extends Model implements IProduct
{
	/**
	 * Voucher constructor.
	 * @param int $id - ID ваучера
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
		$sql = "SELECT v.id,
					   v.pid,
					   v.pin,
					   v.expires,
					   v.status,
					   v.ptype,
					   v.customer,
					   v.sdate,
					   v.sold,
					   v.used,
					   v.comments,
					   v.referrer,
					   v.discount,
					   v.order_id,
					   v.delivery,
					   v.activate_date,
       				   v.printed,	
					   pv.type AS p__type,
					   lang(pv.title, :l) AS p__title,
					   pv.simulator AS p__simulator,
					   pv.expire_duration AS p__expire_duration,
					   pv.discount AS p__discount,
					   pv.price AS p__price,
					   pv.show AS p__show,
					   pv.fly_duration AS p__fly_duration,
					   lang(s.title, :l) AS s__title
 				FROM vouchers v
 				LEFT JOIN products_voucher pv ON v.pid=pv.id
 				LEFT JOIN simulators s ON pv.simulator=s.id
 				WHERE v.id=:id";
		$args['id'] = $id;
		$args['l']  = KANRI_LANG;
		$v = $this->db->selectRows($sql, $args);
		if (empty($v[0])) return NULL;
		$data = $v[0];
		$data['str_expires'] = Help::getStrDate($data['expires']);
		return $data;
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
	 * Возвращает кол-во распечаток ваучера 
	 * @return int
	 */
	public function getPrinted(): int {
		return $this->printed;
	}

	/**
	 * Возвращает ID заказа
	 * @return int
	 */
	public function getOrderId(): int {
		return $this->order_id;
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
	 * Получить длительность услуги
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
		if (empty($format)) return $this->expires;
		return (new \DateTime($this->expires))->format($format);
	}

	/**
	 * @param string $format
	 * @return string
	 * @throws \Exception
	 */
	public function getCreateDate(string $format=''): string {
		if (empty($format)) return $this->sdate;
		return (new \DateTime($this->sdate))->format($format);
	}

	/**
	 * Отметить продукт как оплаченный
	 * @param string $payType - тип платежа (online, cash, etc.)
	 * @return mixed
	 * @throws \Exception
	 */
	public function setPaid(string $payType='online')
	{
		$this->status   = 'paid';
		$this->ptype    = $payType;
		$this->sold     = (new \DateTime())->format("Y-m-d H:i:s");
		$this->save();
		(new Log())->Add($this->getType(), $this->getCustomerId(), $this->getId(), 'paid', ['event'=>'paid', 'ptype'=>$payType]);
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
	 * Возвращает цену товара с учетом скидки если таковая имеется
	 * @return float
	 */
	public function getDiscountPrice(): float {
		$discount = $this->getDiscountValue();
		if (!$discount) return $this->p__price;
		return ($this->p__price / 100) * (100 - $discount);
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
		return $this->customer;
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
	 * Установить статус ваучера как - имеющий бронирование
	 * @return $this
	 */
	public function setBooked(): IProduct {
		$this->status = 'booking';
		return $this;
	}

	/**
	 * Непросрочен ли продукт
	 * @return bool
	 * @throws \Exception
	 */
	public function isValidExpire(): bool {
		return strtotime($this->expires) >= strtotime((new \DateTime())->format('Y-m-d'));
	}

	/**
	 * Активирован ли ваучер по дате
	 * @return bool
	 * @throws \Exception
	 */
	public function isActivated(): bool {
		if ($this->activate_date) {
			return strtotime((new \DateTime())->format('Y-m-d')) >= strtotime($this->activate_date);
		}
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
		$now = new \DateTime();
		$this->expires = $date? $date->format('Y-m-d') : ($now->add(new \DateInterval("P{$this->p__expire_duration}D"))->format('Y-m-d'));
		return $this;
	}

	/**
	 * Установить доставку
	 * @param int|null $deliveryId
	 * @return IProduct
	 */
	public function setDelivery(? int $deliveryId): IProduct {
		$this->delivery = $deliveryId;
		return $this;
	}

	/**
	 * Получить ID доставки
	 * @return int|null
	 */
	public function getDelivery():? int {
		return $this->delivery;
	}

	/**
	 * Установить дату активации
	 * @param \DateTime $activateDate
	 * @return IProduct
	 */
	public function setActivateDate(? \DateTime $activateDate): IProduct {
		$this->activate_date = !$activateDate? NULL : $activateDate->format('Y-m-d');
		return $this;
	}

	/**
	 * Возвращает дату, с которой ваучер считается активным, NULL - если активен изначально.
	 * @param string $format
	 * @return null|string
	 * @throws \Exception
	 */
	public function getActivateDate(string $format = ''): ? string {
		if (empty($format)) return $this->activate_date;
		if (!$this->activate_date) return NULL;
		return (new \DateTime($this->activate_date))->format($format);
	}

	/**
	 * Является ли тип симуляторы выборочным. Может быть: Boeing и Airbus
	 * @return bool
	 */
	public function isSelectable(): bool {
		return $this->getSimulator() === 4;
	}
}