<?php
namespace takeoff\Products;

/**
 * Интефрейс продукта
 * Interface IProduct
 * @package takeoff\Products
 */
Interface IProduct
{
	/**
	 * Сохранить состояние объекта в БД
	 * @return int
	 */
	public function save(): int;

	/**
	 * Возвращает ID продукта
	 * @return int
	 */
	public function getId(): int;

	/**
	 * Возвращает PIN ваучера
	 * @return string
	 */
	public function getPin(): string;

	/**
	 * Возвращает ID типа проудкта
	 * @return int
	 */
	public function getPid(): int;

	/**
	 * Возвращает ID заказа
	 * @return int
	 */
	public function getOrderId(): int;

	/**
	 * Отметить продукт как оплаченный
	 * @param string $payType - тип платежа (online, cash, etc.)
	 * @return mixed
	 */
	public function setPaid(string $payType='online');

	/**
	 * Получить статус продукта
	 * @return string
	 */
	public function getStatus(): string;

	/**
	 * Получить длительность услуги
	 * @return string
	 */
	public function getDuration(): string;

	/**
	 * Возвращает цену продукта
	 * @return float
	 */
    public function getPrice(): float;

	/**
	 * Возвращает цену товара с учетом скидки если таковая имеется
	 * @return float
	 */
	public function getDiscountPrice(): float;

	/**
	 * Возвращает размер скидки %
	 * @return float|null
	 */
	public function getDiscountValue(): ? float;

	/**
	 * Возвращает тип проудкта
	 * @return string
	 */
    public function getType(): string;

	/**
	 * Возвращает срок действия expire
	 * @param string $format - формат, в котором следует вернуть значение
	 * @return string
	 * @throws \Exception
	 */
	public function getExpire(string $format=''): string;

	/**
	 * @param string $format
	 * @return string
	 * @throws \Exception
	 */
	public function getCreateDate(string $format=''): string;

	/**
	 * Возвращает title типа продукта
	 * @return string
	 */
    public function getTypeTitle(): string;

	/**
	 * Возвращает КОД продукта (PIN-ID)
	 * @return string
	 */
    public function getCode(): string;

	/**
	 * Устновить новый Order Id
	 * @param int $orderId - новый Order ID
	 * @return IProduct
	 */
    public function setOrderId(int $orderId): IProduct;

	/**
	 * Установить новый Expire, либо обновить существующий
	 * @param \DateTime|NULL $date - новая дата expire
	 * @return IProduct
	 */
	public function updateExpire(\DateTime $date=NULL): IProduct;

	/**
	 * Установить доставку
	 * @param int|null $deliveryId
	 * @return IProduct
	 */
	public function setDelivery(? int $deliveryId): IProduct;

	/**
	 * Проверка оплачен ли продукт
	 * @return bool
	 */
	public function isPaid(): bool;

	/**
	 * Непросрочен ли продукт
	 * @return bool
	 */
	public function isValidExpire(): bool;

	/**
	 * Активирован ли тип продукта
	 * @return bool
	 */
	public function isDisabled(): bool;

	/**
	 * Активирован ли ваучер по дате
	 * @return bool
	 */
	public function isActivated(): bool;

	/**
	 * Установить дату активации
	 * @param \DateTime $activateDate
	 * @return IProduct
	 */
	public function setActivateDate(\DateTime $activateDate): IProduct;

	/**
	 * Возвращает ID покупателя
	 * @return NULL|int
	 */
	public function getCustomerId(): ?int;

	/**
	 * Возвращает ID симулятора
	 * @return int
	 */
	public function getSimulator(): int;

	/**
	 * Установить статус ваучера как - имеющий бронирование
	 * @return $this
	 */
	public function setBooked(): IProduct;
}