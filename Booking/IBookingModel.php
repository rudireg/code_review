<?php
namespace takeoff\Booking;

/**
 * Interface IBookingModel
 * @package takeoff\Booking
 */
interface IBookingModel
{
	/**
	 * @param string $code
	 * @return array
	 */
	public function validateCode(string $code): array;

	/**
	 * Проверка является ли ваучер доступен для бронирования.
	 * @param int $pin - PIN ваучера
	 * @param int $id - ID ваучера
	 * @return bool
	 * @throws \Exception
	 */
	function validateVoucher(int $pin, int $id): bool;

	/**
	 * Вернуть Код статуса после проверки ваучера на доступность к бронированию
	 * @return int
	 */
	public function getValidateCode(): int;

	/**
	 * Вернуть активную (ожидающую полет) бронь
	 * @return IBooking
	 */
	public function getBookedBook(): IBooking;
}