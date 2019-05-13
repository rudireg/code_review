const machine = {};

/**
 * Ф-ция Полет состоялся
 */
sch.actions.complete = function () {
	let log = {
		prev_state: sch.current.event.status,
		event:'fly',
		start_date: $$("start-date-" + sch.windows.complete.id).getValue(),
		start_time: $$("start-time-" + sch.windows.complete.id).getValue(),
		end_time: $$("end-time-" + sch.windows.complete.id).getValue(),
		simulator: $$('simulator-' + sch.windows.complete.id).getValue(),
		voucher: $$('voucher-' + sch.windows.complete.id).getValue().trim(),
		pilot: $$("pilot-" + sch.windows.complete.id).getValue(),
		rate: $$("rate-" + sch.windows.complete.id).getValue(),
		comment: $$("comment-" + sch.windows.complete.id).getValue()
	};
	webix.ajax().post('/RPC/takeoff/Vouchers/Store/Complete', {
		'initiator':'booking',
		'id': sch.current.event.eid,
		'status':'complete',
		'log':log
	}, function (updateId) {
		if (parseInt(updateId) > 0) {
			sch.scheduler.getEvent(sch.current.event.id).status = 'complete';
			sch.scheduler.updateEvent(sch.current.event.id);
			$$('window-' + sch.windows.complete.id).hide();
		} else {
			webix.alert({
				text:"Error of setting the status: Flight is completed!"
			});
		}
	}).fail(function (xhr) {
		webix.alert({
			text:"Error of setting the status: Flight is completed !!!"
		});
	});
};

/**
 * Архивация
 */
sch.actions.archive = function () {
	let data = {
		id: sch.current.event.eid,
		status: 'archive'
	};
	let log = {
		prev_state: sch.current.event.status,
		event:'archive'
	};
	webix.ajax().post('/RPC/takeoff/Booking/Store/Update', {'data':data, 'log':log}, function (updateId) {
		if (parseInt(updateId) > 0) {
			sch.scheduler.deleteEvent(sch.current.event.id);
		} else {
			webix.alert({
				text:"Archive error!"
			});
		}
	}).fail(function (xhr) {
		webix.alert({
			text:"Archive error!"
		});
	});
};

/**
 * Возврат денег
 */
sch.actions.refund = function () {
	let log = {
		prev_state: sch.current.event.status,
		event:'refund',
		refund_reason: $$('refund-reason-from-booking').getValue(),
		refund_comment: $$('refund-comment-from-booking').getValue()
	};
	webix.ajax().post('/RPC/takeoff/Vouchers/Store/doBookingRefund', {
		'initiator': 'booking',
		'id': sch.current.event.eid,
		'status': 'refund',
		'log': log
	}, function (updateId) {
		if (parseInt(updateId) > 0) {
			webix.message({text:"The voucher is refunded successfully.", type:'info'});
			// Нужно ли визуальное обновление плашки в календаре
			let allEvents = sch.scheduler.getEvents();
			let tmp = sch.getDataIfExistsPropertyInArray(allEvents, 'eid', sch.current.event.eid);
			if (tmp !== null) {
				sch.scheduler.getEvent(sch.current.event.id).status = 'refund';
				sch.scheduler.updateEvent(sch.current.event.id);
			}
			$$('window-' + sch.windows.refund.id).hide();
			return true;
		} else {
			webix.alert({text:"Refund error!!!", type:'error'});
			return false;
		}
	}).fail(function (xhr) {
		let msg = 'Refund error!!';
		if (xhr.status > 700) {
			msg = xhr.responseText;
		}
		webix.alert({text:msg, type:'error'});
	});
};

/**
 * Методы автомата
 */
machine.methods = {
	complete: () => {
		sch.actions.complete();
	},
	cancel: () => {
		sch.actions.cancel();
	},
	rebook: () => {
		sch.actions.rebooking();
	},
	archive: () => {
		sch.actions.archive();
	},
	refund: () => {
		sch.actions.refund();
	}
};

/**
* Конечный автомат
 */
machine.model = {
	dispatch(actionName, ...payload) {
		const actions = this.transitions[this.state];
		const action = this.transitions[this.state][actionName];
		if (action) {
			action.apply(machine, payload);
		} else {
			webix.alert({
				text:'The machine method: ' + actionName + ' not allowed for the state: ' + this.state,
				type:'alert-error',
				title: 'Failed'
			});
		}
	},
	changeStateTo(newState) {
		this.state = newState;
	},
	state: 'new', // Default state
	transitions: {
		'new': {
			complete: machine.methods.complete,
			cancel:   machine.methods.cancel,
			rebook:   machine.methods.rebook,
			refund:  machine.methods.refund
		},
		'technical_rebooking': {
			complete: machine.methods.complete,
			cancel:   machine.methods.cancel,
			rebook:   machine.methods.rebook,
			refund:  machine.methods.refund
		},
		'rebooking': {
			complete: machine.methods.complete,
			cancel:   machine.methods.cancel,
			rebook:   machine.methods.rebook,
			refund:  machine.methods.refund
		},
		'complete': {}, // Нет действий
		'fail': {
			rebook:  machine.methods.rebook,
			archive: machine.methods.archive,
			refund:  machine.methods.refund
		},
		'majeure': {
			rebook:  machine.methods.rebook,
			archive: machine.methods.archive,
			refund:  machine.methods.refund
		},
		'technical': {
			rebook:  machine.methods.rebook,
			archive: machine.methods.archive,
			refund:  machine.methods.refund
		},
		'refund': {
			archive: machine.methods.archive
		},
		'archive': {} // Нет действий
	}
};
