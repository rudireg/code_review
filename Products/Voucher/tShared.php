<?php
namespace takeoff\Products\Voucher;

use \takeoff\Lifepay,
	\takeoff\Logs\Store AS Log;

trait tShared {
	use \takeoff\Customers\tShared;

	/**
	 * Вычисляет номер подарочного сертификата или посадочного талона в строковом "публичном" формате
	 * @param $id - уникальный идентификатор сертификата
	 * @param $pin - рандомный защитный код
	 * @return string - номер сертифиакта в формате "DDDD-DDDDD"
	 */
	function getCode($id, $pin){
		return $pin.'-'.$id;
	}

	/**
	 * @param $voucher
	 * @return bool
	 */
	function isRefund($voucher)
	{
		try {
			$gift = $this->db->selectValue("SELECT status FROM vouchers WHERE id=?", [$voucher]);
			return ('refund' ===  $gift);
		} catch (\Exception $e) {
			return false;
		}
	}

	/**
	 * Получить свойства ваучера
	 * @param $id - ID ваучера
	 * @return array
	 */
	protected function getVoucher($id){
		$v = $this->db->selectRows("
				SELECT 
					v.*,
				   (v.pin::TEXT || '-' || v.id::TEXT) AS code,
				    to_char(v.expires, 'DD Month YYYY') AS str_expires,
				    to_char(v.activate_date, 'DD Month YYYY') AS str_activate_date,
				    lang(s.title, :l) AS title,
				    lang(pv.title, :l) AS str_duration
				FROM vouchers v
				LEFT JOIN products_voucher pv ON v.pid=pv.id
				LEFT JOIN simulators s ON pv.simulator=s.id
				WHERE v.id = :id", ['id'=>(int)$id, 'l'=>KANRI_LANG]);

		return $v[0] ?? [];
	}

	/**
	 * todo: функция осталась лишь для совместимости.
	 * @param $id
	 * @return mixed
	 * @throws \Exception
	 */
	protected function getGift($id){
		$g = $this->db->selectHash("SELECT v.id, v.pin, v.customer, v.order_id, c.email, c.title AS fio, 
			lang(pv.title) AS title, ceil(pv.price) AS price, pv.id AS product,
			extract(epoch from pv.fly_duration) AS duration,
			extract(epoch from v.expires) AS expires, 
			extract(epoch from v.sdate) AS sdate,
			to_char(v.expires, 'DD') AS d, to_char(v.expires, 'MM') AS m, to_char(v.expires, 'YY') AS y,
			c.id AS uid, c.ga_clientId AS clientId, v.status, 
			lang(s.title) AS simulator, pv.simulator AS sid, pv.type, d.address, c.phone, s.id AS simid
			FROM vouchers v LEFT JOIN deliveries d ON d.id = v.delivery, 
				products_voucher pv, simulators s, customers c
			WHERE v.id = ? AND pv.id = v.pid AND pv.simulator = s.id
				AND c.id = v.customer", [(int)$id]);
		if(!$g) throw new \Exception("NON_VALID_ORDER", 500);
		$g->code = $this->getCode($g->id, $g->pin);	
		return $g;
	}

	/**
	 * @param $expires
	 * @return false|string
	 */
	protected function getExpires($expires){
		return date('d.m.Y', $expires);
	}

	/**
	 * @param $sdate
	 * @return false|string
	 */
	protected function getSale($sdate){
		return date('d.m.Y', $sdate);
	}
}