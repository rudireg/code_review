/**
 * Заголовок окна бронирования
 */
const getToolbarHeader = function (id) {
	return {
		view:"toolbar",
		id: "toolbar-" + id,
		cols:[
			{ view:"label", label: "", id:"toolbar-simulator-" + id, align:"left", width: 150 },
			{ view:"label", label: "", id:"toolbar-time-" + id, align:"left" },
			{
				view:"icon",
				id:"toolbar-close-icon-" + id,
				icon: 'wxi-close',
				align:"right",
				click:"$$('toolbar-" + id + "').hide();",
				on: {
					onItemClick: function () {
						if (sch.draggedEvent !== undefined && sch.draggedEvent.id !== undefined) {
							sch.resetEventPosition(sch.draggedEvent.id);
						}
					}
				}
			}
		]
	};
};

/**
 * TAB-1 Данные для бронирования (есть наличие сертификата)
 */
const booking = function (formId) {
	return {
		padding:10,
		id: 'booking-tab-' + formId,
		rows:[
			{
				view:"label",
				id:"lowcost-notice",
				label: "Warning! The voucher`s type is LOW-COST.",
				align:"left",
				css:"alert-label",
				hidden: true
			},
			{
				cols:[
					{
						rows:[
							{
								view:'text',
								placeholder:'Voucher ID',
								id:'voucher-' + formId,
								name: 'voucher',
								validate:webix.rules.isNumber,
								invalidMessage:"Only digits",
								on:{
									onEnter: function () {
										let val = {};
										let idSert = this.getValue().trim();
										sch.clearServerFormData(formId); // Clear server data
										//Deprecated sch.clearForm(formId); // Clear form
										$$("voucher-" + formId).setValue(idSert);
										if (this.validate()) {
											webix.ajax().post("/RPC/takeoff/Vouchers/Store/getGiftProperty", {id:idSert}, function(t, d) {
												t = JSON.parse(t);
												// Если ваучер имеет тип LOW-COST, то показываем предупреждение об этом
												if (t.productType.type === 'lowcost_voucher') {
													$$('lowcost-notice').show();
												} else {
													$$('lowcost-notice').hide();
												}
												if (t) {
													val.comment = t.comments || '';
													val.fio = t.fio;
													val.code = t.code;
													val.id = t.id;
													val.pin = t.pin;
													val.phone = t.phone;
													val.duration_title = t.duration_title;
													val.states = {};
													val.states.overlap = false; // Перекрытие
													val.states.booking = false; // Отлетали ли полет
													val.customer_uid = t.uid;   // ID владельца сертификата (тот кто покупал)
													// $$('add_new_event_form').setValues({uid:User.user.uid()}, true);
													//  Дата окончания действия серта (зеленая / желтая если заканчивается в интервале +7 дней от сегодня / красная, если уже просрочен)
													val.duration = {};
													val.duration.time = t.duration;
													val.duration.activate_date = t.activate_date;
													val.duration.expires = t.expires;
													val.duration.color = 'green';

													// Срок действия сертификата: Green - Валидный, yellow - осталось 7 или менее дней, red - истек срок
													$$("db-state-expire").setValue(val.duration.expires);
													$$("db-state-expire").setValue(sch.formatdmY(val.duration.expires));
													let timeDiff = (new Date(t.expires)).getTime() - (new Date()).getTime();
													let diffDays = -1;
													if (timeDiff) {
														diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
													}
													if (diffDays < 0) {
														sch.setStatusColor('db-state-expire', 'red');
														val.duration.color = 'yellow';
													} else if (diffDays <= 7) {
														sch.setStatusColor('db-state-expire', 'yellow');
														val.duration.color = 'yellow';
													} else {
														sch.setStatusColor('db-state-expire', 'green');
													}
													$$("db_state").define("icon","wxi-close");
													$$("db_state").refresh();

													// Если на сертификат уже есть бронирование
													$$("duplicate-bookings-view").clearAll();
													$$('duplicate-bookings-count').setValue('0');
													if (t.duplicateVouchers.length > 0) {
														$$('duplicate-bookings-count').setValue(t.duplicateVouchers.length);
														$$("db_state").define("icon","check-circle");
														$$("db_state").refresh();
														val.duration.color = 'yellow';
														// Отображаем существующие бронирования сертификата в view
														t.duplicateVouchers.forEach(function (item, i, arr) {
															$$("duplicate-bookings-view").add({
																id:       item.id,
																admin:    item.admin || '',
																start:    sch.formatdmYHi(item.start),
																duration: sch.formatHi('2018-12-12 ' + item.duration),
																customer: item.customer || '',
																type:     item.type || '',
																status:   item.status || '',
																pilot:    item.pilot || '',
																comment:  item.comment || ''
															});
														});
													}

													// Статус. Откатан ли сертификат (booking fail aviso new paid)
													val.status = t.status;
													val.used = {};
													val.used.date = '';
													val.used.color = "green";
													val.used.pilot_id = 0;
													val.used.pilot_fio = "";
													let status_text = '';
													if (t.used !== null) {
														val.states.booking = true;
														val.used.date = new Date(t.used);
														val.used.color = 'red';
														status_text += 'Completed';
														$$("db_state").define("icon","wxi-close");
														val.duration.color = 'red';
														if (t.pilot_id !== null) {
															val.used.pilot_id = t.pilot_id;
															val.used.pilot_fio = t.pilot_fio;
														}
													} else {
														status_text = val.status;
													}
													// Если ваучер отменен
													if (val.status === 'cancelled') {
														val.used.color = val.duration.color = "red";
													}

													// Дата активации (для smart ваучеров)
													val.activated = true;
													if (val.duration.activate_date !== null) {
														$$('activate_date').show();
														$$('db-activate-date').setValue(sch.formatdmY(val.duration.activate_date));
														if ((new Date()).getTime() < (new Date(t.activate_date)).getTime()) {
															sch.setStatusColor('db-activate-date', 'red');
															val.duration.color = "red";
															val.activated = false;
														} else {
															sch.setStatusColor('db-activate-date', 'green');
														}
													} else {
														$$('activate_date').hide();
														$$('db-activate-date').setValue(0);
													}

													sch.setStatusColor('db_state', val.duration.color);
													$$("db_state").refresh();
													sch.setStatusColor('voucher-' + formId, val.duration.color);
													$$("db-state-status").setValue(status_text);
													sch.setStatusColor('db-state-status', val.used.color);
													$$("db-state-booking").setValue(sch.formatdmY(val.used.date));
													$$("db-state-pilot").setValue(val.used.pilot_fio);

													// Тип симулятора
													if (t.sid === 1) {
														val.simulator = 'B737';
														sch.setSimulatorColor('boing');
													} else if (t.sid === 2) {
														val.simulator = 'A320';
														sch.setSimulatorColor('airbus');
													} else if (t.sid === 3) {
														val.simulator = 'Static';
														sch.setSimulatorColor('static');
													} else if (t.sid === 4) {
														val.simulator = 'A320 & B737';
														sch.setSimulatorColor('airbus-boing');
													}
													$$("db_simulator").setValue(val.simulator);
													let simId = (sch.current.event.section_id === 1)? 1:2;
													$$('add_new_event_form').setValues({simulator:simId}, true);

													// Длительность
													$$("db_duration").setValue(val.duration_title);

													// Фамилия и телефон
													$$("db_id").setValue(val.code || '');
													if (val.fio !== null && val.fio.length > 0) {
														$$("db_fio_copy").show();
														$$("db_fio").setValue(val.fio);
													} else {
														$$("db_fio_copy").hide();
														$$("db_fio").setValue('');
													}
													if (val.phone !== null && val.phone.length > 0) {
														$$("db_phone_copy").show();
														$$("db_phone").setValue(val.phone);
													} else {
														$$("db_phone_copy").hide();
														$$("db_phone").setValue('');
													}

													// Комментарий
													$$("db_comments").setValue(val.comment);

													// Проверка overlap либо сертификат уже использован
													if (val.states.overlap === true || val.states.booking === true || val.status === 'cancelled' || val.activated === false) {
														$$("create-button-" + sch.windows.certEvent.id).disable();
													} else {
														$$('add_new_event_form').setValues({start:sch.current.event.start_date}, true);
														$$('add_new_event_form').setValues({duration:val.duration.time}, true);
														// Синхронизируем расположение event в scheduler в соответсвии с полученной длитеностью полета
														sch.current.event.end_date = new Date(sch.current.event.start_date.getTime() + (val.duration.time * 60 * 1000));
														sch.scheduler.updateEvent(sch.current.event.id);
														$$("create-button-" + sch.windows.certEvent.id).enable();
													}
													sch.giftProperty = val;

													// Был ли у ваучера хотя бы 1 technical_rebooking? Если был, то устанавливаем галочку об этом.
													let hadTechnicalRebooking = false;
													if (t.duplicateVouchers.length > 0) {
														t.duplicateVouchers.forEach(function (item) {
															if (item.status === 'technical') {
																hadTechnicalRebooking = true;
															} else {
																let logs = JSON.parse(item.logs);
																if (logs.length > 0) {
																	logs.forEach(function (itemLog) {
																		if (itemLog['status'] === 'technical_rebooking') {
																			hadTechnicalRebooking = true;
																		}
																	});
																}
															}
														});
													}
													$$("set-technical-rebooking-status-" + sch.windows.certEvent.id).setValue(hadTechnicalRebooking);
												} else {
													sch.msgForm('Failed to get a response from the server.');
													return false;
												}
											}).fail(function (xhr) {
												sch.msgForm('Voucher ID is not found.');
												return false;
											});
										}
									}
								}},
							{view:"text", placeholder:"Name", name: "fio", id:"fio", validate:webix.rules.isNotEmpty, invalidMessage:"Please enter a name"},
							{
								view:"text",
								placeholder:"Phone",
								name: "phone",
								id:"phone",
								invalidMessage:"Please enter a phone",
								validate: function (value) {
									value = value.trim();
									if (value.length < 5) { return false; }
									if ( /^[0-9+\s()-]+$/.test(value) ) {
										return true;
									}
									return false;
								}
							},
							{view:'checkbox', css:'no-label', labelRight:"Add a person", id:'is_addition_fio', name:'is_addition_fio',
								on:{
									onItemClick: function () {
										if($$('is_addition_fio').getValue()) {
											$$("addition_fio_form").show();
										} else {
											$$("addition_fio_form").hide();
										}
									}
								}
							},
							{
								id:'addition_fio_form',
								cols:[
									{view:"text", placeholder:"Name", name: "addition_fio", id:"addition_fio"},
									{
										view:"text",
										placeholder:"Phone",
										name: "addition_phone",
										id:"addition_phone",
										invalidMessage:"Please enter a phone",
										validate: function (value) {
											value = value.trim();
											if (value.length < 5) { return false; }
											if ( /^[0-9+\s()-]+$/.test(value) ) {
												return true;
											}
											return false;
										}
									}
								]
							},
							{view:"textarea", height:70, placeholder:"Comment", name:'comment', id:"comments" },
							{
								hidden: true,
								rows:[
									eventType(sch.windows.certEvent.id),
								]
							},
							{ view:"checkbox", css:'no-label', labelRight:"VIP customer", name:'vip', id:"vip_customer", tooltip:'Vip for: apology for the breakdown; famous person; simply VIP.',
								on:{
									onItemClick:function () {
										if($$('vip_customer').getValue()) {
											$$("vip_comment").show();
										} else {
											$$("vip_comment").hide();
										}
									}
								}
							},
							{view:"textarea", height:50, placeholder:"VIP comment", name:'vip_comment', id:"vip_comment" },
							{ view:"checkbox", name:'nonresident', css:'no-label', labelRight:"Nonresident", id:"nonresident" },
							{
								view:"checkbox",
								name:'speak_english',
								css:'no-label',
								labelRight: "English speaking pilot",
								id:"speak_english-" + formId
							},
						]
					},
					{
						autowidth:true,
						rows:[
							{
								cols:[
									{ view:'icon', width: 30, icon:'check-circle', align:"left", id:"db_state", popup: "db-state-popup", tooltip: "Voucher status"},
									{ view:"label", width: 150,label:"Code", align:"left", id:"db_id"},
									{ view:"label",  width: 100,label:"Time", align:"center", id:"db_duration"},
									{ view:"label",  width: 120, label:"Simulator", align:"right", id:"db_simulator"}
								]
							},
							{
								cols:[
									{ view: "icon", id:"db_fio_copy", css:"color-blue", icon:"arrow-left", on: {
										onItemClick: function (id, e) {
											let v = $$("db_fio").getValue();
											if (v !== 'Name') {
												$$("fio").setValue(v);
											}
										}
									}},
									{ view:"label", label:"Name", id:"db_fio", align:"left" }
								]
							},
							{
								cols:[
									{ view: "icon", id:"db_phone_copy", css:"color-blue", icon:"arrow-left", on:{
										onItemClick: function () {
											let v = $$("db_phone").getValue();
											if (v !== 'Phone') {
												$$("phone").setValue(v);
											}
										}
									}},
									{ view:"label", label:"Phone", id:"db_phone", align:"left" }
								]
							},
							{ view:"textarea", height:100, id:"db_comments", readonly: true }
						]
					}
				]
			},
			{} // Для выравнивания по высоте
		]
	};
};

