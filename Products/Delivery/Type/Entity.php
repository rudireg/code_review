<?php
namespace takeoff\Products\Delivery\Type;

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
		parent::__construct($id, 'vouchers', $db);
		$this->Json('title');
		$this->Json('descr');
		$this->Text('type');
		$this->IntUnsigned('price');
		$this->BoolSimple('show');
	}
}