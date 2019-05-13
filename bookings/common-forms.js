/**
 * Человекоподобный выбор времени полета
 * @param id
 * @param synchronize
 * @param value - значение счетчика по умолчанию
 * @returns {{cols: [null,null]}}
 */
const humanTimeSelect = function (id, synchronize = false, value=30) {
	return {
		cols:[
			{
				view:'counter',
				label:'Time (min.)',
				labelWidth: 95,
				width:200,
				id:'time-select-' + id,
				name: 'duration',
				step:30,
				value:value,
				min:30,
				max:1440,
				on: {
					onChange: function (newv, oldv) {
						let getHourName = function (hour) {
							if (hour === 1) {return 'hour';}
							if (hour >=2 && hour <= 4) {return 'hours';}
							if (hour >=5) {return 'hours';}
							return ' ';
						};
						let txt = newv + ' minutes';
						let minute = newv;
						let hour = parseInt(newv / 60);
						if (hour > 0) {
							minute = minute - (hour * 60);
							txt = hour + ' ' + getHourName(hour) + ((minute)? ' ' + minute + ' minutes' : '');
						}
						$$('time-select-view-' + id).setValue(txt);
						if (synchronize === true && sch.current.event.end_date !== undefined) {
							// Синхронизируем расположение event в scheduler в соответсвии с полученной длитеностью полета
							sch.current.event.end_date = new Date(sch.current.event.start_date.getTime() + (newv * 60 * 1000));
							sch.scheduler.updateEvent(sch.current.event.id);
						}
					}
				}
			},
			{ view:"label", id: 'time-select-view-' + id, label:"30 minutes", align: 'left'}
		]
	};
};

/**
 * Данные сертификата (POPUP)
 */
const dbStatePopup = {
	view: "popup",
	id: "db-state-popup",
	width: 400,
	body: {
		id:"db-state-layout",
		rows:[
			{
				height:30,
				cols:[
					{ view:"label", label:"Status", labelWidth:100 },
					{ view:"label", id:"db-state-status", label:"", align:"left"}
				]
			},
			{
				id:'activate_date',
				height:30,
				cols:[
					{ view:"label", label:"Activate date", labelWidth:100 },
					{ view:"label", id:"db-activate-date", label:"", align:"left"}
				]
			},
			{
				height:30,
				cols:[
					{ view:"label", label:"Date expires", labelWidth:100 },
					{ view:"label", id:"db-state-expire", label:"", align:"left"}
				]
			},
			{
				height:30,
				cols:[
					{ view:"label", label:"Flight date", labelWidth:100 },
					{ view:"label", id:"db-state-booking", label:"", align:"left"}
				]
			},
			{
				height:30,
				cols:[
					{ view:"label", label:"Pilot", labelWidth:100 },
					{ view:"label", id:"db-state-pilot", label:"", align:"left"}
				]
			},
			{
				id: 'duplicate-bookings-block',
				rows:[
					{
						cols:[
							{ view:"label", label:"Number existing bookings:", labelWidth:200 },
							{ view:"label", id:'duplicate-bookings-count', label:"", align:'left' }
						]
					},
					{
						id:"duplicate-bookings-view",
						view:"dataview",
						select:true,
						xCount:1,
						yCount:1,
						type:{
							width: 400,
							height: 200
						},
						template:
						"<span class='overall'>" +
						"<span>id: <strong>#id# </strong></span>" +
						"<span> Owner: <strong>#customer#</strong></span>" +
						"<div>Admin: <strong>#admin#</strong></div>" +
						"<div>Pilot: <strong>#pilot#</strong></div>" +
						"<div>" +
						"<span>Start: <strong>#start#</strong></span>" +
						"<span> Flight: <strong>#duration#</strong></span>" +
						"</div>" +
						"<span>Type: <strong>#type#</strong></span>" +
						"<span> Status: <strong>#status#</strong></span>" +
						"<div><textarea style='height:40px;width:340px;'>#comment#</textarea></div>" +
						"</div>",
						data:[]
					}
				]
			}
		]
	}
};

/**
 * Инициализация кнопок - в случае если используется endLightbox
 * и бывает необходимость на отмене удалить визуальное представление бронирования на календаре
 * @param id
 */