/**
 * TAB-2 Условия полета
 */
const flyConditions = function (id) {
	return {
		padding:10,
		id: 'condition-tab-' + id,
		rows:[
			{
				view:"fieldset",
				label:"The customer's wishes to the pilots",
				body:{
					cols:[
						{
							view:"multicombo",
							id:'need-pilot-' + id,
							name:'need_pilot',
							label:"Desired pilot",
							labelPosition:"top",
							suggest: sch.pilotList
						},
						{
							view:"multicombo",
							id:'dont-need-pilot-' + id,
							name:'dont_need_pilot',
							label:"Non-desired pilot",
							labelPosition:"top",
							suggest: sch.pilotList
						}
					]
				}
			},
			{
				view:'text',
				id:'need-airport-' + id,
				name:'need_airport',
				placeholder:'A customer would like to use a certain airport. (specify one)',
				value:''
			},
			{
				view:'checkbox',
				labelRight:'Customer replacing in the cockpit at half of the flight.',
				css:'no-label',
				tooltip:'Customers would like replacing each other in the cockpit at half of the flight.',
				id:"change-people-" + id,
				name:'change_people'
			},
			{
				view:'checkbox',
				labelRight:'A plane starts from the parking (cold and dark).',
				css:'no-label',
				id:"start-plane-" + id,
				name:'start_plane'
			},
			{
				view:'checkbox',
				labelRight:'Aerophobia',
				css:'no-label',
				id:"client-aerofob-" + id,
				name:'client_aerofob'
			},
			{
				view:'checkbox',
				labelRight:'Without a long instruction',
				css:'no-label',
				id:"short-instruction-" + id,
				name:'short_instruction'
			},
			{
				view:'checkbox',
				labelRight:'A check-list is required before the flight starts',
				css:'no-label',
				id:"need-checklist-" + id,
				name:'need_checklist'
			},
			{
				view:'checkbox',
				labelRight:'The customer would like to control the plane himself. (has got experience).',
				css:'no-label',
				id:"client-drive-" + id,
				name:"client_drive"
			},
			{
				view:'checkbox',
				labelRight:'Flight schemes are required.',
				css:'no-label',
				id:"need-schema-" + id,
				name:"need_schema"
			},
			{
				view:'checkbox',
				labelRight:'The flight across beacons.',
				css:'no-label',
				id:"light-fly-" + id,
				name:"light_fly"
			},
			{
				view:'checkbox',
				labelRight:'An experienced pilot would like to be prepared for an airline interview.',
				css:'no-label',
				id:"experienced-pilot-" + id,
				name:"experienced_pilot"
			},
			{} // Для выравнивания по высоте
		]
	};
};

