<?php
namespace takeoff\Products\Voucher;

use kanri\ActiveRecord;

/**
 * Class Entity
 * @package takeoff\Products\Voucher
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
		parent::__construct($id, 'vouchers', $db);
		$this->IntUnsigned('pid');
		$this->IntUnsigned('pin');
		$this->Date('expires');
		$this->Text('status');
		$this->FK('customer');
		$this->FK('order_id');
		$this->FK('delivery');
		$this->Text('ptype');
		$this->DateTime('sdate');
		$this->DateTime('sold');
		$this->DateTime('used');
		$this->Text('comments');
		$this->FK('referrer');
		$this->FloatSimple('discount');
		$this->Date('activate_date');
	}
}