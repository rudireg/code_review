<?php
namespace takeoff\Products;

class Store extends \kanri\App\Action
{
	/**
	 * Конструктор
	 * Store constructor.
	 * @param \kanri\App $app контейнер приложения
	 */
	function __construct(\kanri\App $app){
		parent::__construct($app);
		$this->db = $app->pdo();
	}

	/**
	 * Получить ассоциативный массив всех продуктов
	 * @return array
	 * @throws \Exception
	 */
	function Select ()
	{
		try{
			$res = [];
			$types = $this->db->selectList("SELECT DISTINCT type FROM products");
			foreach ($types as $type) {
				$items = $this->db->selectRows("SELECT * FROM products_$type WHERE show=TRUE ORDER BY id");
				foreach ($items as $item) {
					$res[$item['type']][] = $item;
				};
			};
			return $res;
		} catch (\Exception $e) {
			throw new \Exception($e->getMessage(), 500);
		}
	}

	/**
	 * Получить КОНКРЕТНЫЙ список продукта
	 * @param string $type - Тип продукта
	 * @return array
	 * @throws \Exception
	 */
	function Read (string $type)
	{
		try{
			return $this->db->selectRows("SELECT *, lang(title, :l) AS title, lang(descr, :l) AS descr
				FROM products_$type
				WHERE show=TRUE 
				ORDER BY id", ['l'=>KANRI_LANG]);
		} catch (\Exception $e) {
			throw new \Exception($e->getMessage(), 500);
		}
	}

	protected $db;
}