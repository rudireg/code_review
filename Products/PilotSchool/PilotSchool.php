<?php
namespace takeoff\Products\PilotSchool;

use kanri\App;
use kanri\PDO\Model;
use kanri\ActiveRecord;
use takeoff\Products\IProduct;
use kanri\ActiveRecord\Field\Date;

/**
 * Class PilotSchool
 * @package takeoff\Products\PilotSchool
 */
class PilotSchool  extends Model implements IProduct
{
	/**
	 * PilotSchool constructor.
	 * @param int $id
	 * @param ActiveRecord|NULL $ar
	 * @param array|NULL $args
	 * @param App|NULL $app
	 */
	public function __construct(int $id, ActiveRecord $ar = NULL, array $args = NULL, App $app = NULL)
	{
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
		$sql = "SELECT ps.id,
					   ps.pid,
					   ps.customer_id,
					   ps.status,
					   ps.booking_ids,
					   ps.theory_ids,
					   ps.start_date,
					   ps.simulator,
					   ps.customer_comment,
					   ps.admin_comment,
					   ps.order_id,
					   ps.data,
					   ps.price,
					   ps.discount,
					   ps.sold,
					   ps.used,
					   ps.referrer,
					   ps.delivery_id,
					   ps.last_modified,
					   ps.created,
					   lang(psc.title, :l) AS p__title,
					   lang(psc.descr, :l) AS p__descr,
       				   psc.program AS p__program,
					   psc.type AS p__type,
					   psc.price AS p__price,
					   psc.show AS p__show,
					   psc.discount AS p__discount,
					   lang(s.title, :l) AS s__title
 				FROM pilot_schools ps
 				LEFT JOIN products_school psc ON ps.pid=psc.id
 				LEFT JOIN simulators s ON ps.simulator=s.id
 				WHERE ps.id=:id";

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
	 * Получить ID ваучера
	 * @return int
	 */
	public function getId(): int {
		return $this->id;
	}

	/**
	 * Возвращает тип программы обучения
	 * @return string
	 */
	public function getProgram(): string {
		return $this->p__program;
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
	 * Проверка оплачен ли продукт
	 * @return bool
	 */
	public function isPaid(): bool {
		return $this->sold !== NULL;
	}

	/**
	 * Возвращает тип проудкта
	 * @return string
	 */
	public function getType(): string {
		return $this->p__type;
	}

	/**
	 * Получить статус продукта
	 * @return string
	 */
	public function getStatus(): string {
		return $this->status;
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
	 * Возвращает ID симулятора
	 * @return int
	 */
	public function getSimulator(): int {
		return $this->simulator;
	}

	/**
	 * Возвращает КОД продукта (PIN-ID)
	 * @return string
	 */
	public function getCode(): string {
		return $this->id;
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
	 * @param string $format
	 * @return string
	 * @throws \Exception
	 */
	public function getCreateDate(string $format=''): string {
		if (empty($format)) return $this->created;
		return (new \DateTime($this->created))->format($format);
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
	 * Установить статус, при котором заказ считается оплаченым, а слот забронирован
	 * @return IProduct
	 */
	public function setBooked(): IProduct {
		$this->status = 'booked';
		return $this;
	}

	/**
	 * Возвращает title типа продукта
	 * @return string
	 */
	public function getTypeTitle():string {
		return $this->p__title;
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
	 * Активирован ли ваучер по дате
	 * @return bool
	 * @throws \Exception
	 */
	public function isActivated(): bool {
		return true;
	}

	/**
	 * Возвращает ID покупателя
	 * @return int
	 */
	public function getCustomerId(): int {
		return $this->customer_id;
	}

	/**
	 * Активирован ли тип продукта
	 * @return bool
	 */
	public function isDisabled(): bool {
		return !$this->p__show;
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
	 * Возвращает срок действия expire
	 * @param string $format - формат, в котором следует вернуть значение
	 * @return string
	 * @throws \Exception
	 */
	public function getExpire(string $format=''): string {
		return '';
	}

	/**
	 * Получить длительность услуги в строковом человеко-подобном формате
	 * @return string
	 */
	public function getDuration(): string {
		return '';
	}

	/**
	 * Возвращает ID заказа
	 * @return int
	 */
	public function getOrderId(): int {
		return $this->order_id;
	}

	/**
	 * Возвращает цену продукта
	 * @return float
	 */
	public function getPrice(): float {
		return $this->p__price;
	}

	/**
	 * Отметить продукт как оплаченный
	 * @param string $payType - тип платежа (online, cash, etc.)
	 * @return mixed
	 * @throws \Exception
	 */
	public function setPaid(string $payType='online')
	{
		$this->sold = (new \DateTime())->format("Y-m-d H:i:s");
		return $this;
	}

	/**
	 * Возвращает PIN ваучера
	 * @return string
	 */
	public function getPin(): string {
		return '';
	}

	/**
	 * Возвращает ID типа проудкта
	 * @return int
	 */
	public function getPid(): int {
		return $this->pid;
	}
}