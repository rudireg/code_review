<?php
namespace takeoff\Booking;

use function Sodium\add;

trait tShared {
	/**
	 * Проверка на право добавления нового бронирования.
	 * Отказ в случаях: 1) Существует активная бронь
	 *					2) Полет состоялся
	 *                  3) Вернули деньги
	 * @param $voucher - ID сертификата
	 * @param $bookingId - ID бронирования
	 * @throws \Exception
	 */
	public function checkAddPermission($voucher, $bookingId = null)
	{
		$voucher = (int)$voucher;
		if (!empty($voucher)) {
			$books = $this->getBookingsByCert($voucher);
			if (!empty($books['new']) || !empty($books['rebooking']) || !empty($books['technical_rebooking'])) {
				if ($bookingId === null) throw new \Exception("Active booking for voucher {$voucher} already exists.", 701);
				// Если передали ID бронирования, сумируем длительность существующих АКТИВНЫХ броней и сравниваем результат с новым бронированием.
				// Если новое бронирование не умещается в свободное время, то кидаем исключение
				$booking = $this->Read($bookingId);
				$arr = explode(':', $booking->duration);
				$bookingDuration = new \DateInterval('P0Y0DT'.$arr[0].'H'.$arr[1].'M');
				if (empty($booking)) throw new \Exception("checkAddPermission did not find the bookingId: {$bookingId}", 701);
				// Сумма существующих АКТИВНЫХ бронирований
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
				$voucherData = (new \takeoff\Vouchers\Store($this->app))->getGiftProperty($voucher);
				$voucherDuration->add(\DateInterval::createFromDateString($voucherData->duration . ' minutes'));
				// Проверка
				if ($usedDuration > $voucherDuration) throw new \Exception("checkAddPermission: There is no free time for new booking.", 701);
			}
			if (!empty($books['complete'])) {
				throw new \Exception("The voucher: {$voucher} have already been used.", 701);
			}
			if (!empty($books['refund']) || $this->isRefund($voucher)) {
				throw new \Exception("The voucher: {$voucher} is refunded.", 701);
			}
		}
	}
}