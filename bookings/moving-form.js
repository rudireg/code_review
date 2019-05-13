/**
 * Перенос бронирования
 */
sch.actions.rebooking = function () {
	if ($$("event-form-" + sch.windows.moving.id).validate()) {
		let values = $$("event-form-" + sch.windows.moving.id).getValues();
		values.new_date.setHours(values.new_start_time.getHours(), values.new_start_time.getMinutes(), 0, 0);
		let transferCase = parseInt($$('transfer-case-' + sch.windows.moving.id).getValue());
		let newData = {
			id: sch.tmpEvent.eid,
			status: (transferCase === 6)?'technical_rebooking':'rebooking',
			start: sch.formatYmdHis(values.new_date),
			simulator: values.simulator_id
		};
		let log = {
			prev_state: sch.current.event.status,
			event: 'move',
			rebook: $$('transfer-case-' + sch.windows.moving.id).getValue(),
			comment: $$("comment-" + sch.windows.moving.id).getValue()
		};
		if (log.rebook === '5') {
			log.reason = $$('reason-' + sch.windows.moving.id).getValue();
		}
		webix.ajax().post('/RPC/takeoff/Booking/Store/Update', {'data':newData, 'log': log}, function (updateId) {
			if (parseInt(updateId) > 0) {
				try {
					sch.scheduler.endLightbox(true, document.getElementById("window-" + sch.windows.moving.id)); // Строго первым на выполнение
				} catch (e){}
				// Если нужно обновить визуализацию в календаре
				let allEvents = sch.scheduler.getEvents();
				let tmp = sch.getDataIfExistsPropertyInArray(allEvents, 'eid', sch.current.event.eid);
				let transferCase = parseInt($$('transfer-case-' + sch.windows.moving.id).getValue());
				let typeRebooking = '';
				if (sch.current.event.status === 'technical_rebooking') {
					typeRebooking = sch.current.event.status;
				} else {
					typeRebooking = (transferCase === 6)?'technical_rebooking':'rebooking';
				}
				if (tmp !== null) {
					if (sch.bufferId === null || sch.bufferId === undefined) {
						sch.bufferId = tmp.id;
					}
					if (sch.isDragMode === undefined || sch.isDragMode === null || sch.isDragMode === false ||
						sch.draggedEvent === null || sch.draggedEvent === undefined || sch.draggedEvent === false)
					{
						let ev = sch.scheduler.getEvent(sch.bufferId);
						sch.scheduler.getEvent(sch.bufferId).status     = typeRebooking;
						sch.scheduler.getEvent(sch.bufferId).start_date = new Date(newData.start);
						sch.scheduler.getEvent(sch.bufferId).end_date   = new Date(ev.start_date.getTime() + sch.overlap.getTime(ev.duration));
						sch.scheduler.getEvent(sch.bufferId).section_id = parseInt(newData.simulator);
						sch.scheduler.updateEvent(sch.bufferId);
					} else {
						sch.scheduler.getEvent(sch.draggedEvent.id).status = typeRebooking;
						sch.scheduler.updateEvent(sch.draggedEvent.id);
					}
				}
				$$("window-" + sch.windows.moving.id).hide();
				webix.message({
					text:"The booking is transferred successfully.",
					type:"info",
					expire: 5000
				});
				sch.clearGarbage(); // Чистим мусор
				return true;
			} else {
				webix.alert({
					text:"Transfer error!",
					type:"error",
					expire: 5000
				});
				return false;
			}
		}).fail(function (xhr) {
			webix.alert({
				css: 'booking-error-alert',
				text: "Error! " + xhr.responseText,
				type: 'error',
				expire: 5000
			});
			return false;
		});
	}
};

/**
 * Перенос буфера без подверждающего окна.
 * Применяется для БУФЕРА и СЕРВИСА.
 * @param item
 */
