<?php
namespace takeoff\Products\Delivery;

use kanri\ActiveRecord;

/**
 * Class Entity
 * @package takeoff\Products\Delivery
 */
class Entity extends ActiveRecord
{
	/**
	 * Entity constructor.
	 * @param $db
	 * @param int $id - ID доставки
	 */
	function __construct($db, $id=0)
	{
		parent::__construct($id, 'deliveries', $db);
		$this->IntUnsigned('pid');
		$this->IntUnsigned('order_id');
		$this->IntUnsigned('customer');
		$this->Text('address');
		$this->DateTime('date_delivery');
		$this->Text('status');
		$this->Text('comments');
		$this->Text('comments_admin');
	}
}