<?php
namespace takeoff\Products\Prolong;

use kanri\ActiveRecord;

/**
 * Class Entity
 * @package takeoff\Products\Prolong
 */
class Entity extends ActiveRecord
{
	/**
	 * Entity constructor.
	 * @param $db
	 * @param int $id - ID пролонгации
	 */
	function __construct($db, int $id=0)
	{
		parent::__construct($id, 'products_prolong', $db);
		$this->IntUnsigned('id');
		$this->TextLang('title');
		$this->TextLang('descr');
		$this->Text('type');
		$this->IntUnsigned('price');
		$this->BoolSimple('show');
		$this->Text('prolong');
	}
}