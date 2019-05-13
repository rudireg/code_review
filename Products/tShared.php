<?php
namespace takeoff\Products;

trait tShared
{
	/**
	 * Хэш типов ваучеров
	 * @param string $type
	 * @return string
	 * @throws \Exception
	 */
	public function getVoucherClassByType(string $type): string {
		switch ($type) {
			case 'voucher':
				return '\takeoff\Products\Voucher\Voucher';
				break;
			case 'lowcost_voucher':
				return '\takeoff\Products\Voucher\Lowcost\Lowcost';
				break;
			case 'smart_voucher':
				return '\takeoff\Products\Voucher\Smart\SmartVoucher';
				break;
			default:
				throw new \Exception("Undefined voucher type: $type", 500);
		}
	}

	/**
	 * Получить тип ваучера по его ID
	 * @param int $id
	 * @return string
	 */
	public function getVoucherTypeById(int $id): string {
		return $this->db->selectValue("SELECT p.type 
										FROM products p,
										vouchers v
										WHERE v.id=? AND p.id=v.pid", [$id]);
	}

	/**
	 * Проверить доступность продукта
	 * @param int $pid - ID продукта
	 * @return mixed
	 */
	public function isProductAvailable(int $pid) {
		return $this->db->selectValue("SELECT show FROM products WHERE id=?", [$pid]);
	}

	/**
	 * Получить информацию о продукте
	 * @param int $pid - ID продукта
	 * @param int $uid - ID авторизованного пользователя. (учитывать доступность продукта)
	 * @return mixed
	 */
	public function getProductType(int $pid, int $uid=NULL)
	{
		$tableName = $this->db->selectValue("SELECT p.tableoid::regclass FROM products p WHERE p.id=?", [$pid]);
		$sql = "SELECT *," .
			   (($tableName === 'products_lowcost_voucher')? '(CURRENT_TIMESTAMP + slot_duration) AS endpoint,':'') .
				"lang(title, :l) AS title, 
				lang(descr, :l) AS descr  
				FROM $tableName 
				WHERE id=:id";
		if ($uid === NULL) $sql .= ' AND show=TRUE';
		return $this->db->selectHash($sql, ['id'=>$pid, 'l'=>KANRI_LANG]);
	}

	/**
	 * Получить ОБЩИЕ данные продукта по его типу
	 * @param string $type - Тип продукта
	 * @param string $lang - Локаль
	 * @return array
	 */
	public function getProductByType(string $type, string $lang = ''):array
	{
		$lang = !empty($lang)? $lang : KANRI_LANG;
		$table = $this->db->selectValue("SELECT p.tableoid::regclass FROM products p WHERE p.type=?", [$type]);
		$product = $this->db->selectRows("SELECT 
												p.*, 
												p.title::jsonb->>'$lang' AS title,
												p.descr::jsonb->>'$lang' AS descr
										  FROM $table p");
		return !empty($product)? $product : [];
	}

	/**
	 * Возвращает строкое представление типа проудкта
	 * @param int $id - ID ваучера в таблице vouchers
	 * @return null|string
	 */
	public function getVoucherTypeByVoucherId(int $id): ? string
	{
		$rv = $this->db->selectValue("SELECT p.type 
								FROM products p 
								INNER JOIN vouchers v ON v.id=?
								WHERE p.id=v.pid", [$id]);

		return !empty($rv)? $rv : NULL;
	}

	/**
	 * Получить стоимость пролонгации
	 * @param string $type - тип продукта
	 * @return int
	 */
	public function getProlongPrice(string $type='voucher')
	{
		if (empty($type)) return 0;
		return $this->db->selectValue("SELECT price FROM products_prolong WHERE prolong=?", [$type]);
	}

	/**
	 * Проверка того, срок дейтсвия продукта меньше или равен переданной даты
	 * @param $point - Дата
	 * @param $date - Дата
	 * @return bool - TRUE если $point больше либо равен $date
	 * @throws \Exception
	 */
	public function isPeriodValid($point, $date)
	{
		if (!($point instanceof \DateTime)){
			$point = new \DateTime($point);
		}
		if (!($date instanceof \DateTime)){
			$date = new \DateTime($date);
		}
		$point->setTime(0,0,0,0);
		$date->setTime(0,0,0,0);
		return ($point >= $date);
	}
}