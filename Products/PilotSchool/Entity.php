<?php
namespace takeoff\Products\PilotSchool;

use kanri\ActiveRecord;

/**
 * Class Entity
 * @package takeoff\Products\PilotSchool
 */
class Entity extends ActiveRecord
{
	/**
	 * Entity constructor.
	 * @param $db
	 * @param int $id - ID типа школы пилотов
	 */
	function __construct($db, $id=0)
	{
		parent::__construct($id, 'pilot_schools', $db);

		$this->IntUnsigned('id');
		$this->IntUnsigned('pid');
		$this->FK('customer_id');
		$this->Text('status');
		$this->Text('booking_ids'); // массив зарезервированных броней для практики на авиасимуляторе
		$this->Text('theory_ids');  // массив зарезервированных броней для теории
		$this->DateTime('start_date');
		$this->FK('simulator');
		$this->Text('customer_comment');
		$this->Text('admin_comment');
		$this->FK('order_id');
		$this->Text('data');
		$this->FloatSimple('price');
		$this->FloatSimple('discount');
		$this->DateTime('sold');
		$this->DateTime('used');
		$this->FK('referrer');
		$this->FK('delivery_id');
		$this->DateTime('last_modified');
		$this->DateTime('created');
	}
}