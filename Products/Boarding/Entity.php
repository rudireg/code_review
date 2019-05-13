<?php
namespace takeoff\Products\Boarding;

use kanri\ActiveRecord;

/**
 * Class Entity
 * @package takeoff\Products\Boarding
 */
class Entity extends ActiveRecord
{
	/**
	 * Entity constructor.
	 * @param $db
	 * @param int $id - ID авучера
	 */
	function __construct($db, $id=0)
	{
		parent::__construct($id, 'boardings', $db);
		$this->IntUnsigned('id');
		$this->IntUnsigned('pin');
		$this->IntUnsigned('pid');
		$this->FK('customer_id');
		$this->Text('status');
		$this->FK('booking_id');
		$this->FK('old_booking_id');
		$this->DateTime('flight_start');
		$this->IntUnsigned('restart');
		$this->Text('customer_comment');
		$this->Text('admin_comment');
		$this->FK('order_id');
		$this->FK('need_pay_order_id');
		$this->FK('voucher_id');
		$this->Text('data');
		$this->FloatSimple('price');
		$this->Text('price_category');
		$this->FloatSimple('discount');
		$this->DateTime('sold');
		$this->DateTime('used');
		$this->FK('referrer');
		$this->FK('delivery_id');
		$this->DateTime('last_modified');
		$this->DateTime('created');
	}
}

