<?php
namespace takeoff\Booking;

use kanri\ActiveRecord\Field\DateTime;
use kanri\PDO\Exception;
use phpDocumentor\Reflection\Types\Boolean;
use takeoff\Logs\Log;

class Store extends \kanri\App\Action implements \kanri\ActiveRecord\CRUDAction {
	use \kanri\ActiveRecord\tCRUD {
		\kanri\ActiveRecord\tCRUD::Destroy as tCrudDestroy;
	}
	use \takeoff\Booking\tShared;
	use \takeoff\Vouchers\tShared;
	use \takeoff\Products\tShared;

	/**
	 * Конструктор определяет фактическое имя таблицы истории
	 * Store constructor.
	 * @param \kanri\App $app контейнер приложения
	 */
	function __construct(\kanri\App $app)
	{
		parent::__construct($app);
		$this->db = $app->pdo();
		$this->table = 'bookings';

		$listener = function() {
			if (empty($this->logData['new_data']['id'])) {
				return;
			}
			// Если (Request=NULL) - значит операция была вызвана програмно
			$this->request = ($this->request)? : $this->app->iocResolve('kanri\Request');
			$command = $this->request->getCommandName();
			if (in_array($command, ['Add', 'Update', 'Surcharge', 'Delete', 'Refund', 'Complete', 'Cancel'])) {
				if (empty($this->logData['log'])) {
					throw new \Exception('Empty log Data', 500);
				}
				if (!array_key_exists('customer', $this->logData['new_data'])) {
					$this->logData['new_data']['customer'] = $this->getCustomerIdByBookingId($this->logData['new_data']['id']);
				}
				$statusMap = [
					'new'       => 'create',
					'rebooking' => 'rebooked',
					'technical_rebooking' => 'technical_rebooking',
					'complete'  => 'complete',
					'fail'      => 'fail',
					'majeure'   => 'fail',
					'technical' => 'fail',
					'refund'    => 'refund',
					'archive'   => 'archived'
				];

				$data = [];
				$data['type']     = 'booking';
				$data['uid']      = $this->app->user()->uid();              // Идентификатор ответственного пользователя
				$data['customer'] = $this->logData['new_data']['customer']; // Идентификатор зарегистрированного клиента
				$data['object']   = $this->logData['new_data']['id'];       // Идентификатор бронирования
				$data['status']   = $statusMap[$this->logData['new_data']['status']]; // LOGSTATUS

				switch ($command) {
					case 'Add':
					case 'Delete':
					case 'Cancel':
					case 'Surcharge':
					$this->logData['log']['data'] = $this->logData['new_data'];
					    $data['event_data'] = json_encode($this->logData['log']);
						break;
					case 'Update':
					case 'Refund':
					case 'Complete':
						if ($this->logData['log']['event'] === 'edit') {
							$this->logData['log']['data'] = $this->logData['new_data'];
							$data['event_data'] = json_encode($this->logData['log']);
						} else {
							$data['event_data'] = !empty($this->logData['log'])? json_encode($this->logData['log']) : null;
						}
						break;
				}
				(new Log())->Add('booking', $data['customer'], $data['object'], $data['status'], $data);
			}
		};
		$this->app->addEventListener(\kanri\EVENT_DELAYED, $listener);
	}

