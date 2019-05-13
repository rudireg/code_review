<?php
namespace takeoff\Products;

use kanri\App;

/**
 * Класс управления коллекцией продуктов
 * Class Collection
 * @package takeoff\Products
 */
class Collection
{
	/**
	 * Хэш представления продуктов
	 */
	const classMap = [
		'delivery'        => '\takeoff\Products\Delivery\Delivery',
		'voucher'         => '\takeoff\Products\Voucher\Voucher',
		'smart_voucher'   => '\takeoff\Products\Voucher\Smart\SmartVoucher',
		'lowcost_voucher' => '\takeoff\Products\Voucher\Lowcost\Lowcost',
		'prolong'         => '\takeoff\Products\Prolong\Prolong',
		'boarding'        => '\takeoff\Products\Boarding\Boarding',
		'school'          => '\takeoff\Products\PilotSchool\PilotSchool'
	];

	/**
	 * Collection constructor.
	 * @param array $productsArray - ассоциативный массив, где ключ - тип продукта, значение - массив ID продуктов
	 * @param App|NULL $app
	 */
	public function __construct(array $productsArray, App $app=NULL)
	{
		$this->app = $app ?? App::getInstance();
		$this->db  = $this->app->pdo();
		$this->products = new \ArrayObject([]);
		$this->createProductCollection($productsArray);
	}

	/**
	 * Создать коллекцию продуктов
	 * @param array $productsArray - ассоциативный массив, где ключ - тип продукта, значение - массив ID продуктов
	 * @return $this
	 */
	public function createProductCollection(array $productsArray)
	{
		foreach ($productsArray AS $type => $ids) {
			foreach ($ids AS $id) {
				$object = $this->typeFactory($type, $id);
				$this->products->append($object);
			};
		};
		return $this;
	}

	/**
	 * Отметить все продукты как оплаченные
	 * @param string $payType - тип платежа (online, cash, etc.)
	 * @return $this
	 */
	public function setPaidAll(string $payType)
	{
		foreach ($this->products AS $product) {
			$product->setPaid($payType);
		};
		return $this;
	}

	/**
	 * Все ли продукты оплачены
	 * @return bool
	 */
	public function isAllPaid(): bool
	{
		foreach ($this->products AS $product) {
			if (!$product->isPaid()) {
				return false;
			}
		};
		return true;
	}

	/**
	 * Конвертировать в массив
	 * @return array
	 */
	public function toArray(): array
	{
		$data = [];
		foreach ($this->products AS $product) {
			$data[] = $product->toArray();
		};
		return $data;
	}

	/**
	 * Вернуть коллекцию
	 * @return \ArrayObject
	 */
	public function getProducts(): \ArrayObject {
		return $this->products;
	}

	/**
	 * Возвращает ассоциативный массив, где индекс это тип продукта, а его значение представляет кол-во
	 * @return array
	 */
	public function getProductTypes(): array
	{
		$list = [];
		foreach ($this->products AS $product) {
			$type = $product->getType();
			if (empty($list[$type])) {
				$list[$type] = 1;
			} else {
				$list[$type] ++;
			}
		};
		return $list;
	}

	/**
	 * Возвращает массив продуктов с фильтрацией по типу
	 * @param array $exclude
	 * @return \ArrayObject
	 */
	public function getProductsExcludeType(array $exclude = []): \ArrayObject
	{
		if (empty($exclude)) return $this->products;
		$list = new \ArrayObject();
		foreach ($this->products AS $product) {
			if (in_array($product->getType(), $exclude)) continue;
			$list->append($product);
		}
		return $list;
	}

	/**
	 * Вернуть продукты определенного типа
	 * @param string $type - тип продукта (voucher, etc.)
	 * @return \ArrayObject
	 */
	public function getProductsByType(string $type): \ArrayObject {
		$list = new \ArrayObject();
		$products = $this->getProducts();
		foreach ($products AS $product) {
			if ($type === $product->getType()) {
				$list->append($product);
			}
		}
		return $list;
	}

	/**
	 * Кол-во объектов в коллекции
	 * @return int
	 */
	public function getCount(): int {
		return $this->products->count();
	}

	/**
	 * Возвращает ID доставки, если таковая есть среди продуктов
	 * @return int|null
	 */
	public function getDeliveryId(): ? int {
		foreach ($this->products AS $product) {
			if ('delivery' === $product->getType()) {
				return $product->getId();
			}
		}
		return NULL;
	}

	/**
	 * Проверяет есть ли в коллекции определнный тип продукта
	 * @param string $type - тип продукта (voucher, smart_voucher, etc.)
	 * @return bool
	 */
	public function isHaveProductType(string $type = ''): bool {
		foreach ($this->products AS $product) {
			if ($type === $product->getType()) {
				return true;
			}
		};
		return false;
	}

	/**
	 * Метод фабрика - создает проудкт по типу
	 * @param string $type
	 * @param int $id
	 * @return IProduct
	 */
	protected function typeFactory(string $type, int $id): IProduct {
		$class = self::classMap[$type];
		return new $class($id);
	}

	protected $products;
	protected $app;
	protected $db;
}