sch.actions.doDragEndBuffer = function (item) {
	let different = item.end_date - item.start_date;
	if (different > 0) {
		different = different / 1000 / 60; // to minutes
		different = sch.overlap.minutesToHi(different);
	} else {
		different = null;
	}
	let duration = different? different : item.duration;

	let newData = {
		id: item.eid,
		status: 'rebooking',
		start: sch.formatYmdHis(item.start_date),
		simulator: item.section_id,
		duration: duration
	};
	let log = {
		prev_state: sch.current.event.status,
		event: 'move',
		rebook: '',
		comment: '',
		duration: duration
	};
	webix.ajax().post('/RPC/takeoff/Booking/Store/Update', {'data':newData, 'log': log}, function (updateId) {
		if (parseInt(updateId) > 0) {
			// Если нужно обновить визуализацию в календаре
			let allEvents = sch.scheduler.getEvents();
			let tmp = sch.getDataIfExistsPropertyInArray(allEvents, 'eid', sch.current.event.eid);
			if (tmp !== null) {
				sch.scheduler.getEvent(sch.draggedEvent.id).status     = 'rebooking';
				sch.scheduler.getEvent(sch.draggedEvent.id).start_date = item.start_date;
				sch.scheduler.getEvent(sch.draggedEvent.id).end_date   = item.end_date;
				sch.scheduler.getEvent(sch.draggedEvent.id).section_id = newData.simulator;
				sch.scheduler.getEvent(sch.draggedEvent.id).duration   = duration;
				sch.scheduler.updateEvent(sch.draggedEvent.id);
			}
		} else {
			webix.alert({
				text:"Transfer error!",
				type:"error",
				expire: 5000
			});
			return false;
		}
		return true;
	});
};

/**
 * Очистка формы переноса
 */
function clearFormMoving() {
	let id = sch.windows.moving.id;
	$$("event-form-" + id).clearValidation();
	$$("new-date-" + id).setValue(new Date());
	$$('transfer-case-' + id).setValue(4); // Standard
	$$('transfer-case-' + id).focus();
	$$('reason-' + id).setValue(8); // Comment
	$$('reason-' + id).hide();
	$$("comment-" + id).setValue('');
	$$("comment-" + id).show();
	sch.lockBusyHours(id, new Date(), sch.excludeDate || null);
}

/**
 * Перенос бронирования
 */
