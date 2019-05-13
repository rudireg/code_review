<?php
namespace takeoff\Products\Voucher\Smart;

use kanri\App;
use takeoff\Helper\Help;
use takeoff\Products\Voucher\Voucher;

/**
 * Класс реализует представление Smart-voucher
 * Class SmartVoucher
 * @package takeoff\Products\SmartVoucher
 */
class SmartVoucher extends Voucher
{
	/**
	 * SmartVoucher constructor.
	 * @param int $id - ID ваучера
	 * @param array $args
	 * @param App|NULL $app
	 */
	public function __construct(int $id, array $args = [], App $app = NULL) {
		parent::__construct($id, NULL, $args, $app);
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
					   psv.type AS p__type,
					   lang(psv.title, :l) AS p__title,
					   psv.simulator AS p__simulator,
					   psv.discount AS p__discount,
					   psv.price AS p__price,
       				   lang(s.title, :l) AS s__title
 				FROM vouchers v
 				LEFT JOIN products_smart_voucher psv ON v.pid=psv.id
				LEFT JOIN simulators s ON psv.simulator=s.id
 				WHERE v.id=:id";

		$args['id'] = $id;
		$args['l']  = KANRI_LANG;
		$v = $this->db->selectRows($sql, $args);
		if (empty($v[0])) return NULL;
		$data = $v[0];
		$data['str_expires'] = Help::getStrDate($data['expires']);
		$data['str_activate_date'] = Help::getStrDate($data['activate_date']);
		return $data;
	}

}