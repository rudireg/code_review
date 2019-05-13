<?php
namespace takeoff\Booking;

/**
 * Interface IBooking
 * @package takeoff\Booking
 */
interface IBooking
{
	/**
	 * Является ли бронь заброинрованой и ожидающей полета?
	 * @return bool
	 */
	public function isBooked(): bool;
}