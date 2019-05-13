<?php
namespace takeoff\Products\Delivery\Type;

use kanri\App;
use kanri\PDO\Model;
use kanri\ActiveRecord;
use takeoff\Products\IType;

class DeliveryType extends Model implements IType
{
	/**
	 * DeliveryType constructor.
	 * @param int $id - ID типа доставки
	 * @param ActiveRecord|NULL $ar
	 * @param null $args
	 * @param null $app
	 */
	public function __construct($id, ActiveRecord $ar=NULL, $args=NULL, $app=NULL) {
		$this->app = $app ?? App::getInstance();
		$ar = new Entity($this->app->pdo(), $id);
		parent::__construct($id, $ar, $args, $this->app);
	}

	/**
	 * @param int $id - ID типа доставки
	 * @param array|null $args
	 * @return array|null
	 */
	public function query(int $id, ?array $args): ?array
	{
		$sql = "SELECT *, lang(title, :l) AS title, lang(descr, :l) AS descr FROM products_delivery WHERE id=:id";
		$args['id'] = $id;
		$args['l'] = KANRI_LANG;
		$this->db->selectRows($sql, $args);
	}
}