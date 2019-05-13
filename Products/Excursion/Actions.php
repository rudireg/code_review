<?php
namespace takeoff\Products\Excursion;

use takeoff\Products\Interfaces\IAction;
use takeoff\Products\Action;

class Actions extends Action implements IAction
{
	/**
	 * DeliveryProduct constructor.
	 * @param \kanri\App $app
	 * @param int $id
	 */
	public function __construct(\kanri\App $app, int $id) {
		parent::__construct($app, $id);
	}

	/**
	 * Получить данные продукта
	 * @param int $id - ID продукта
	 * @return array
	 */
	public function getProduct(int $id):array
	{
		return [];
	}
}