function initCloseCancelButtons(id) {
	let html = function(ids) { return document.getElementById(ids); }; //just a helper
	// Cancel button
	$$('cancel-button-' + id).attachEvent("onItemClick",function(){
		if (sch.tmpEventId !== null && sch.tmpEventId !== undefined) {
			sch.scheduler.deleteEvent(sch.tmpEventId);
			sch.tmpEventId = null;
		}
		sch.scheduler.endLightbox(false, html("window-" + id));
		$$("window-" + id).hide();
	});
	// Close button
	$$("toolbar-close-icon-" + id).attachEvent("onItemClick",function(){
		if (sch.tmpEventId !== null && sch.tmpEventId !== undefined) {
			sch.scheduler.deleteEvent(sch.tmpEventId);
			sch.tmpEventId = null;
		}
		sch.scheduler.endLightbox(false, html("window-" + id));
		$$("window-" + id).hide();
	});
}

/**
 * Отобразить форму поиска бронирования
 */
function showSearchForm() {
	$$("window-" + sch.windows.customer_search.id).show();
}

/**
 * Обновить события календаря
 */
function updateSchedulerEvents() {
	nw.App.clearCache();
	//nw.windows.reloadIgnoringCache();
}

/**
 * Тип события
 * @param id
 * @param noneId - Бронирование без сертификата //todo: DEPRECATED
 */
const eventType = function (id, noneId = false) {
	return {
		view:"select",
		value: 'flight',
		label:"Type of flight",
		id:'event-type-' + id,
		name: 'type',
		labelWidth:100,
		options: sch.thesaurus.booking_type
	};
};

// Объект для работы с типами BOOKINGTYPE таблицы bookings
const bookType = {};
// Карта соответсвий
bookType.map = {
	19:'flight',
	20:'school',
	21:'corporative',
	22:'child',
	23:'marketing',
	24:'friend',
	49:'excursion'
};
/**
 * Конвертировать ID thesaurus -> ID BOOKINGTYPE
 * @param id - ID thesaurus
 * @returns {string}
 */
bookType.getBookingType = function (id) {
	if (bookType.map[id] !== undefined) {
		return bookType.map[id];
	}
	return bookType.map[19]; // flight
};

/**
 * Конвертировать ID BOOKINGTYPE -> ID thesaurus
 * @param id - ID BOOKINGTYPE
 * @returns {*}
 */
bookType.getThesaurusId = function (id) {
	for (let tid in bookType.map) {
		if (bookType.map[tid] === id) {
			return tid;
		}
	}
	return undefined;
};

/**
 * HotKeys
 */
webix.UIManager.addHotKey("ctrl+S",   function () {
	$$('window-' + sch.windows.customer_search.id).show();
});

/**
 * Фактический возврат денег из модуля ваучеров
 * @param voucherId
 * @param reason
 * @param comment
 */
const doRefundFromVoucher = function (voucherId, reason, comment) {
	let args = {
		'initiator': 'voucher',
		'id': voucherId,
		'status': 'refund',
		'comment': comment,
		'reason': reason
	};
	webix.ajax().post('/RPC/takeoff/Vouchers/Store/doBookingRefund', args, function (res) {
			res = JSON.parse(res);
			if (res) {
				$$('window-refund-voucher').hide();
			} else {
				webix.alert({
					type:'Error',
					text:"Something wrong!"
				});
			}
		}
	);
};

/**
 * Форма возврата денежных средств за ваучер
 * Может вызываться из двух модулей: 1) Из календаря 2) Из ваучера
 * Если вызов идет из модуля Ваучер, то перед возвратом просиходит проверка на существование броний для данного ваучера
 * и если бронирования обнаруженны, показывается предупреждение об их существовании.
 * Если пользователь подтверждает возврат денег, то проиходит возврат денег за ваучер и все активные брони отменяются.
 */