const movingEvent = {
	view:"window",
	hidden: true,
	modal:true,
	id:"window-" + sch.windows.moving.id,
	position:"center",
	move:true,
	height:600,
	width:900,
	head: {
		view:"toolbar",
		id: "toolbar-" + sch.windows.moving.id,
		cols:[
			{ view:"label", label: "", id:"toolbar-simulator-" + sch.windows.moving.id, align:"left", width: 150 },
			{ view:"label", label: "", id:"toolbar-time-" + sch.windows.moving.id, align:"left" },
			{
				view:"icon",
				id:"toolbar-close-icon-" + sch.windows.moving.id,
				icon: 'wxi-close',
				align:"right",
				on: {
					onItemClick: function () {
						sch.scheduler.endLightbox(false, document.getElementById("window-" + sch.windows.moving.id)); // Строго первым на выполнение
						if (sch.draggedEvent !== undefined && sch.draggedEvent.id !== undefined) {
							sch.resetEventPosition(sch.draggedEvent.id);
							sch.clearGarbage(); // Чистим мусор
						}
						this.getTopParentView().hide();
					}
				}
			}
		]
	},
	on:  {
		onShow: clearFormMoving
	},
	body: {
		rows: [
			{
				view: "form",
				id: "event-form-" + sch.windows.moving.id,
				Height:600,
				width:900,
				elements:[
					{
						rows:[
							{
								cols:[
									{
										view:"radio",
										name:'simulator_id',
										id:'simulator-id-' + sch.windows.moving.id,
										label:"Simulator",
										labelWidth:100,
										value:1,
										css: 'color-plane-radio-button',
										options:[
											{"id":2, "value":"Airbus"},
											{"id":1, "value":"Boing"}
										],
										on:{
											onChange: function (newv, oldv) {
												let date = $$("new-date-" + sch.windows.moving.id).getValue();
												sch.lockBusyHours(sch.windows.moving.id, date, sch.excludeDate);
											}
										}
									}
								]
							},
							{
								cols:[
									{
										rows:[
											{view:'label', label:'New date'},
											{
												view:"calendar",
												name: "new_date",
												id: "new-date-" + sch.windows.moving.id,
												labelPosition:'top',
												align: "left",
												label: "New date",
												value: new Date(),
												minDate: (new Date()).setTime((new Date()).getTime() - 24 * 60 * 60 * 1000), // Минус сутки от текущей даты
												validate:webix.rules.isNotEmpty,
												on:{
													onDateselect:function(date) {
														sch.lockBusyHours(sch.windows.moving.id, date, sch.excludeDate);
													}
												}
											}
										]
									},
									{width:20},
									{
										rows:[
											{view:'label', label:'New time'},
											{
												view:"kanri-calendar-time",
												calendarTime:"%H:%i",
												name: "new_start_time",
												id: "datepicker-start-time-" + sch.windows.moving.id,
												minTime: sch.settings.calendar_start_time + ':00',
												maxTime: sch.settings.calendar_end_time + ':00',
												minuteStep: sch.overlap.minuteStep,
												validate:webix.rules.isNotEmpty,
												blockTime:function(date){
													if (sch.busyTime === undefined) {
														return false;
													}
													date.setSeconds(0, 0);
													let d = date.getTime() / 1000;
													for(let i = 0; i < sch.busyTime.length; i++){
														if(sch.busyTime[i] === d) {
															return true;
														}
													}
													return false;
												}
											}
										]
									},
									{width:20},
									{
										rows:[
											{view:'label', label:'Rebooking reason'},
											{
												view:"select",
												name:'transfer_case',
												id:'transfer-case-' + sch.windows.moving.id,
												options: sch.thesaurus.rebook,
												on:{
													onChange: function (newv, oldv) {
														if (newv === '5') { // majeure
															$$('reason-' + sch.windows.moving.id).show();
															$$('reason-' + sch.windows.moving.id).setValue(8);
															$$('reason-' + sch.windows.moving.id).focus();
														} else {
															$$('reason-' + sch.windows.moving.id).hide();
															$$("comment-" + sch.windows.moving.id).focus();
														}
													}
												}
											},
											{
												view:"select",
												name:'reason',
												id:'reason-' + sch.windows.moving.id,
												value:8,
												invalidMessage: 'Try select a rebooking reason',
												options: sch.thesaurus.reason,
												on:{
													onChange: function (newv, oldv) {
														$$("comment-" + sch.windows.moving.id).focus();
													}
												}
											},
											{
												view:"textarea",
												placeholder:"Comment",
												name:'comment',
												id:"comment-" + sch.windows.moving.id,
												invalidMessage:'Write a comment',
												required:true,
												height:150,
												validate: function (value) {
													return !(value.trim().length < 1 && $$('transfer-case-' + sch.windows.moving.id).getValue() === '5');
												}
											}
										]
									}
								]
							}
						]
					},
					{
						cols:[
							{},
							{ view:"button", type:"form", css:'btn-primary', id:"create-button-" + sch.windows.moving.id, value:"Apply", width:170, align:'left',
								on:{
									onItemClick: function (){
										if($$("event-form-" + sch.windows.moving.id).validate()) {
											machine.model.changeStateTo(sch.current.event.status);
											machine.model.dispatch('rebook');
										}
									}
								}
							},
							{
								view:"button",
								id:'cancel-button-' + sch.windows.moving.id,
								css:"bt_cancel",
								value:"Cancel",
								width:150,
								align:'right',
								on: {
									onItemClick: function () {
										sch.scheduler.endLightbox(false, document.getElementById("window-" + sch.windows.moving.id)); // Строго первым на выполнение
										if (sch.draggedEvent !== undefined && sch.draggedEvent.id !== undefined) {
											sch.resetEventPosition(sch.draggedEvent.id);
											sch.clearGarbage(); // Чистим мусор
										}
										this.getTopParentView().hide();
									}
								}
							}
						]
					}
				]
			}
		]
	}
};
