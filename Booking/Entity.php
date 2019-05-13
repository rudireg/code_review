<?php
namespace takeoff\Booking;

use kanri\ActiveRecord;

/**
 * Class Entity
 * @package takeoff\Booking
 */
class Entity extends ActiveRecord
{
	/**
	 * Entity constructor.
	 * @param $db
	 * @param int $id - ID букинга
	 */
	function __construct($db, int $id=0)
	{
		parent::__construct($id, 'bookings', $db);
		$this->IntUnsigned('id');
		$this->IntUnsigned('pin');
		$this->FK('uid');
		$this->DateTime('start');
		$this->Interval('duration');
		$this->FK('simulator');
		$this->FK('rebooking');
		$this->FK('customer');
		$this->FK('customer2');
		$this->FK('voucher');
		$this->FK('boarding');
		$this->BoolSimple('confirmed');
		$this->Text('type');
		$this->FK('pilot');
		$this->Text('comment');
		$this->BoolSimple('vip');
		$this->Text('vip_comment');
		$this->IntUnsigned('school');
		$this->IntUnsigned('child');
		$this->IntUnsigned('corporative');
		$this->FK('excursion');
		$this->Text('status');
		$this->FK('preview');
		$this->Json('event_data');
		$this->DateTime('created');
		$this->DateTime('last_modified');
		$this->IntUnsigned('surcharge');
	}
}