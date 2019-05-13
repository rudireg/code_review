<?php
namespace takeoff\Products\Delivery;

use takeoff\Products\Action;

class Actions extends Action
{
	/**
	 * DeliveryProduct constructor.
	 * @param \kanri\App $app
	 */
	public function __construct(\kanri\App $app) {
		parent::__construct($app);
		$this->productTable = 'deliveries';
	}

	/**
	 * Получить данные продукта
	 * @param int $id - ID продукта
	 * @return array
	 */
	public function getProduct(int $id):array
	{
		return (new \takeoff\Deliveries\Store($this->app))->Read($id);
	}

	/**
	 * Создать новую доставку
	 * @param int $customer - ID владельца
	 * @param $productType - тип продукта
	 * @param int|NULL $orderId - ID заказа
	 * @param string|NULL $comment - комментарий
	 * @param int|NULL $referrer - источник
	 * @param float|NULL $discount - скидка в процентах
	 * @param array $data - дополнительные данные, могут быть уникальными для каждого типа продукта
	 * @param bool $skipDuplex - Пропускать ли продукт с тем же типом ($pid).
	 * @return int - ID созданного ваучера
	 * @throws \Exception
	 */
	public function createConcreteProduct(int $customer, $productType, int $orderId=NULL, string $comment=NULL, int $referrer=NULL, float $discount=NULL, array $data=[], bool $skipDuplex=true):int
	{
		if (empty($customer) || empty($productType) || empty($orderId)) { throw new \Exception('Invalid arguments.', 500); }


		$id = $this->db->insert("INSERT INTO $this->productTable (pid, order_id, customer, address, comments)
							   VALUES (?, ?, ?, ?, ?)",
			[
				$productType->id,
				$orderId,
				$customer,
				!empty($data['address'])? $data['address'] : '',
				$comment
			],
			$this->productTable
		);
		return (int)$id;
	}

	/**
	 * Заглушка оплаты
	 * @param int $id
	 * @param string|NULL $ptype
	 * @param int $customer
	 * @return bool
	 * @throws \Exception
	 */
	public function setPaid(int $id, string $ptype=NULL, int $customer=NULL):bool {return true;}

	/**
	 * Получить список продуктов
	 * @param array $ids - массив ID продуктов
	 * @return array
	 */
	public function getListProducts(array $ids):array
	{
		return [];
	}

	/**
	 * Получить центу продукта
	 * @param int $pid - ID продукта
	 * @param bool $discount - учитывать ли скидку, если она есть
	 * @return int
	 */
	public function getPrice(int $pid, $discount=true):int
	{
		return (int)$this->db->selectValue("SELECT price FROM products_delivery WHERE id=?", [$pid]);
	}

	/**
	 * Привязать продукту доставку
	 * @param int $productId - ID продукта
	 * @param int|NULL $delivery - ID доставки
	 * @return mixed
	 */
	public function attachDelivery(int $productId, int $delivery=NULL) {return [];}

	/**
	 * Доступена ли генерация сертификата для продукта
	 * @return bool
	 */
	public function isCertAvailable()
	{
		return false;
	}

	protected $productTable;
}