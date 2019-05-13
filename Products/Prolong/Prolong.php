<?php
namespace takeoff\Products\Prolong;

use kanri\App;
use kanri\PDO\Model;
use kanri\ActiveRecord;
use takeoff\Products\IProduct;
use kanri\ActiveRecord\Field\Date;
use takeoff\Products\Voucher\Voucher;

/**
 * Class Prolong
 * @package takeoff\Products\Prolong
 */
class Prolong extends Model implements IProduct
{
	/**
	 * Prolong constructor.
	 * @param int|NULL $id - ID продукта, подлежащего пролонгации
	 * @param ActiveRecord|NULL $ar
	 * @param array $args
	 * @param App|NULL $app
	 */
	public function __construct(int $id=NULL, ActiveRecord $ar = NULL, array $args = [], App $app = NULL)
	{
		$this->product = new Voucher($id);
		$this->app = $app ?? App::getInstance();
		$db = $this->app->pdo();
		$id = (int) $db->selectValue("SELECT id FROM products_prolong WHERE prolong=?", ['voucher']);
		$ar = $ar? :new Entity($this->app->pdo(), $id);
		parent::__construct($id, $ar, $args, $this->app);
	}

	/**
	 * Сохранить состояние объекта в БД
	 * @return int
	 */
	public function save(): int {
		return $this->ar->save();
	}

	/**
	 * Возвращает свойства объекта представленные как ассоциативный массив
	 * @return array
	 */
	public function toArray(): array {
		$prolongArray = parent::toArray();
		$prolongArray['product'] = $this->product->toArray();
		$prolongArray['str_expires'] = $prolongArray['product']['str_expires'];
		return $prolongArray;
	}

	/**
	 * Возвращает ID продукта
	 * @return int
	 */
	public function getId(): int {
		return $this->product->getId();
	}

	/**
	 * Возвращает PIN ваучера
	 * @return string
	 */
	public function getPin(): string {
		return $this->product->getPin();
	}

	/**
	 * Возвращает ID типа проудкта
	 * @return int
	 */
	public function getPid(): int {
		return $this->product->getPid();
	}

	/**
	 * Возвращает ID заказа
	 * @return int
	 */
	public function getOrderId(): int {
		return $this->product->getOrderId();
	}

	/**
	 * Получить статус продукта
	 * @return string
	 */
	public function getStatus(): string {
		return $this->product->getStatus();
	}

	/**
	 * Получить длительность услуги
	 * @return string
	 */
	public function getDuration(): string {
		return $this->product->getDuration();
	}

	/**
	 * Возвращает ID ваучера
	 * @return int
	 */
	public function getVoucherId(): int {
		return $this->product->getId();
	}

	/**
	 * Пролонгировать expire продукта
	 * @param string $payType - тип платежа (online, cash, etc.)
	 * @return mixed
	 * @throws \Exception
	 */
	public function setPaid(string $payType='online'): self {
		$current   = (new \DateTime())->setTime(0, 0, 0, 0);
		$expire    = new \DateTime($this->product->getExpire('Y-m-d'));
		$expire    = ($expire > $current)? $expire : $current;
		$newExpire = $expire->add(new \DateInterval("P30D"));
		$this->product->updateExpire($newExpire)->save();
		return $this;
	}

	/**
	 * Возвращает цену продукта
	 * @return float
	 */
	public function getPrice(): float {
		return $this->price;
	}

	/**
	 * Возвращает цену товара с учетом скидки если таковая имеется
	 * @return float
	 */
	public function getDiscountPrice(): float {
		return $this->product->getDiscountPrice();
	}

	/**
	 * Возвращает размер скидки %
	 * @return float|null
	 */
	public function getDiscountValue(): ? float {
		return $this->product->getDiscountValue();
	}

	/**
	 * Возвращает срок действия expire
	 * @param string $format - формат, в котором следует вернуть значение
	 * @return string
	 * @throws \Exception
	 */
	public function getExpire(string $format=''): string {
		return $this->product->getExpire($format);
	}

	/**
	 * @param string $format
	 * @return string
	 * @throws \Exception
	 */
	public function getCreateDate(string $format=''): string {
		return $this->product->getCreateDate($format);
	}

	/**
	 * Вернуть ID симулятора
	 * @return int
	 */
	public function getSimulator(): int {
		return $this->product->getSimulator();
	}

	/**
	 * Возвращает тип проудкта
	 * @return string
	 */
	public function getType(): string {
		return $this->type;
	}

	/**
	 * Возвращает title типа продукта
	 * @return string
	 */
	public function getTypeTitle(): string {
		return $this->title;
	}

	/**
	 * Установить дату активации
	 * @param \DateTime $activateDate
	 * @return IProduct
	 */
	public function setActivateDate(\DateTime $activateDate): IProduct {
		$this->product->setActivateDate($activateDate);
		return $this;
	}

	/**
	 * Проверка оплачен ли продукт
	 * @return bool
	 */
	public function isPaid(): bool {
		return $this->product->isPaid();
	}

	/**
	 * Активирован ли тип продукта
	 * @return bool
	 */
	public function isDisabled(): bool {
		return $this->product->isDisabled();
	}

	/**
	 * Непросрочен ли продукт
	 * @return bool
	 * @throws \Exception
	 */
	public function isValidExpire(): bool {
		return $this->product->isValidExpire();
	}

	/**
	 * Установить новый Expire, либо обновить существующий
	 * @param \DateTime|NULL $date - новая дата expire
	 * @return IProduct
	 * @throws \Exception
	 */
	public function updateExpire(\DateTime $date=NULL): IProduct {
		$this->product->updateExpire($date);
		return $this;
	}

	/**
	 * Возвращает КОД продукта (PIN-ID)
	 * @return string
	 */
	public function getCode(): string {
		return $this->product->getCode();
	}

	/**
	 * Устновить новый Order Id
	 * @param int $orderId - новый Order ID
	 * @return IProduct
	 */
	public function setOrderId(int $orderId): IProduct {
		$this->product->setOrderId($orderId);
		return $this;
	}

	/**
	 * Установить доставку
	 * @param int|null $deliveryId
	 * @return IProduct
	 */
	public function setDelivery(? int $deliveryId): IProduct {
		$this->product->setDelivery($deliveryId);
		return $this;
	}

	/**
	 * Активирован ли ваучер по дате
	 * @return bool
	 * @throws \Exception
	 */
	public function isActivated(): bool {
		return $this->product->isActivated();
	}

	/**
	 * Возвращает ID покупателя
	 * @return NULL|int
	 */
	public function getCustomerId(): ? int {
		return $this->product->getCustomerId();
	}

	/**
	 * Установить статус ваучера как - имеющий бронирование
	 * @return $this
	 */
	public function setBooked(): IProduct {
		$this->product->setBooked();
		return $this;
	}

	/**
	 * @param int $id
	 * @param array|null $args
	 * @return array|null
	 */
	protected function query(int $id, ?array $args): ?array
	{
		$sql = "SELECT pp.id,
					   lang(pp.title, :l) AS title,
					   lang(pp.descr, :l) AS descr,
					   pp.type,
					   pp.price,
					   pp.show,
					   pp.prolong					 
 				FROM products_prolong pp
 				WHERE pp.id=:id";
		$args['id'] = $id;
		$args['l']  = KANRI_LANG;
		$v = $this->db->selectRows($sql, $args);
		return $v[0] ?? NULL;
	}

	protected $product;
}