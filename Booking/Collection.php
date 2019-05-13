<?php
namespace takeoff\Booking;

use kanri\ActiveRecord;
use kanri\App;

/**
 * Class Collection
 * @package takeoff\Booking
 */
class Collection
{
	/**
	 * Collection constructor.
	 * @param int $id
	 * @param App|NULL $app
	 * @param Db|NULL $storage
	 */
	public function __construct(int $id, App $app = NULL, Db $storage = NULL) {
		$this->app = $app? : App::getInstance();
		$this->db = $this->app->pdo();
		$this->storage = $storage? :new Db($this->app);
		$this->bookings = new \ArrayObject([]);
		$this->buildCollection($id);
	}

	/**
	 * Вернуть коллекцию Booking объектов
	 * @return \ArrayObject
	 */
	public function getBookings() {
		return $this->bookings;
	}

	/**
	 * Содержит ли коллекция активный (ожидающий полета) Booking
	 * @return bool
	 */
	public function isHasBooked(): bool
	{
		foreach ($this->bookings AS $booking) {
			if ($booking->isBooked()) return true;
		};
		return false;
	}

	/**
	 * Вернуть активную (ожидающую полет) бронь
	 * @return null|IBooking
	 */
	public function getBooked(): ? IBooking {
		foreach ($this->bookings AS $booking) {
			if ($booking->isBooked()) return $booking;
		};
		return NULL;
	}

	/**
	 * Построить коллекцию букингов
	 * @param int $id - ID ваучера
	 * @return mixed
	 */
	protected function buildCollection(int $id): self
	{
		$ids = $this->storage->getBookingIdsByVoucherId($id);
		foreach ($ids AS $id) {
			$this->bookings->append(new Booking($id));
		};
		return $this;
	}

	/**
	 * @var App
	 */
	protected $app;
	/**
	 * @var ActiveRecord
	 */
	protected $db;
	/**
	 * Работа с БД
	 * @var null|Db
	 */
	protected $storage;
	/**
	 * Коллекция Booking объектов
	 * @var \ArrayObject
	 */
	protected $bookings;
}