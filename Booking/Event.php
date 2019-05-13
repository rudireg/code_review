<?php
namespace takeoff\Booking;

use kanri\App;
use takeoff\Model\Base;
use takeoff\Customers\Customer;
use takeoff\Products\Voucher\Voucher;

/**
 * Class Event
 * @package takeoff\Booking
 */
class Event
{
	/**
	 * Event constructor.
	 * @param App|NULL $app
	 */
	public function __construct(App $app=NULL) {
		$this->app = $app ?? App::getInstance();
	}

	/**
	 * Обработка события - Ваучер забронирован
	 * @param int $voucherId
	 * @param int $bookingId
	 * @param int $customerId
	 */
	public function voucher_booked(int $voucherId, int $bookingId, int $customerId)
	{
		if (empty($voucherId) || empty($bookingId) || empty($customerId)) return;
		// Помечаем ваучер как забронированный
		$voucher = new Voucher($voucherId);
		$voucher->setBooked()->save();
		// Отсылаем письмо тому кто будет летать
		$mNotifier = Base::objectFactory('notifier');
		$mNotifier->voucherBooked(new Voucher($voucherId), new Booking($bookingId), new Customer($customerId));
		// отсылаем сигнал администратору в случае если онлайн-бронирование имеет комментарий
		$booking = new Booking($bookingId);
		$comment = $booking->getComment();
		if (!empty($comment) && !empty($_COOKIE['carrotquest_uid'])) {
			$comment = "ONLINE BOOKING $bookingId \n$comment";
			(new \takeoff\Customers\CarrotQuest($this->app))->sendMessage($_COOKIE['carrotquest_uid'], $comment);
		}
	}

	protected $app;
}