/**
 * TAB-3 Дополнительные условия
 */
const addtionConditions = function (id) {
	return {
		id:'addition-tab-' + id,
		padding:10,
		rows:[
			// разбили двухчасовой сертификат по часу полета в разные дни
			// после этого полета идет сразу летать на второй тренажер, или параллельно забронировал сразу два (вычисляемое условие, только информация!)
			{
				view:'checkbox',
				labelRight:'Check only',
				css:'no-label',
				tooltip:'Has only a check. (A voucher had not printed, after the customer paid).',
				id:"only-check-" + id,
				name:'only_check'
			},
			{
				view:'checkbox',
				labelRight:'A plastic card must be printed, after the customer comes for flying.',
				css:'no-label',
				id:"card-print-" + id,
				name:'card_print'
			},
			{
				view:'checkbox',
				labelRight:'A customer would like to pay more for the longer flight if there is still free time.',
				css:'no-label',
				id:"more-pay-" + id,
				name:'more_pay'
			},
			{
				view:"checkbox",
				name:'recall',
				id:"recall-" + id,
				css:'no-label',
				labelRight:'Call back the customer, if the simulator is work.'
			},
			{} // Для выравнивания по высоте
		]
	};
};

/**
 * Clear Second Tab
 * @param id
 */
function clearSecondTab(id) {
	$$("dont-need-pilot-" + id).setValue('');
	$$("dont-need-pilot-" + id).refresh();
	$$("need-pilot-" + id).setValue('');
	$$("need-pilot-" + id).refresh();
	$$("need-airport-" + id).setValue('');
	$$("change-people-" + id).setValue(false);
	$$("start-plane-" + id).setValue(false);
	$$("client-aerofob-" + id).setValue(false);
	$$("short-instruction-" + id).setValue(false);
	$$("need-checklist-" + id).setValue(false);
	$$("client-drive-" + id).setValue(false);
	$$("need-schema-" + id).setValue(false);
	$$("light-fly-" + id).setValue(false);
	$$("experienced-pilot-" + id).setValue(false);
	$$("speak_english-" + id).setValue(false);
}