const showRefundForm = function (formId, calledFrom) {
	return {
		view:'form',
		id: 'form-refund-voucher-' + formId,
		padding:10,
		width: 500,
		rows: [
			{view:'label', id:'voucher-id-refund-' + formId, hidden:true, value:''},
			{
				view:"richselect",
				id:'refund-reason-' + formId,
				name:'reason',
				label:"Refund reason",
				labelWidth:130,
				required:true,
				invalidMessage:'Select refund reason',
				value:0,
				options:'/RPC/takeoff/Thesaurus/Store/Read?type=reason'
			},
			{
				view:"textarea",
				id:'refund-comment-' + formId,
				name:'comment',
				height:50,
				value: "",
				placeholder:'Type comment'
			},
			{
				cols:[
					{ view:"button", type:"form", css:'btn-primary', value:"Apply", width:150, align:'left',
						on:{
							onItemClick: function (){
								if ($$('form-refund-voucher-' + formId).validate()) {
									webix.confirm({
										text:"Are you sure?",
										callback: function(result){
											let voucherId = $$('voucher-id-refund-' + formId).getValue();
											if (result) {
												if (calledFrom === 'booking') {
													machine.model.changeStateTo(sch.current.event.status);
													machine.model.dispatch('refund');
												} else {
													// Проверка есть ли бронирования связанные с ваучером
													webix.ajax().post('/RPC/takeoff/Booking/Store/getBookingsByCert', {'cert':voucherId}, function (res) {
														res = JSON.parse(res);
														if (res['new'] !== undefined || res['rebooking'] !== undefined || res['technical_rebooking'] !== undefined) {
															let count = 0;
															if (res['new'] !== undefined) {count += res['new'].length;}
															if (res['rebooking'] !== undefined) {count += res['rebooking'].length;}
															if (res['technical_rebooking'] !== undefined) {count += res['technical_rebooking'].length;}
															if (count > 0) {
																webix.confirm({
																	text:"There are " + count + " bookings will be canceled in calendar.\n Continue?",
																	callback: function (confirm) {
																		if (confirm) {
																			doRefundFromVoucher(
																				voucherId,
																				$$('refund-reason-' + formId).getValue(),
																				$$('refund-comment-' + formId).getValue()
																			);
																		}
																	}
																});
															} else {
																doRefundFromVoucher(
																	voucherId,
																	$$('refund-reason-' + formId).getValue(),
																	$$('refund-comment-' + formId).getValue()
																);
															}
														} else {
															doRefundFromVoucher(
																voucherId,
																$$('refund-reason-' + formId).getValue(),
																$$('refund-comment-' + formId).getValue()
															);
														}
													});
													$$('window-refund-voucher').hide();
												}
											}
										}
									});
								}
							}
						}
					},
					{},
					{
						view:"button",
						css:"bt_cancel",
						value:"Cancel",
						width:150,
						align:'right',
						click: function () {
							this.getTopParentView().hide();
						}
					}
				]
			}
		]
	};
};

/**
 * Форма отката ваучера
 */
const showRevertForm = function (formId) {
	return {
		view:'form',
		id: 'form-revert-voucher-' + formId,
		padding:10,
		width: 500,
		rows: [
			{view:'label', id:'voucher-id-revert-' + formId, hidden:true, value:''},
			{
				view:'label',
				label:'',
				id: 'revert_voucher_id',
				name: 'id',
				hidden: true
			},
			{
				view:"label",
				label: "The Voucher status will be the NEW status.",
				align:"left"
			},
			{
				view:"checkbox",
				id:"revert_pilot_salary",
				name:'salary',
				value:0,
				css:'no-label',
				labelRight:"Delete the pilot`s timing"
			},
			{
				view:'textarea',
				id:'revert_comment',
				name:'comment',
				label:"Type comment",
				labelPosition: 'top',
				height:100,
				required:true,
				invalidMessage:'Type comment',
			},
			{
				cols:[
					{ view:"button", type:"form", css:'btn-primary', value:"Apply", width:150, align:'left',
						on:{
							onItemClick: function () {
								if ($$('form-revert-voucher-' + formId).validate()) {
									webix.confirm({
										text:"Are you sure?",
										callback: function(result) {
											let revertData = $$('form-revert-voucher-' + formId).getValues();
											if (result) {
												webix.ajax().post('/RPC/takeoff/Vouchers/Store/RevertVoucher', revertData, function (res) {
													res = JSON.parse(res);
													if (res['success'] === undefined) {
														webix.message('Error of voucher revert.', 'error');
													}
													$$('window-revert-voucher').hide();
												});
											}
										}
									});
								}
							}
						}
					},
					{},
					{
						view:"button",
						css:"bt_cancel",
						value:"Cancel",
						width:150,
						align:'right',
						click: function () {
							this.getTopParentView().hide();
						}
					}
				]
			}
		]
	};
};