	/**
	 * @param string $from Дата (включительно) с которой начинается выборка
	 * @param string $to Дата (без включения) до которой идет выборка
	 * @return array
	 */
	function Select ($from, $to)
	{
		$rv = $this->db->selectRows("SELECT 
				b.id AS eid,
				b.pin AS booking_pin,
				b.vip,
				b.duration,
				b.voucher,
				b.surcharge,
				b.type,
				CASE WHEN 
					b.status IN ('rebooking'::BOOKINGSTATUS, 'technical_rebooking'::BOOKINGSTATUS) AND 
					(SELECT status FROM log WHERE type='booking' AND object=b.id AND status='technical_rebooking' LIMIT 1) IS NOT NULL 
					THEN 
						'technical_rebooking'::BOOKINGSTATUS 
					ELSE 
						b.status END 
					AS status,
				b.start AS start_date, 
				b.start + b.duration AS end_date, 
				b.simulator AS section_id,
				b.comment AS text,
				b.vip_comment,
				b.event_data,
				c.title AS fio,
				c.phone,
				cc.title AS add_fio,
				cc.phone AS add_phone,
				(SELECT v.pin FROM vouchers v WHERE v.id=b.voucher) AS pin
				FROM bookings b
				LEFT JOIN customers c ON b.customer = c.id
				LEFT JOIN customers cc ON b.customer2 = cc.id
				WHERE b.start >= ? AND b.start < ? AND b.status <> 'archive'::BOOKINGSTATUS", [$from, $to]);

		return $rv;
	}

	/**
	 * Выбрать записи, которые были созданые позднее даты-аргумента ($time), либо были обновлены позднее этой даты
	 * @param null $time - Дата после которой следует выбрать записи. (Учитывается и создание и обновление)
	 * @return array
	 */
	function SelectUpdatedEvents($time = null)
	{
		$time = $time ?: date('Y-m-d H:i:s');
		$rv = $this->db->selectRows("SELECT 
				b.id AS eid,
				b.pin AS booking_pin,
				b.vip,
				b.duration,
				b.voucher,
				b.surcharge,
				b.type,
				b.status,
				b.start AS start_date, 
				b.start + b.duration AS end_date, 
				b.simulator AS section_id,
				b.comment AS text,
				b.vip_comment,
				b.event_data,
				c.title AS fio,
				c.phone,
				cc.title AS add_fio,
				cc.phone AS add_phone,
				(SELECT v.pin FROM vouchers v WHERE v.id=b.voucher) AS pin,
				b.created,
 				b.last_modified
				FROM bookings b
					LEFT JOIN customers c ON b.customer = c.id
					LEFT JOIN customers cc ON b.customer2 = cc.id
				WHERE b.created >= ? OR b.last_modified >= ?", [$time, $time]);
		return $rv;
	}

	/**
	 * Вернуть данные о бронировании
	 * @param $id - ID записи в таблице bookings
	 * @return \kanri\stdClass
	 * @throws \Exception
	 */
	function Read($id)
	{
		if (empty($id)) {
			throw new \Exception('Invalid Argument for Read.', 500);
		}
		$sql = "SELECT 
					b.*,
					b.pin AS booking_pin,
					c.title AS fio,
					c.phone,
					c.email,
					cc.title AS add_fio,
					cc.phone AS add_phone,
					cc.email AS add_email,
					(SELECT COUNT(*) FROM bookings bb WHERE bb.voucher=b.voucher AND bb.status IN ('new'::BOOKINGSTATUS, 'rebooking'::BOOKINGSTATUS, 'technical_rebooking'::BOOKINGSTATUS)) AS transference, -- Кол-во броней
					(SELECT title FROM staff WHERE uid=b.uid) AS admin_name,
					(SELECT v.pin FROM vouchers v WHERE v.id=b.voucher) AS pin
				FROM bookings b
				LEFT JOIN customers c ON b.customer = c.id
				LEFT JOIN customers cc ON b.customer2 = cc.id
				WHERE b.id=?";
		try {
			$res = $this->db->selectHash($sql, [$id]);
			if (false !== $res) {
				$res->code = !empty($res->voucher)? $this->getCode($res->voucher, $res->pin) : '';
				if ($res->transference > 0) {$res->transference --;}
			} else {
				$res = [];
			}
			return $res;
		} catch (\Exception $e) {
			throw new \Exception($e->getMessage(), 500);
		}
	}

	/**
	 * @param $data
	 * @return array
	 */
	function ReadHistory($data)
	{
		$data = json_decode($data, true);
		$items = (new Log())->getBookingHistory($data);
//		$items = Log::SliceRead($this->app, ['type'=>'booking', 'object'=>$data]);
		foreach ($items as &$item) {
			if (!empty($item['event_data'])) {
				$item['event_data'] = json_decode($item['event_data'], true);
			}
		};
		unset($item);
		return $items;
	}

	/**
	 * Поиск бронирований по номеру сертификата или телефону
	 * @param $value
	 * @param string $type
	 * @return array
	 * @throws \Exception
	 */
	function Search($value, $type = 'cert')
	{
		$value = trim($value);
		if (empty($value)) throw new \Exception('Invalid Argument. The Search Value is empty.', 500);
		$arg = [];
		$ids = [];
		$sql = "SELECT id, start FROM bookings WHERE ";
		switch ($type) {
			case 'cert':
				$sql .= " voucher =?";
				$arg[] = $value;
				break;
			case 'phone':
				$customer = $this->searchCustomerIdByPhone($value);
				if (empty($customer)) return [];
				$sql .= " customer =? OR customer2 =?";
				$arg[] = $customer;
				$arg[] = $customer;
				break;
			case 'booking':
				$ids[] = ['id' => $value];
				break;
			default:
				throw new \Exception('Invalid Argument. Search type is not found.', 500);
		}

		if ($type !== 'booking') {
			$sql .= ' ORDER BY start DESC';
			try {
				$ids = $this->db->selectRows($sql, $arg);
			} catch (\Exception $e) {
				throw new \Exception($e->getMessage(), 500);
			}
		}

		$res = [];
		foreach ($ids as $id) {
			$item = $this->Read($id['id']);
			if (!empty($item)) {
				$res[] = $item;
			}
		}
		return $res;
	}

	/**
	 * Добавление нового Таймслота
	 * @param $data - данные в формате JSON
	 * @param $log - JSON строка содержащщая данные для логирования
	 * @return int - id вставленной записи
	 * @throws \Exception
	 */
	function Add($data, $log = null)
	{
		$data = json_decode($data);
		$this->logData['log'] = $log? json_decode($log, true) : null;
		// Получаем ID пользователя (таблица users)
		$data->uid = NULL;
		try {
			$data->uid = $this->app->user()->uid();
		} catch (\Exception $e) {}
		// Валидация
		foreach (['start', 'duration', 'simulator', 'type'] as $key) {
			if (empty($data->$key)) {
				throw new \Exception("Invalid arguments. An incomplete list of arguments.", 500);
			}
		};
		// Проверка на право добавления нового бронирования.
		$this->checkAddPermission(!empty($data->voucher)? $data->voucher : null);
		// Устанавливаем сопутсвующие данные (Например получаем ID клиента при смене телефона)
		$this->prepareMandatoryData($data);
		// Отсекаем данные которые должны поместиться в JSONB
		$newData = [];
		foreach ($this->commonFields as $key => $val) {
			if (array_key_exists($key, $data)) {
				$newData[$key] = $data->$key;
				unset($data->$key);
			}
		};
		if (count((array)$data) > 0) {
			$newData['event_data'] = json_encode($data);
		}
		// Строим SQL запрос
		$sql = 'INSERT INTO bookings (';
		foreach ($newData as $k => $v) {
			$sql .= "$k,";
		};
		$sql = substr($sql, 0, -1); // Обрезаем в конце знак запятой
		$sql .= ') VALUES (';
		foreach ($newData as $k => $v) {
			$sql .= $this->commonFields[$k] . ',';
		};
		$sql = substr($sql, 0, -1); // Обрезаем в конце знак запятой
		$sql .= ')';
		if (!empty($newData['duration'])) {
			$newData['duration'] = $newData['duration'] . ' minutes';
		}
		try {
			$this->logData['new_data'] = $newData;
			$res = $this->db->insert($sql, array_values($newData), 'bookings');
			$this->logData['new_data']['id'] = $res;
			return $res;
		} catch (\Exception $e) {
			$msg = $e->getMessage();
			if (strpos($msg, 'bookings_voucher_fkey') !== false) {
				throw new \Exception($e->getMessage(), 703);
			} elseif (strpos($msg, 'TIMESLOTS_OVERLAPS')) {
				throw new \Exception($e->getMessage(), 704);
			}
			throw new \Exception($e->getMessage(), 500);
		}
	}

	/**
	 * Получить PIN бронирования
	 * @param int $id - ID бронирования
	 * @return \kanri\scalar|NULL
	 */
	function getPinById(int $id)
	{
		if (empty($id)) return NULL;
		return $this->db->selectValue("SELECT pin FROM bookings WHERE id=?", [$id]);
	}

	/**
	 * Получить список бронирований по номеру сертификата
	 * @param $cert - Номер сертификата
	 * @param $excludeIds - список ID бронирований которые следует исключить из выборки
	 * @return array - Массив, где ключ - статус, значение - бронирование
	 */
	function getBookingsByCert($cert, array $excludeIds=[])
	{
		if (empty($cert)) return [];
		if (empty($excludeIds)) $excludeIds[] =0;
		$items = $this->db->selectRows("SELECT * FROM bookings WHERE voucher =? AND id NOT IN (?)", [$cert, implode(',', $excludeIds)]);
		$res = [];
		foreach ($items as $item) {
			$res[$item['status']][] = $item;
		}
		return $res;
	}

	/**
	 * Добавить дополнительный контакт для бронирования
	 * (Телефон обязателен в аргументах)
	 * @param $data - массив вида: [id, name, phone, email]
	 * 				  где:  id    - ID бронирования (обязателен)
	 * 						name  - имя
	 * 						phone - телефон (обязателен)
	 * 						email - почтоый адрес
	 * @return int|null - id добавочного контакта
	 * @throws \Exception
	 */
	function AddContact($data)
	{
		$data = json_decode($data, true);
		if (empty($data)) {
			throw new \Exception('Invalid arguments', 500);
		}
		$customer2 = $this->getCustomerIdByPhone($data['phone'], $data['name'], $data['email']);
		if (empty($customer2)) {
			throw new \Exception('Error create contact', 500);
		}
		try {
			$this->db->execute("UPDATE bookings SET customer2 =?, last_modified=CURRENT_TIMESTAMP WHERE id =?", [$customer2, $data['id']]);
		} catch (\Exception $e) {
			throw new \Exception($e->getMessage(), 500);
		}
		(new Log())->Add('booking', $customer2, $data['id'], 'edited', ['event' => 'add', 'id'=>$customer2, 'phone'=>$data['phone'], 'name'=>$data['name'], 'email'=>$data['email']]);
		return $customer2;
	}

	/**
	 * Заменить customer для бронирования
	 * @param $data - массив данных вида:
	 * 									[
	 * 								        'id'=>123,
	 * 										'phone'=>79057355107,
	 * 										'name'=>'Вася Пупкин',
	 *										'email'=>info@mail.ru,
	 * 									]
	 * @return mixed
	 * @throws \Exception
	 */
	function ChangeContact($data)
	{
		$data = json_decode($data, true);
		if (empty($data)) {
			throw new \Exception('Invalid arguments', 500);
		}
		$customerId = $this->getCustomerOrCreate($data['phone'], $data['name'], $data['email']);
		if (!$customerId) {
			throw new \Exception('Error change contact', 500);
		}
		try {
			$this->db->execute("UPDATE bookings SET customer =?, last_modified=CURRENT_TIMESTAMP WHERE id =?", [$customerId, $data['id']]);
		} catch (\Exception $e) {
			throw new \Exception($e->getMessage(), 500);
		}
		(new Log())->Add('booking', $customerId, $data['id'], 'edited', ['event' => 'edit', 'id'=>$customerId, 'phone'=>$data['phone'], 'name'=>$data['name'], 'email'=>$data['email']]);
		return $customerId;
	}

	/**
	 * Удалить запись путём её АРХИВАЦИИ (применимо к БУФЕРУ и ТО)
	 * @param $data
	 * @param $log
	 * @return bool
	 * @throws \Exception
	 */
	function Delete($data, $log)
	{
		$data = json_decode($data, true);
		$this->logData['log'] = $log? json_decode($log, true) : null;
		$this->logData['new_data'] = $data;
		try {
			$this->db->execute("UPDATE bookings SET last_modified=CURRENT_TIMESTAMP, status = 'archive'::BOOKINGSTATUS WHERE id = ?", [$data['id']]);
		} catch (\Exception $e) {
			throw new \Exception($e->getMessage(), 500);
		}
		return true;
	}

	/**
	 * Получить ID владельца (customer) на которого оформлена бронь
	 * @param $id
	 * @return \kanri\stdClass
	 */
	function getCustomerIdByBookingId($id)
	{
		return $this->db->selectValue('SELECT customer FROM bookings WHERE id=?', [$id]);
	}

	/**
	 * Обновление записи
	 * @param $data - JSON строка с данными (ключ - значение)
	 * @param $log - JSON строка содержащщая данные для логирования
	 * @return int - id редактируемой записи
	 * @throws \Exception
	 */
	function Update($data, $log = null)
	{
		$this->logData['log'] = $log? json_decode($log, true) : null;
		$data = json_decode($data);
		if (empty($data->id)) {
			throw new \Exception("Invalid arguments for Update", 500);
		}
		// Если для бронирования будет присовен ваучер, то проверяем что данный ваучер не привязан к иному АКТИВНОМУ бронированию
		if (!empty($data->voucher)) {
			$this->checkAddPermission($data->voucher, $data->id);
			// Проверяем ваучер на валидность
			$voucherStatus = $this->db->selectValue("SELECT status FROM vouchers WHERE id=?", [$data->voucher]);
			if (in_array($voucherStatus, ['fail', 'refund', 'cancelled'])) {
				throw new \Exception("Error. The voucher is invalid");
			}
		}
		$id = $data->id;
		unset($data->id);
		// Получаем ID пользователя
		$data->uid = $this->app->user()->uid();
		// Запрещаем Стандартный перенос более 2-ух раз
		$this->checkStandardRebooking($id, $data->status, !empty($this->logData['log']['rebook'])? $this->logData['log']['rebook'] : null);
		// Проверка на право переноса бронирования. (Отказ в случаях: Существует активная бронь, или если есть бронь по которой уже отлетали)
		$this->checkRebookPermission($id, !empty($data->status)? $data->status : null);
		// Устанавливаем сопутсвующие данные (Например получаем ID клиента при смене телефона)
		$this->prepareMandatoryData($data);
		// Отсекаем данные которые должны поместиться в JSONB
		$newData = [];
		foreach ($this->commonFields as $key => $val) {
			if (array_key_exists($key, $data)) {
				$newData[$key] = $data->$key;
				unset($data->$key);
			}
		};
		if (count((array)$data) > 0) {
			$newData['event_data'] = json_encode($data);
		}
		// Строим SQL запрос
		$sql = 'UPDATE bookings SET last_modified=CURRENT_TIMESTAMP, ';
		foreach ($newData as $k => $v) {
			$sql .= $k . '=' . $this->commonFields[$k] . ',';
		};
		$sql = substr($sql, 0, -1); // Обрезаем в конце знак запятой
		$sql .= ' WHERE id=?';
		if (!empty($newData['duration'])) {
			$newData['duration'] = $newData['duration'] . ' minutes';
		}
		$newData['id'] = $id;
		$this->logData['new_data'] = $newData;
		$newData = array_values($newData);
		try {
			$this->db->execute($sql, $newData);
		} catch (\Exception $e) {
			throw new \Exception($e->getMessage(), 701);
		}
		return (int)$id;
	}

	/**
	 * Увеличение длительности полета.
	 * Может содержать: Доплату за полет.
	 * @param $data
	 * @param null $log
	 * @return int
	 * @throws \Exception
	 */
	function Surcharge($data, $log = null)
	{
		$this->logData['log'] = $log? json_decode($log, true) : null;
		$data = json_decode($data);
		if (empty($data->id)) {
			throw new \Exception("Invalid arguments for Surcharge", 500);
		}
		$id = $data->id;
		unset($data->id);
		$surchargeValue = 0;
		if (!empty($data->surcharge)) {
			// Получить текущий ID продукта
			$voucherId = $this->db->selectValue("SELECT voucher FROM bookings WHERE id=?", [$id]);
			if (empty($voucherId)) {throw new \Exception("Voucher not found.", 500);}
			$pid = $this->db->selectValue("SELECT pid FROM vouchers WHERE id=?", [$voucherId]);
			if (empty($pid)) {throw new \Exception("PID not found.", 500);}
			$product = $this->db->selectHash("SELECT * FROM products_voucher WHERE id=?", [$pid]);
			if (empty($product)) {throw new \Exception("Product not found.", 500);}
			// Узнать к какому типу продукта относится новое время
			if (strpos($data->duration,':')) {
				list($h, $m) = explode(':', $data->duration);
				$searchDuration = ((int)$m) + ((int)$h*60);
			} else {
				$searchDuration = $data->duration;
			}
			$newProduct = $this->db->selectHash("SELECT * FROM products_voucher 
									  				 WHERE fly_duration = '{$searchDuration} minutes'::interval");
			if (empty($newProduct)) {throw new \Exception("New Product not found.", 500);}
			$surchargeValue = $data->surcharge = $newProduct->price - $product->price;
		} else {
			$data->surcharge = 0; // Обнуляем
		}
		// Получаем ID пользователя
		$data->uid = $this->app->user()->uid();
		// Отсекаем данные которые должны поместиться в JSONB
		$newData = [];
		foreach ($this->commonFields as $key => $val) {
			if (array_key_exists($key, $data)) {
				$newData[$key] = $data->$key;
				unset($data->$key);
			}
		};
		if (count((array)$data) > 0) {
			$newData['event_data'] = json_encode($data);
		}
		// Строим SQL запрос
		$sql = 'UPDATE bookings SET last_modified=CURRENT_TIMESTAMP, ';
		foreach ($newData as $k => $v) {
			$sql .= $k . '=' . $this->commonFields[$k] . ',';
		};
		$sql = substr($sql, 0, -1); // Обрезаем в конце знак запятой
		// Оставляем следы того, что длительность бронирования дольше чем длительность ваучера
		$info = $this->db->selectRows("SELECT event_data, duration FROM bookings WHERE id=?", [$id])[0];
		$event_data = json_decode($info['event_data'], true);
		$event_data['increase_duration'] = (new \DateTime($newData['duration']) > new \DateTime($info['duration']))? 1:0;
		if (empty($event_data['voucher_duration'])) $event_data['voucher_duration'] = $info['duration'];
		$sql .= " , event_data=?::JSON";
		$newData['event_data'] = json_encode($event_data);
		$sql .= ' WHERE id=?';
		if (!empty($newData['duration'])) {
			$newData['duration'] = $newData['duration'] . ' minutes';
		}
		$newData['id'] = $id;
		$this->logData['new_data'] = $newData;
		$newData = array_values($newData);
		try {
			$this->db->execute($sql, $newData);
		} catch (\Exception $e) {
			throw new \Exception($e->getMessage(), 500);
		}
		return (int)$surchargeValue;
	}

	/**
	 * Подсчитать кол-во стандартных переносов бронирования
	 * @param int $id - ID бронирования
	 * @return int - Кол-во стандартных переносов
	 */
	function standardRebookingCount($id)
	{
		return (int) $this->db->selectValue("SELECT COUNT(*) 
										   FROM log 
										   WHERE type='booking' AND object =? 
										   AND event_data::json->>'rebook' =?", [$id, '4']);
	}

	/**
	 * @param int $pid
	 * @param int|NULL $simulatorId
	 * @param string|NULL $dayTime
	 * @param string $startTime
	 * @param string $endTime
	 * @return array
	 * @throws \Exception
	 */
	function getFreeTimeSlots(int $pid, int $simulatorId=NULL, string $dayTime=NULL, $startTime='10 hours', $endTime='22 hours')
	{
		$dayTime = $dayTime?: (new \DateTime())->format('Y-m-d');
		$productType = $this->getProductType($pid);
		if (empty($productType)) { throw new \Exception('Invalid voucher type. Perhaps show attribute is not on.', 500); }
		// Если это A&B - то по умолчанию забираем Airbus
		if (NULL === $simulatorId) {
			$simulatorId = in_array($productType->simulator, [1,2])? $productType->simulator : 2;
		}
		$sql = "SELECT 
					t.*, 
					to_char(t.start, 'HH24:MI') AS time_start,
					to_char(t.end, 'HH24:MI') AS time_end
				FROM tft_timeslots_free_v2(
						?, 
						?::DATE, 
						?, 
						interval '$startTime', 
						interval '$endTime') t";

		return $this->db->selectRows($sql,
			[
				$simulatorId,
				$dayTime,
				$productType->fly_duration
			]
		);
	}

	/**
	 * @param int $pid
	 * @param int|NULL $simulatorId
	 * @param string|NULL $dayTime
	 * @param string $startTime
	 * @param string $endTime
	 * @return array
	 * @throws \Exception
	 */
	function getFreeTimeSlotsAnySimulator(int $pid, int $simulatorId=NULL, string $dayTime=NULL, $startTime='10 hours', $endTime='22 hours')
	{
		$dayTime = $dayTime?: (new \DateTime())->format('Y-m-d');
		$productType = $this->getProductType($pid);
		if (empty($productType)) { throw new \Exception('Invalid voucher type. Perhaps show attribute is not on.', 500); }
		// Если это A&B - то по умолчанию забираем Airbus
		if (NULL === $simulatorId) {
			$simulatorId = in_array($productType->simulator, [1,2])? $productType->simulator : 2;
		}
		$sql = "SELECT 
					t.*, 
					to_char(t.start, 'HH24:MI') AS time_start,
					to_char(t.end, 'HH24:MI') AS time_end
				FROM tft_timeslots_free_any_simulator(
						?, 
						?::DATE, 
						?, 
						interval '$startTime', 
						interval '$endTime') t";

		return $this->db->selectRows($sql,
			[
				$simulatorId,
				$dayTime,
				$productType->fly_duration
			]
		);
	}


	/**
	 * Генерирует SQL запрос для конструирования XML данных что требуются для построения страницы online-booking.
	 * @param int $pid - ID проудкта
	 * @param string|NULL $dayTime - Дата выборки в формате '2018-10-22'
	 * @param string $startDay - Начало работчего дня ('10 hours')
	 * @param string $endDay - Конец рабочего дня ('22 hours')
	 * @return \kanri\kanri\PDO\Dataset|\kanri\PDOStatement
	 * @throws \Exception
	 */
	function getFreeTimeLine(int $pid, string $dayTime=NULL, $startDay='10 hours', $endDay='22 hours')
	{
		if (empty($dayTime)) {
			// tomorrow
			$dayTime = (new \DateTime())->add(new \DateInterval('P1D'))->format('Y-m-d');
		}
		$productType = $this->getProductType($pid);
		if (empty($productType)) {
			throw new \Exception('Invalid voucher type. Perhaps show attribute is not on.', 500);
		}
		$simulator = $productType->simulator;
		if (!in_array($simulator, [1,2])) $simulator = 2; // Если это A&B - то по умолчанию забираем Airbus
		$interval  = $productType->fly_duration;
		return $this->db->select("SELECT t.*, to_char(t.start, 'HH24:MI') AS time_start,
 										to_char(t.end, 'HH24:MI') AS time_end
										FROM tft_timeslots_free_v2(
												?, 
												?::DATE, 
												?, 
												interval '$startDay', 
												interval '$endDay') t",
		[
			$simulator,
			$dayTime?: (new \DateTime())->format('Y-m-d'),
			$interval
		]);
	}

	/**
	 * Выобрка массива свободных time-slot для online бронирования
	 * @param int $pid - ID проудкта
	 * @param string|NULL $dayTime - Дата выборки в формате '2018-10-22'
	 * @param int $simulator - Тип симулятора (1-boeing, 2-airbus)
	 * @param string $startDay - Начало работчего дня ('10 hours')
	 * @param string $endDay - Конец рабочего дня ('22 hours')
	 * @return array
	 * @throws \Exception
	 */
	function getArrayFreeTimeLine(int $pid, string $dayTime=NULL, $simulator=1, $startDay='10 hours', $endDay='22 hours')
	{
		$productType = $this->getProductType($pid);
		$interval  = $productType->fly_duration;
		return $this->db->selectRows("SELECT t.*, to_char(t.start, 'HH24:MI') AS time_start,
 										to_char(t.end, 'HH24:MI') AS time_end
										FROM tft_timeslots_free_v2(
												?, 
												?::DATE, 
												?, 
												interval '$startDay', 
												interval '$endDay') t",
			[
				$simulator,
				$dayTime?: (new \DateTime())->format('Y-m-d'),
				$interval
			]);
	}

	/**
	 * Проверка стандартных переносов. (Не более 2-ух раз)
	 * @param $id - ID бронирования
	 * @param $status - Статус бронирования
	 * @param $transferCase - Тип переноса
	 * @throws \Exception
	 */
	private function checkStandardRebooking($id, $status, $transferCase)
	{
		if ($status === 'rebooking' && $transferCase !== null && $transferCase === '4') {
			if($this->standardRebookingCount($id) >= 2) {
				throw new \Exception('Standard transfers have already been used.', 701);
			}
		}
	}

	/**
	 * Проверка на право переноса бронирования. (Отказ в случаях: Существует активная бронь, или если есть бронь по которой уже отлетали)
	 * @param $id - ID сертификата
	 * @param $status - Статус бронирования
	 * @throws \Exception
	 */
	private function checkRebookPermission($id, $status)
	{
		if ($status !== null && ($status === 'rebooking' || $status === 'technical_rebooking')) {
			$book = $this->Read($id);
			$arr = explode(':', $book->duration);
			$bookingDuration = new \DateInterval('P0Y0DT'.$arr[0].'H'.$arr[1].'M');
			if (!empty($book->voucher)) {
				// Проверяем ваучер на валидность
				$voucherStatus = $this->db->selectValue("SELECT status FROM vouchers WHERE id=?", [$book->voucher]);
				if (in_array($voucherStatus, ['fail', 'refund', 'cancelled'])) {
					throw new \Exception("The voucher is invalid", 702);
				}
				// Получаем все бронирования для данного сертификата
				$books = $this->getBookingsByCert($book->voucher, [$id]);
				if (!empty($books['complete'])) {
					throw new \Exception("The voucher {$book->voucher} is already used.", 702);
				}
				if (!empty($books['refund'])) {
					throw new \Exception("Money is refunded for the voucher {$book->voucher}.", 702);
				}
				if (!empty($books['new']) || !empty($books['rebooking']) || !empty($books['technical_rebooking'])) {
					// Сумируем время существующих активных бронирований. Если это время превышает время ваучера, то кидаем исключение
					$usedDuration = new \DateTime('00:00');
					$voucherDuration = clone $usedDuration;
					foreach (['new', 'rebooking', 'technical_rebooking'] as $status) {
						if (!empty($books[$status])) {
							foreach ($books[$status] as $item) {
								$arr = explode(':', $item['duration']);
								$usedDuration->add(new \DateInterval('P0Y0DT'.$arr[0].'H'.$arr[1].'M'));
							};
						}
					};
					$usedDuration->add($bookingDuration);
					// Длительность ваучера
					$voucherData = (new \takeoff\Vouchers\Store($this->app))->getGiftProperty($book->voucher);
					$voucherDuration->add(\DateInterval::createFromDateString($voucherData->duration . ' minutes'));
					// Проверка
					if ($usedDuration > $voucherDuration) {
						throw new \Exception("An active booking of the voucher {$book->voucher} is already exists.", 702);
					}
				}
			}
		}
	}

	/**
	 * Устанавливаем сопутсвующие данные (Например получаем ID клиента при смене телефона)
	 * @param $data - Данные бронирования
	 */
	private function prepareMandatoryData(&$data)
	{
		// Посредсвтом телефона получаем ID клиента - который будет летать
		if (!empty($data->phone)) {
			$data->customer = $this->getCustomerIdByPhone(
				!empty($data->phone)?$data->phone:NULL,
				!empty($data->fio)?$data->fio:NULL,
				!empty($data->email)? $data->email:null
			);
		}

		// Если указаны дополнительные контактные данные, то из указаного телефона создаем еще одного customer
		if (!empty($data->addition_phone)) {
			$data->customer2 = $this->getCustomerIdByPhone(
				!empty($data->addition_phone)?$data->addition_phone:null,
				!empty($data->addition_fio)? $data->addition_fio:null,
				!empty($data->addition_email)? $data->addition_email:null
			);
		}
	}

	protected $db, $table, $idSeqName, $logData;
	protected $commonFields = [
		'uid'         => '?',
		'pin'         => '?',
		'start'       => '?::TIMESTAMP',
		'duration'    => '?::INTERVAL',
		'simulator'   => '?',
		'rebooking'   => '?',
		'customer'    => '?',
		'customer2'   => '?',
		'voucher'     => '?',
		'confirmed'   => '?::BOOLEAN',
		'type'        => '?::BOOKINGTYPE',
		'pilot'       => '?',
		'comment'     => '?',
		'vip'         => '?::BOOLEAN',
		'vip_comment' => '?',
		'school'      => '?',
		'child'       => '?',
		'corporative' => '?',
		'status'      => '?::BOOKINGSTATUS',
		'preview'     => '?',
		'event_data'  => '?',
		'surcharge'   => '?'
	];
}