/**
 * Clear Third Tab
 * @param id
 */
function clearThirdTab(id) {
	$$("only-check-" + id).setValue(false);
	$$("card-print-" + id).setValue(false);
	$$("more-pay-" + id).setValue(false);
}

/**
 * Окно создания НОВОГО бронирования (ЕСТЬ наличие сертификата)
 */
const addNewEvent = {
	view:"window",
	hidden: true,
	modal:true,
	id:"window-" + sch.windows.certEvent.id,
	position:"center",
	move:true,
	width:800,
	autoheight:true,
	head: getToolbarHeader(sch.windows.certEvent.id),
	on:  {
		onShow: function () {
			sch.clearForm(sch.windows.certEvent.id);
			$$('lowcost-notice').hide();
		}
	},
	body: {
		padding:-20,
		rows: [
			{
				view: "form",
				id: "add_new_event_form",
				minHeight:550,
				width:800,
				elements:[
					{
						view:"tabview",
						id: 'tabview-form',
						padding:0,
						cells:[
							{
								header:"Booking",
								body: booking(sch.windows.certEvent.id)
							},
							{
								header:"Flight conditions",
								body: flyConditions(sch.windows.certEvent.id)
							},
							{
								header:'Additional condition',
								body: addtionConditions(sch.windows.certEvent.id)
							}
						]
					},
					{
						padding: 10,
						cols:[
							{
								view:'checkbox',
								id:"set-technical-rebooking-status-" + sch.windows.certEvent.id,
								labelWidth:260,
								labelRight:'Set a technical status',
								tooltip:'Set a technical status for the booking in order to signal there was a technical problems before.',
								css:'no-label',
								value:0,
								name:'set_technical_rebooking'
							},
							{},
							{ view:"button", type:"form", css:'btn-primary', id:"create-button-" + sch.windows.certEvent.id, value:"Create booking", width:170, align:'left',
								on:{
									onItemClick: function (){
										if ($$("add_new_event_form").validate()) {
											let formVal = $$('add_new_event_form').getValues();
											if(parseInt($$("set-technical-rebooking-status-" + sch.windows.certEvent.id).getValue()) === 1) {
												formVal.status = 'technical_rebooking';
											} else {
												formVal.status = 'new';
											}
											formVal.type = bookType.getBookingType(formVal.type); // Thesaurus to BOOKINGTYPE
											let log = {
												prev_state: null,
												event: 'create'
											};
											webix.ajax().post('/RPC/takeoff/Booking/Store/Add', {'data':formVal, 'log':log}, function (insertId) {
												if (insertId > 0) {
													sch.scheduler.endLightbox(true, document.getElementById("window-" + sch.windows.certEvent.id)); // Вызываем ПЕРВЫМ !!!
													webix.message({text:"The booking is created successfully.", type:"info"});
													// Обновить отображение бронирования в календаре
													let service = {};
													service.eid      = parseInt(insertId);
													service.pin      = sch.giftProperty.pin;
													service.voucher  = sch.giftProperty.id;
													service.duration = sch.giftProperty.duration;
													sch.updateEventData(sch.current.event, formVal, service);
													delete sch.tmpEventId; // Удаляя временное хранение события - мы предотвращаем визуальное удаление из календаря
													$$("window-" + sch.windows.certEvent.id).hide();
													return true;
												} else {
													sch.msgForm('Booking error.', 'Error');
													return false;
												}
											}).fail(function (xhr) {
												let txt = '';
												switch (xhr.status) {
													case 701:
														txt = xhr.responseText;
														break;
													case 702:
														txt = xhr.responseText;
														break;
													case 703:
														txt = xhr.responseText;
														break;
													case 704:
														txt = xhr.responseText;
														break;
													default:
														txt = 'Booking error.';
												}
												webix.alert({
													css: 'booking-error-alert',
													text: txt,
													type: 'error',
													expire: 5000
												});
												return false;
											});
										}
									}
								}
							},
							{ view:"button", id:'cancel-button-' + sch.windows.certEvent.id, css:"bt_cancel", value:"Cancel", width:150, align:'right'}
						]
					}
				]
			}
		]
	}
};