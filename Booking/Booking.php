<?php
namespace takeoff\Booking;

use kanri\App;
use kanri\PDO\Model;
use kanri\ActiveRecord;
use kanri\ActiveRecord\Field\Date;

/**
 * Class Booking
 * @package takeoff\Booking
 */
class Booking extends Model implements IBooking
{
	/**
	 * Хэш состояний по категориям
	 */
	const states = [
		'booked' => [ // забронированы - ждут полета
			'new', 				   // новое бронирование
			'rebooking',		   // перенос бронирования
			'technical_rebooking'  // перенос по причине технических проблем
		],
		'pending' => [ // ожидают бронирование
			'fail',                // полет не состоялся по вине клиента
			'technical',           // полет отменен или перенесен по причине поломки симулятора (красный цвет таймслота)
			'archive',             // бронирование перемещенно в архив
			'majeure'              // перенос или отмена полета по ув. причине клиента (подробности в логе)
		],
		'disabled' => [ // бронирование либо полет невозможны
			'refund',              // отмена и возврат денег за полет (по неким основаниям, подробности в логе)
			'complete'             // полет состоялся в штатном режиме
		]
	];

	/**
	 * Booking constructor.
	 * @param int $id - ID букинга
	 * @param ActiveRecord|NULL $ar - объект реализующий ActiveRecord
	 * @param array|NULL $args - ассоциативный массив параметров
	 * @param App|NULL $app
	 */
	public function __construct(int $id, ActiveRecord $ar = NULL, array $args = NULL, App $app = NULL)	{
		$this->app = $app ?? App::getInstance();
		$ar = $ar ?: new Entity($this->app->pdo(), $id);
		parent::__construct($id, $ar, $args, $app);
	}

	/**
	 * Возвращает ID бронирования
	 * @return int
	 */
	public function getId(): int {
		return $this->id;
	}

	/**
	 * Возвращает PIN бронирования
	 * @return string
	 */
	public function getPin(): string {
		return $this->pin;
	}

	/**
	 * Возвращает дату и время начала полета
	 * @param string $format - желаемый формат отображения даты
	 * @return mixed|string
	 * @throws \Exception
	 */
	public function getStart(string $format=''): string {
		if (empty($format)) return $this->start;
		return (new \DateTime($this->start))->format($format);
	}

	/**
	 * Возвращает дату и время окончания полета.
	 * @param string $format - формат возвращаемого значения
	 * @return string
	 * @throws \Exception
	 */
	public function getEnd(string $format=''): string {
		$d = (new \DateTime($this->getStart()))->add($this->getDuration());
		if (empty($format)) return $d;
		return $d->format($format);
	}

	/**
	 * Возвращает продолжительность забронированого полета
	 * @return \DateInterval
	 */
	public function getDuration(): \DateInterval {
		return $this->duration;
	}

	/**
	 * Возвращает ID симулятора
	 * @return int
	 */
	public function getSimulatorId(): int {
		return $this->simulator;
	}

	/**
	 * Возвращает комментарий к бронированию
	 * @return string
	 */
	public function getComment(): string {
		return $this->comment;
	}

	/**
	 * Возвращает ID посадочного талона
	 * @return int|null
	 */
	public function getBoarding():? int {
		return $this->boarding;
	}

	/**
	 * Присваивает ID посадочного талона
	 * @param NULL|int $id
	 * @return Booking
	 */
	public function setBoarding(?int $id): self {
		$this->boarding = $id;
		return $this;
	}

	/**
	 * Сохранить состояние объекта в БД
	 * @return int
	 */
	public function save(): int {
		return $this->ar->save();
	}

	/**
	 * Является ли бронь заброинрованой и ожидающей полета?
	 * @return bool
	 */
	public function isBooked(): bool {
		if (in_array($this->status, self::states['booked'])) {
			return true;
		}
		return false;
	}

	/**
	 * Выборка объекта Booking из БД
	 * @param int $id - ID объекта Booking
	 * @param array|null $args - хэш аргументов
	 * @return array|null
	 */
	protected function query(int $id, ?array $args): ?array
	{
		$sql = "SELECT b.id,
					   b.pin,
					   b.uid,
					   b.start,
					   b.duration,
					   b.simulator,
					   b.rebooking,
					   b.customer,
					   b.customer2,
					   b.voucher,
					   b.boarding,
					   b.confirmed,
					   b.type,
					   b.pilot,
					   b.comment,
					   b.vip,
					   b.vip_comment,
					   b.school,
					   b.child,
					   b.corporative,
					   b.excursion,
					   b.status,
					   b.preview,
					   b.event_data,
					   b.created,
					   b.last_modified,
					   b.surcharge
 				FROM bookings b
 				WHERE b.id = :id";
		$args['id'] = $id;
		$v = $this->db->selectRows($sql, $args);
		return $v[0] ?? NULL;
	}
}