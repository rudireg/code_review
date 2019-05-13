<?php
namespace takeoff\Products\Voucher\Lowcost;

use kanri\App;
use takeoff\Helper\Help;
use takeoff\Products\Voucher\Voucher;

/**
 * Class Lowcost
 * @package takeoff\Products\Lowcost
 */
class Lowcost extends Voucher
{
	/**
	 * Lowcost constructor.
	 * @param int $id
	 * @param array $args
	 * @param App|NULL $app
	 */
	public function __construct(int $id, array $args = [], App $app = NULL)	{
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
					   plv.type AS p__type,
					   lang(plv.title, :l) AS p__title,
					   plv.simulator AS p__simulator,
					   plv.discount AS p__discount,
					   plv.price AS p__price,
					   plv.fly_duration AS p__fly_duration,
					   plv.show AS p__show,
					   plv.expire_duration AS p__expire_duration,
					   (CURRENT_TIMESTAMP + plv.slot_duration) AS endpoint,
       				   lang(s.title, :l) AS s__title
 				FROM vouchers v
 				LEFT JOIN products_lowcost_voucher plv ON v.pid=plv.id
				LEFT JOIN simulators s ON plv.simulator=s.id
 				WHERE v.id=:id";

		$args['id'] = $id;
		$args['l']  = KANRI_LANG;
		$v = $this->db->selectRows($sql, $args);
		if (empty($v[0])) return NULL;
		$data = $v[0];
		$data['str_expires'] = Help::getStrDate($data['expires']);
		return $data;
	}
}