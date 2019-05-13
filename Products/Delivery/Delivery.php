<?php
namespace takeoff\Products\Delivery;

use kanri\App;
use kanri\PDO\Model;
use kanri\ActiveRecord;
use takeoff\Products\IProduct;

/**
 * Class Delivery
 * @package takeoff\Products\Delivery
 */
class Delivery extends Model implements IProduct
{
	/**
	 * Delivery constructor.
	 * @param int $id - ID заказа
	 * @param ActiveRecord $ar
	 * @param null $args
	 * @param null $app
	 */
	public function __construct($id, ActiveRecord $ar=NULL, $args=NULL, $app=NULL) {
		$this->app = $app ?? App::getInstance();
		$ar = $ar ?: new Entity($this->app->pdo(), $id);
		parent::__construct($id, $ar, $args, $this->app);
	}

	/**
	 * Отметить продукт как оплаченный
	 * @param string $payType - тип платежа (online, cash, etc.)
	 * @return mixed
	 */
	public function setPaid(string $payType='online') {return true;}

	/**
	 * Обработать новую доставку
	 * @return mixed
	 */
	public function processNewDelivery() {return true;}

	/**
	 * Выборка объекта из БД
	 * @param int $id - ID доставки
	 * @param array|null $args - список аргументов
	 * @return array|null
	 */
	protected function query(int $id, ?array $args): ?array
	{
		$sql = "SELECT 
					d.id,
					d.pid,
					d.order_id,
					d.customer,
					d.address,
       				d.status,
					d.comments,
					d.comments_admin,
					pd.type AS p__type,
					lang(pd.title, :l) AS p__title,
					pd.price AS p__price
 				FROM deliveries d,
 				products_delivery pd
 				WHERE d.id = :id AND d.pid=pd.id";
		$args['id'] = $id;
		$args['l'] = KANRI_LANG;
		$v = $this->db->selectRows($sql, $args);
		return $v[0] ?? NULL;
	}

	/**
	 * Сохранить состояние объекта в БД
	 * @return int
	 */
	public function save(): int {
		return $this->ar->save();
	}

	/**
	 * Возвращает ID доставки
	 * @return int
	 */
	public function getId(): int {
		return $this->id;
	}

	/**
	 * Возвращает PIN ваучера
	 * @return string
	 */
	public function getPin(): string {
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
		return '';
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
		return '';
	}

	/**
	 * Получить цену
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
		return $this->p__price;
	}

	/**
	 * Возвращает размер скидки %
	 * @return float|null
	 */
	public function getDiscountValue(): ? float {
		return 0;
	}

	/**
	 * Возвращает тип проудкта
	 * @return string
	 */
	public function getType(): string {
		return $this->p__type;
	}

	/**
	 * Возвращает title типа продукта
	 * @return string
	 */
	public function getTypeTitle(): string {
		return $this->p__title;
	}

	/**
	 * Возвращает адрес доставки
	 * @return string
	 */
	public function getAddress(): string {
		return $this->address ?? '';
	}

	/**
	 * Код продукта
	 * @return string
	 */
	public function getCode(): string {
		return $this->id;
	}

	/**
	 * Установить дату активации
	 * @param \DateTime $activateDate
	 * @return IProduct
	 */
	public function setActivateDate(\DateTime $activateDate): IProduct {
		return $this;
	}

	/**
	 * Проверка оплачен ли продукт
	 * @return bool
	 */
	public function isPaid(): bool {
		return true;
	}

	/**
	 * Активирован ли тип продукта
	 * @return bool
	 */
	public function isDisabled(): bool {
		return false;
	}

	/**
	 * Непросрочен ли продукт
	 * @return bool
	 */
	public function isValidExpire(): bool {
		return true;
	}

	/**
	 * Установить новый Expire, либо обновить существующий
	 * @param \DateTime|NULL $date - новая дата expire
	 * @return IProduct
	 */
	public function updateExpire(\DateTime $date=NULL): IProduct {
		return $this;
	}

	/**
	 * Устновить новый Order Id
	 * @param int $orderId - новый Order ID
	 * @return IProduct
	 */
	public function setOrderId(int $orderId): IProduct {
		return $this;
	}

	/**
	 * Установить доставку
	 * @param int|null $deliveryId
	 * @return IProduct
	 */
	public function setDelivery(? int $deliveryId): IProduct {
		return $this;
	}

	/**
	 * Активирован ли ваучер по дате
	 * @return bool
	 */
	public function isActivated(): bool {
		return true;
	}

	/**
	 * Возвращает ID покупателя
	 * @return NULL|int
	 */
	public function getCustomerId(): ?int {
		return $this->customer;
	}

	/**
	 * Возвращает ID симулятора
	 * @return int
	 */
	public function getSimulator(): int {
		return 0;
	}

	/**
	 * Установить статус ваучера как - имеющий бронирование
	 * @return $this
	 */
	public function setBooked(): IProduct {
		return $this;
	}
}