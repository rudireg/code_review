const edit = {};
edit.updateEventVisualisation = true; // Следует ли обновлять визуальное представление события на календаре

/**
 * Отображение контактной информации
 * @param controlId
 * @param data
 */
edit.setContactValue = function(controlId, data) {
	if (typeof data !== 'object') {
		data = JSON.parse(data);
	}
	let txt = '';
	for (let i=0; i<data.length; ++i) {
		if (data[i].value.length > 0) {
			txt += data[i].title + ':&nbsp;<input readonly style="color:#666 !important; font-weight:bold;font-size:16px;" value="' + data[i].value + '" />' + '&nbsp;&nbsp;&nbsp;&nbsp;';
		}
	}
	$$(controlId).setValue(txt);
};

/**
 * Оформление потребности в пилотах
 * @param formId
 * @param type Заголовок: Хочу,  Не хочу
 * @param data Список ID пилотов
 */
edit.setPilotInfo = function (formId, type, data) {
	let txt = '';
	data = data.split(',');
	if (data.length > 0) {
		let pilotNames = [];
		for (let i=0; i<data.length; ++i) {
			pilotNames.push(sch.getPilotNameById(data[i]));
		}
		if (pilotNames.length > 0) {
			txt = '<b>' + type + '</b>: ' + pilotNames.join(', ');
		}
	}
	$$(formId).setValue(txt);
};

/**
 * Инициализация редактирования основной информации бронирования
 * @param event - Данные бронирования
 * @param dialogId - префикс ID формы
 */
const setEventEdition = function (event, dialogId) {
	$$('id-' + dialogId).setValue(event.id);
	$$('voucher-' + dialogId).setValue(event.voucher);
	$$('pin-' + dialogId).setValue(event.pin);
	$$('uid-' + dialogId).setValue(event.admin_name);
	$$('start-' + dialogId).setValue(sch.formatYmdHi(event.start));
	$$('fio-' + dialogId).setValue(event.fio);
	$$('phone-' + dialogId).setValue(event.phone);
	$$('email-' + dialogId).setValue(event.email);
	$$('addition-fio-' + dialogId).setValue(event.add_fio);
	$$('addition-phone-' + dialogId).setValue(event.add_phone);
	$$('addition-email-' + dialogId).setValue(event.add_email);
	$$('comment-' + dialogId).setValue(event.comment);
	$$('event-type-' + dialogId).setValue(bookType.getThesaurusId(event.type));
	$$('vip-' + dialogId).setValue(event.vip);
	$$('vip-comment-' + dialogId).setValue(event.vip_comment);
	$$('nonresident-' + dialogId).setValue(event.event_data.nonresident);
	let minutes = sch.overlap.getTime(event.duration) / 1000 / 60;
	$$('time-select-' + dialogId).setValue(minutes);
	if (event.voucher !== null) {
		$$('time-select-' + dialogId).disable();
	} else {
		$$('time-select-' + dialogId).enable();
	}
};

/**
 * Инициализация Условия полета бронирования
 * @param event - Данные бронирования
 * @param dialogId - префикс ID формы
 */
const setFlyConditions = function (event, dialogId) {
	$$('need-pilot-' + dialogId).setValue(event.event_data.need_pilot || '');
	$$('need-pilot-' + dialogId).refresh();
	$$('dont-need-pilot-' + dialogId).setValue(event.event_data.dont_need_pilot || '');
	$$('dont-need-pilot-' + dialogId).refresh();
	$$('need-airport-' + dialogId).setValue(event.event_data.need_airport || '');
	$$('change-people-' + dialogId).setValue(event.event_data.change_people);
	$$('start-plane-' + dialogId).setValue(event.event_data.start_plane);
	$$('client-aerofob-' + dialogId).setValue(event.event_data.client_aerofob);
	$$('short-instruction-' + dialogId).setValue(event.event_data.short_instruction);
	$$('need-checklist-' + dialogId).setValue(event.event_data.need_checklist);
	$$('client-drive-' + dialogId).setValue(event.event_data.client_drive);
	$$('need-schema-' + dialogId).setValue(event.event_data.need_schema);
	$$('light-fly-' + dialogId).setValue(event.event_data.light_fly);
	$$('experienced-pilot-' + dialogId).setValue(event.event_data.experienced_pilot);
	$$('speak_english-' + dialogId).setValue(event.event_data.speak_english);
};

/**
 * Инициализация Дополнительных условий бронирования
 * @param event - Данные бронирования
 * @param dialogId - префикс ID формы
 */
const setAddtionConditions = function (event, dialogId) {
	$$('only-check-' + dialogId).setValue(event.event_data.only_check);
	$$('card-print-' + dialogId).setValue(event.event_data.card_print);
	$$('more-pay-' + dialogId).setValue(event.event_data.more_pay);
	$$('recall-' + dialogId).setValue(event.event_data.recall);
};

/**
 * POPUP INLINE редактирование комментария
 */
const inlineEditCommentPopup = {
	view: "popup",
	id: "inline-edit-popup",
	width: 700,
	body: {
		view: "form",
		id: 'inline-edit-popup-form-' + sch.windows.optionsEvent.id,
		elements: [
			{
				view: "textarea",
				name: "comment",
				id:'inline-edit-comment-' + sch.windows.optionsEvent.id
			},
			{
				view: "text",
				name: "id",
				hidden: true,
				id:'inline-edit-id-' + sch.windows.optionsEvent.id
			},
			{
				cols:[
					{
						view: "button",
						value: "Save",
						click: function () {
							let comm = $$('inline-edit-comment-' + sch.windows.optionsEvent.id).getValue().trim();
							// Обновить данные в БД
							let data = $$('inline-edit-popup-form-' + sch.windows.optionsEvent.id).getValues();
							data.status = sch.current.event.status;
							let log = {
								prev_state: sch.current.event.status,
								event:'edit'
							};
							webix.ajax().sync().post('/RPC/takeoff/Booking/Store/Update', {'data':data, 'log':log}, function (res) {
								if (res > 0) {
									webix.message({text:"The booking is edited successfully.", type:'info'});
									if (edit.updateEventVisualisation === true) {
										let ev;
										ev = sch.scheduler.getEvent(sch.current.event.id);
										if (!ev) {
											let allEvents = sch.scheduler.getEvents();
											ev = sch.getDataIfExistsPropertyInArray(allEvents, 'eid', parseInt(res));
										}
										if (ev) {
											ev.text = comm;
											sch.scheduler.updateEvent(ev.id);
										}
										sch.res.comment = comm; // sch.res Будет использоваться при нажатии на кнопку РЕДАКТИРОВАТЬ
										$$('admin-comment-' + sch.windows.optionsEvent.id).setValue(comm);
										$$('admin-comment-' + sch.windows.customer_search.id).setValue(comm);
									}
									$$('inline-edit-popup').hide();
									return true;
								} else {
									sch.msgForm('Editing error.', 'Error');
									return false;
								}
							});
						}
					},
					{},
					{
						view: "button",
						value: "Cancel",
						css:'bt_cancel',
						click: function () {
							this.getTopParentView().hide();
						}
					}
				]
			}
		]
	}
};

/**
 * Редактирование клиента для бронирования
 */
const changeContactForBooking = {
	view:"window",
	hidden: true,
	modal:true,
	id:"window-change-contact",
	position:"center",
	move:true,
	width:400,
	customerType: 1,
	head: {
		view: "toolbar",
		margin: -4,
		cols: [
			{
				view: "label",
				label: "Change contact"
			},
			{
				view: "icon",
				icon: "wxi-close",
				css: "alter",
				click: function(){ this.getTopParentView().hide(); },
				hotkey: "esc"
			}
		]
	},
	on:  {
		onShow: function () {
			$$('oldCustomerData').setValue({
				'name': $$('name-chc').getValue(),
				'email': $$('email-chc').getValue(),
				'phone': $$('phone-chc').getValue()
			});
		}
	},
	body: {
		padding: 15,
		rows:[
			{
				view:'form',
				id:'form-chc',
				elements:[
					{view:'text', name:'name',  id:'name-chc', label:'Name'},
					{
						view:'text',
						name:'phone',
						id:'phone-chc',
						label:'Phone',
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
					{view:'text', name:'email', id:'email-chc', label:'Email'},
				]
			},
			{},
			{
				cols:[
					{view:'label', value:'', id:'oldCustomerData', hidden:true},
					{ view:"button", css:'btn-primary', value:"Change", width:170, align:'left',
						on:{
							onItemClick: function (){
								if ($$('form-chc').validate()) {
									let newValues = $$('form-chc').getValues();
									newValues.id = sch.res.id;
									let oldValues = $$('oldCustomerData').getValue();
									webix.ajax().post('/RPC/takeoff/Customers/Store/EditCustomer', {'oldData':oldValues, 'newData':newValues}, function (res) {
										if (res > 0) {
											if ($$("window-change-contact").customerType === 1) {
												$$('fio-'   + sch.windows.editor.id).setValue(newValues.name);
												$$('phone-' + sch.windows.editor.id).setValue(newValues.phone);
												$$('email-' + sch.windows.editor.id).setValue(newValues.email);
											} else {
												$$('addition-fio-'   + sch.windows.editor.id).setValue(newValues.name);
												$$('addition-phone-' + sch.windows.editor.id).setValue(newValues.phone);
												$$('addition-email-' + sch.windows.editor.id).setValue(newValues.email);
											}
											webix.message({text:"The contact is successfully changed."});
											$$("window-change-contact").hide();
											return true;
										} else {
											sch.msgForm('Error of changing the contact!', 'Error');
											return false;
										}
									}).fail(function (xhr) {
										sch.msgForm('Perhaps the e-mail is already exists.', 'Error');
										return false;
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
	}
};

/**
 * Окно добавления добавочного контакта
 */
const addExtraContact = {
	view:"window",
	hidden: true,
	modal:true,
	id:"window-add-extra-contact",
	position:"center",
	move:true,
	width:400,
	head: {
		view: "toolbar",
		margin: -4,
		cols: [
			{
				view: "label",
				label: "Add another contact"
			},
			{
				view: "icon",
				icon: "wxi-close",
				css: "alter",
				click: function(){ this.getTopParentView().hide(); },
				hotkey: "esc"
			}
		]
	},
	on:  {
		onShow: function () {
			$$('name-aec').setValue('');
			$$('name-aec').focus();
			$$('phone-aec').setValue('');
			$$('email-aec').setValue('');
		}
	},
	body: {
		padding: 15,
		rows:[
			{
				view:'form',
				id:'form-aec',
				elements:[
					{view:'text', name:'name',  id:'name-aec', label:'Name'},
					{
						view:'text',
						name:'phone',
						id:'phone-aec',
						label:'Phone',
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
					{view:'text', name:'email', id:'email-aec', label:'Email'},
				]
			},
			{},
			{
				cols:[
					{ view:"button", css:'btn-primary', value:"Add", width:170, align:'left',
						on:{
							onItemClick: function (){
								if ($$('form-aec').validate()) {
									let values = $$('form-aec').getValues();
									values.id = sch.res.id;
									webix.ajax().post('/RPC/takeoff/Booking/Store/AddContact', {'data':values}, function (id) {
										if (id > 0) {
											$$("add-contact2-button-" + sch.windows.optionsEvent.id).hide();
											$$("add-contact2-block-" + sch.windows.optionsEvent.id).show();
											edit.setContactValue('contact2-' + sch.windows.optionsEvent.id,
												[
													{'title':'Name','value':values.name},
													{'title':'Phone','value':values.phone},
													{'title':'Email','value':values.email}
												]);
											$$('addition-fio-'   + sch.windows.editor.id).setValue(values.name);
											$$('addition-phone-' + sch.windows.editor.id).setValue(values.phone);
											$$('addition-email-' + sch.windows.editor.id).setValue(values.email);
											webix.alert({text:"The contact is successfully added."});
											$$("window-add-extra-contact").hide();
											return true;
										} else {
											sch.msgForm('Error of adding the contact.', 'Error');
											return false;
										}
									}).fail(function (xhr) {
										sch.msgForm('Error of adding the contact.', 'Error');
										return false;
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
	}
};

const helpStatusInfo = {
	view:'popup',
	hidden: true,
	id:'help-status-info',
	width:430,
	body:{
		rows:[
			{
				cols:[
					{view:'label', label:'NEW', width:100, css:'bolder'},
					{view:'label', label:'A new booking'}
				]
			},
			{
				cols:[
					{view:'label', label:'REBOOKING', width:100, css:'bolder'},
					{view:'label', label:'A booking is transferred'}
				]
			},
			{
				cols:[
					{view:'label', label:'FAIL', width:100, css:'bolder'},
					{view:'label', label:'A booking is canceled for a disrespectful reason.'}
				]
			},
			{
				cols:[
					{view:'label', label:'MAJEURE', width:100, css:'bolder'},
					{view:'label', label:'A Booking is cancelled for a valid reason'}
				]
			},
			{
				cols:[
					{view:'label', label:'REFUND', width:100, css:'bolder'},
					{view:'label', label:'Refund'}
				]
			},
			{
				cols:[
					{view:'label', label:'TECHNICAL', width:100, css:'bolder'},
					{view:'label', label:'Technical problems'}
				]
			},
			{
				cols:[
					{view:'label', label:'COMPLETE', width:100, css:'bolder'},
					{view:'label', label:'The flight is completed'}
				]
			},
			{
				cols:[
					{view:'label', label:'ARCHIVE', width:100, css:'bolder'},
					{view:'label', label:'A Booking is archived'}
				]
			}
		]
	}
};

/**
 * Информация для отображения свойств бронирования
 */
const infoEventBlock = function (formId) {
	return {
		padding:10,
		id: 'tab-booking-' + formId,
		rows:[
			{
				cols:[
					{
						view:'icon',
						icon:'user',
						id: 'vip-' + formId,
						css:"color-red",
						on:{
							onItemClick:function () {
								$$('vip-comment-popup-' + formId).setValue(sch.res.vip_comment);
							}
						},
						popup: {
							view: "popup",
							width: 300,
							body: {
								rows:[
									{
										view:"textarea",
										id:'vip-comment-popup-' + formId,
										label:"VIP comment",
										labelPosition:"top",
										readonly:true,
										height:150
									}
								]
							}
						}
					},
					{view: 'label', id: 'model-' + formId, label: '', width:50,
						on:{
							onChange: function (newv, oldv) {
								switch(newv) {
									case 'B737':
										webix.html.removeCss(this.getNode(), 'color-green');
										this.define('css', 'color-blue');
										break;
									case 'A320':
										webix.html.removeCss(this.getNode(), 'color-blue');
										this.define('css', 'color-green');
										break;
								}
							}
						}
					},
					{view: 'label', id: 'date-start-' + formId, label: '', width:60},
					{view: 'label', id: 'time-start-' + formId, label: '', width:50},
					{view: 'label', id: 'duration-' + formId, label: ''},
					{view: 'label', label: 'Voucher:', width: 65},
					{view: 'label', id: 'code-' + formId, label: '', width:150, css:'bolder'},
					{},
					{
						id:'transference-block-' + formId,
						cols:[
							{view:'label', label:'Booking count:', width:140},
							{view:'label', id:'transference-' + formId, label:'', width: 20, css:'bolder'}
						]
					}
				]
			},
			{
				cols:[
					{view:'icon', icon:'question', width: 20, popup: 'help-status-info'},
					{view:'label', label:'Status:', width: 60},
					{view:'label', label:'', id:'status-' + formId, width: 150, align:'left', css:'bolder'},
					{view:'label', id:'cancel-' + formId, label:'&#9658; Cancel', width: 80, css:'link-color-blue',
						on: {
							onItemClick: function () {
								$$("window-" + sch.windows.cancel.id).show();
							}
						}
					},
					{view:'label', id:'move-' + formId, label:'&#9658; Rebooking', width: 110, css:'link-color-blue',
						on:{
							onItemClick: function () {
								let allEvents = sch.scheduler.getEvents();
								let tmp = sch.getDataIfExistsPropertyInArray(allEvents, 'eid', sch.current.event.eid);
								if (tmp) { sch.current.event.id = tmp.id; }
								sch.excludeDate = sch.current.event.eid;
								sch.tmpEvent = sch.current.event;
								$$("window-" + sch.windows.moving.id).show();
								$$('simulator-id-' + sch.windows.moving.id).setValue(sch.current.event.simulator || sch.current.event.section_id);
								let simName = '';
								if (sch.current.event.simulator === 1) {
									simName = 'B737';
									webix.html.removeCss($$("toolbar-" + sch.windows.moving.id).getNode(), "airbus-background");
									$$("toolbar-" + sch.windows.moving.id).define("css", "boeing-background");
								} else {
									simName = 'A320';
									webix.html.removeCss($$("toolbar-" + sch.windows.moving.id).getNode(), "boeing-background");
									$$("toolbar-" + sch.windows.moving.id).define("css", "airbus-background");
								}
								// Конфигурируем минуты
								let date_options = { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false };
								let date = new Date(sch.current.event.start_date);
								if (date.getMinutes() < 30) {
									date.setMinutes(0, 0, 0);
								} else {
									date.setMinutes(30, 0, 0);
								}
								let txt = date.toLocaleString('en-US', date_options);
								txt = sch.weekday[date.getDay()] + ', ' + txt;
								$$("toolbar-time-" + sch.windows.moving.id).setValue(txt);
								$$("toolbar-simulator-" + sch.windows.moving.id).setValue('ID: ' + sch.current.event.eid + ', ' + simName);
							}
						}
					},
					{view:'label', id:'attach-voucher-' + formId, label:'&#9658; Attach voucher', width: 140, css:'link-color-blue',
						on:{
							onItemClick: function () {
								$$("window-" + sch.windows.attach_voucher.id).show();
							}
						}
					},
					{view:'label', id:'increase-' + formId, label:'&#9658; Increase', width: 100, css:'link-color-blue',
						on:{
							onItemClick: function () {
								let allEvents = sch.scheduler.getEvents();
								let tmp = sch.getDataIfExistsPropertyInArray(allEvents, 'eid', sch.current.event.eid);
								if (tmp) { sch.current.event = tmp; }
								sch.tmpEvent = sch.current.event;
								$$("window-" + sch.windows.increase_duration.id).show();
							}
						}
					},
					{}
				]
			},
			{
				view:"fieldset",
				label:"Contacts",
				body:{
					rows:[
						{
							cols:[
								{view:'label', css:'hide-border hide-background', label:'', id: 'contact1-' + formId},
								{width:10},
								{
									id:"add-contact2-button-" + formId,
									cols:[
										{
											view:"icon",
											icon: 'user-plus',
											align:'right',
											css:'btn-primary',
											tooltip:'Add another contact',
											width:40,
											on:{
												onItemClick:function () {
													$$("window-add-extra-contact").show();
												}
											}
										}
									]
								}
							]
						},
						{
							id:"add-contact2-block-" + formId,
							hidden:true,
							cols:[
								{view:'label', css:'hide-border hide-background', label:'', id: 'contact2-' + formId}
							]
						}
					]
				}
			},
			{
				view:"textarea",
				name:'admin_comment',
				css: 'hide-border hide-background',
				id: 'admin-comment-' + formId,
				placeholder:'No comment',
				popup:"inline-edit-popup",
				height:40,
				inputHeight:40,
				on:{
					onItemClick:function () {
						$$('inline-edit-comment-' + sch.windows.optionsEvent.id).setValue(this.getValue());
						$$('inline-edit-comment-' + sch.windows.optionsEvent.id).focus();
						$$('inline-edit-id-' + sch.windows.optionsEvent.id).setValue(sch.res.id);
					}
				}
			},
			{
				id:'pilots-block-' + formId,
				cols:[
					{
						view:'label',
						id:'yes-pilot-opt-' + formId,
						label:''
					},
					{
						view:'label',
						id:'not-pilot-opt-' + formId,
						label:''
					}
				]
			},
			{
				view:'text',
				id: 'airport-opt-' + formId,
				css: 'hide-border hide-background',
				label:'Airport:',
				labelWidth:80,
				value:''
			},
			{
				view:"multicombo",
				id: 'list-options-' + formId,
				label:"Booking`s details",
				labelPosition: "top",
				value:"",
				button: true,
				readonly: true,
				css:'multicombo-option-list hide-border hide-background',
				suggest: {
					body:{
						data: sch.thesaurus.fly_conditions,
						template: webix.template("#value#")
					}
				}
			},
			{}
		]
	};
};

/**
 * Информация об CUSTOMER (владельце сертификата)
 */
const userInfoPopup = {
	view:"popup",
	id:"user_info_popup",
	body:{
		view: "template",
		id:'user_info_template',
		template: "<div><span>ID:</span> <span class='bolder'>#id#</span></div>" +
		"<div><span>Name:</span> <span class='bolder'>#title#</span></div>" +
		"<div><span>Phone:</span> <span class='bolder'>#phone#</span></div>" +
		"<div><span>Email:</span> <span class='bolder'>#email#</span></div>" +
		"<div><span>Region:</span> <span class='bolder'>#region#</span></div>" +
		"<div><span>Address:</span> <span class='bolder'>#address#</span></div>" +
		"<div><span>Comment:</span> <span class='bolder'>#comments#</span></div>"
	}
};

/**
 * Информация об CUSTOMER (владельце сертификата)
 */
const historyDataPopup = {
	view:"popup",
	id:"history_data_popup",
	height: 200,
	body:{
		view:"scrollview",
		scroll:"y",
		body:{
			rows:[
				{
					id:'history_data_template',
					template: "<div>#result#</div>",
					autoheight:true
				}
			]
		}
	}
};

/**
 * История бронирования
 */
const eventHistory = function (formId) {
	return {
		id: 'tab-history-' + formId,
		rows: [
			{
				view:"datatable",
				id: `h_datatable_${formId}`,
				header: true,
				footer: true,
				select: true,
				navigation: true,
				activeTitle: true,
				resizeColumn:true,
				headerMenu: true,
				hover: "grid-row-hover",
				autoWidth:true,
				autoHeight:true,
				scrollX:false,
				headermenu:true,
				editable:true,
				onClick:{
					customerInfo:function(e, id){
						let customerId = this.getItem(id)['h_customer_' + formId];
						webix.ajax().sync().post('/RPC/takeoff/Booking/Store/getCustomerById', {'id':customerId}, function (res) {
							res = JSON.parse(res, function(k, v){
								if (v === null) {return '';}
								return v;
							});
							if(res) {
								$$('user_info_template').parse(res);
								$$('user_info_popup').show({
									x: e.x, //left offset from the right side
									y: e.y  //top offset
								});
							}
						});
						return true;
					},
					historyData: function (e, id) {
						let data = this.getItem(id)['h_event_data_' + formId];
						// Json to Object
						let fJsonParse = function (obj) {
							if (typeof (obj) !== 'object') {
								obj = JSON.parse(obj, function(k, v){
									if (v === null) {return '';}
									return v;
								});
							}
							for (let i in obj) {
								let isJSON = true;
								try { JSON.parse(obj[i]); } catch(e) { isJSON = false; }
								if (isJSON) {
									obj[i] = fJsonParse(obj[i]);
								}
								if (typeof (obj[i]) === 'object') {
									obj[i] = fJsonParse(obj[i]);
								}
							}
							return obj;
						};
						// Object to HtmlString
						let fForeachData = function(obj) {
							let txt = '';
							for (let inx in obj) {
								if (typeof (obj[inx]) === 'object') {
									txt += fForeachData(obj[inx]);
								} else {
									if (obj[inx].length > 0 || parseInt(obj[inx]) > 0) {
										let tmp = '';
										switch (inx) {
											case 'pilot':
												tmp = sch.getPilotNameById(obj[inx]);
												break;
											case 'rate':
												tmp = 'Pilot school';
												break;
											case 'rebook':
											case 'cancel':
											case 'reason':
												let val = sch.getDataIfExistsPropertyInArray(sch.thesaurus[inx], 'id', obj[inx]);
												tmp = val['value'];
												break;
											case 'simulator':
												tmp = sch.getSimulatorNameById(obj[inx]);
												break;
											default:
												tmp = obj[inx];
												break;
										}
										txt += "<div><span>" + inx + ": </span><span class='bolder'>" + tmp + "</span></div>";
									}
								}
							}
							return txt;
						};

						data = fJsonParse(data);
						let temp = fForeachData(data);

						let res = {'result':temp};
						$$('history_data_template').parse(res);
						$$('history_data_popup').show({
							x: e.x, //left offset from the right side
							y: e.y  //top offset
						});
						return true;
					}
				},
				columns:[
					{ id:'h_booking_' + formId, header:"Booking", adjust:"header"},
					{ id:'h_event_' + formId, header:["Event", {content:"textFilter"}],	sort:"string", adjust:"header",
						template:function(obj){
							switch (obj['h_event_' + formId]) {
								case 'create':
									return "<span class='color-dark-blue'>"+obj['h_event_' + formId]+"</span>";
								case 'move':
									return "<span class='color-blue'>"+obj['h_event_' + formId]+"</span>";
								case 'fly':
									return "<span class='color-green'>"+obj['h_event_' + formId]+"</span>";
								case 'refund':
									return "<span class='color-red'>"+obj['h_event_' + formId]+"</span>";
								case 'cancel':
									return "<span class='color-yellow'>"+obj['h_event_' + formId]+"</span>";
								case 'edit':
									return "<span class='color-brown'>"+obj['h_event_' + formId]+"</span>";
								case 'archive':
									return "<span class='color-black'>"+obj['h_event_' + formId]+"</span>";
								default:
									return "<span>"+obj['h_event_' + formId]+"</span>";
							}
						},
					},
					{ id:'h_curr_state_' + formId, header:["Status", {content:"textFilter"}], sort:"string", adjust:"data"},
					{ id:'h_prev_state_' + formId, header:"Old Status", adjust:"header"},
					{ id:'h_admin_' + formId, header:["Admin", {content:"textFilter"}],	sort:"string", adjust:"data"},
					{ id:'h_customer_' + formId, header:"Owner", width:90, popup:'my_popup',
						 template:"<span class='customerInfo color-blue' >#h_customer_" + formId + "#</span>"
					},
					{ id:'h_event_data_' + formId, header:"Data",  adjust:"header", hidden:true},
					{ id:'h2_event_data_' + formId, header:"Data",  adjust:"header",
						template:"<i class='fa fa-file historyData'></i>"
					},
					{ id:'h_event_timestamp_' + formId, header:["Date", {content:"textFilter"}], sort:"string", adjust:"data"}
				]
			}
		]
	};
};

/**
 * Запросить историю бронирования
 * @param formId
 * @param id - ID бронирования
 */
function initEventHistory(formId, id) {
	webix.ajax().post('/RPC/takeoff/Booking/Store/ReadHistory', {'data':id}, function (res) {
		res = JSON.parse(res);
		if (res) {
			let data = [];
			for (let idx in res){
				let item = [];
				item['h_booking_' + formId]         = res[idx]['object'];
				item['h_event_' + formId]           = res[idx]['event_data']['event'];
				item['h_curr_state_' + formId]      = res[idx]['status'];
				item['h_prev_state_' + formId]      = res[idx]['event_data']['prev_state'];
				item['h_admin_' + formId]           = res[idx]['admin'];
				item['h_customer_' + formId]        = res[idx]['customer'];
				item['h_event_data_' + formId]      = res[idx]['event_data'];
				item['h_event_timestamp_' + formId] = sch.formatYmdHi(res[idx]['event_timestamp']);
				data.push(item);
			}
			$$(`h_datatable_${formId}`).clearAll();
			$$(`h_datatable_${formId}`).parse(data, 'json');
		}
	}).fail(function (xhr) {
		webix.alert({
			title:'Error',
			text:'Error loading history. ' + xhr.responseText,
			type:'error'
		});
	});
}

/**
 * Инициализация плашки информации о бронировании
 * @param item
 * @param dialogId
 */
function setValueofBookingInfo(item, dialogId) {
	let comm = (item.comment||'').trim();
	if (item.vip === true) {
		webix.html.removeCss($$('vip-' + dialogId).getNode(), 'color-gray');
		$$('vip-' + dialogId).define('css', 'color-red');
		if (item.vip_comment.trim().length > 0) {
			comm = comm + ' ' + item.vip_comment.trim();
		}
	}
	$$('admin-comment-' + dialogId).config.height = 40;
	$$('admin-comment-' + dialogId).config.inputHeight = 40;
	if (comm.length >= 10){
		$$('admin-comment-' + dialogId).config.height = 100;
		$$('admin-comment-' + dialogId).config.inputHeight = 100;
	}
	$$('admin-comment-' + dialogId).setValue(comm);
	$$('model-' + dialogId).setValue(item.simulator === 1? 'B737' : 'A320');
	let theDate = new Date(item.start);
	$$('date-start-' + dialogId).setValue(sch.formatjM(theDate)); // День старта
	$$('time-start-' + dialogId).setValue(sch.formatHi(theDate)); // Время старта
	$$('duration-' + dialogId).setValue(sch.overlap.getHumanTime(item.duration)); // Продолжительность полета
	$$('code-' + dialogId).setValue(item.code); // Код сертификата
	edit.setContactValue('contact1-' + dialogId,
		[
			{'title':'Name','value':item.fio || ''},
			{'title':'Phone','value':item.phone? sch.formatPhone(item.phone) : ''},
			{'title':'Email','value':item.email || ''}
		]
	);
	if (item.add_fio === null && item.add_phone === null && item.add_email === null) {
		$$("add-contact2-button-" + dialogId).show();
		$$("add-contact2-block-" + dialogId).hide();
	} else {
		$$("add-contact2-button-" + dialogId).hide();
		$$("add-contact2-block-" + dialogId).show();
		edit.setContactValue('contact2-' + dialogId,
			[
				{'title':'Name','value':item.add_fio || ''},
				{'title':'Phone','value':item.add_phone? sch.formatPhone(item.add_phone) : ''},
				{'title':'Email','value':item.add_email || ''}
			]
		);
	}
	// Статус
	$$('status-' + dialogId).setValue(item.status);

	if (!item.event_data.need_pilot && !item.event_data.dont_need_pilot) {
		$$('pilots-block-' + dialogId).hide();
	} else {
		$$('pilots-block-' + dialogId).show();
	}
	if (item.event_data.need_pilot) {
		edit.setPilotInfo('yes-pilot-opt-' + dialogId, 'Need pilot', item.event_data.need_pilot);
		$$('yes-pilot-opt-' + dialogId).show();
	} else {
		$$('yes-pilot-opt-' + dialogId).hide();
	}
	if (item.event_data.dont_need_pilot) {
		edit.setPilotInfo('not-pilot-opt-' + dialogId, 'Don\'t need pilot', item.event_data.dont_need_pilot);
		$$('not-pilot-opt-' + dialogId).show();
	} else {
		$$('not-pilot-opt-' + dialogId).hide();
	}

	if (item.event_data.need_airport && item.event_data.need_airport.length > 0) {
		$$('airport-opt-' + dialogId).show();
		$$('airport-opt-' + dialogId).setValue(item.event_data.need_airport);
	} else {
		$$('airport-opt-' + dialogId).hide();
	}
	let optList = sch.convertOptList(item.event_data);
	$$('list-options-' + dialogId).setValue(optList);
	if (optList.length > 0) {
		$$('list-options-' + dialogId).show();
	} else {
		$$('list-options-' + dialogId).hide();
	}

	// Кол-во переносов
	if (item.transference > 0) {
		$$('transference-block-' + dialogId).show();
		$$('transference-' + dialogId).setValue(item.transference);
	}

	// Кнопка Отмены
	if (item.status === 'new' || item.status === 'rebooking' || item.status === 'technical_rebooking') {
		$$('cancel-' + dialogId).show();
	} else {
		$$('cancel-' + dialogId).hide();
	}
	// Кнопка Переноса
	if (item.status === 'new' ||
		item.status === 'rebooking' ||
		item.status === 'technical_rebooking' ||
		item.status === 'fail' ||
		item.status === 'technical' ||
		item.status === 'majeure'
	){
		$$('move-' + dialogId).show();
	} else {
		$$('move-' + dialogId).hide();
	}
	// Увеличение длительности бронирования
	if (item.status === 'new' ||
		item.status === 'rebooking' ||
		item.status === 'technical_rebooking'
	){
		$$('increase-' + dialogId).show();
	} else {
		$$('increase-' + dialogId).hide();
	}
	// Привязать ваучер к бронированию, у которого нет ваучера
	if (item.voucher === null) {
		$$('attach-voucher-' + dialogId).show();
	} else {
		$$('attach-voucher-' + dialogId).hide();
	}
}

/**
 * Окно свойств бронирования
 */
const optionsEvent = {
	view:"window",
	hidden: true,
	modal:true,
	id:"window-" + sch.windows.optionsEvent.id,
	position:"center",
	move:true,
	head: {
		view:"toolbar",
		id: 'toolbar-' + sch.windows.optionsEvent.id,
		cols:[
			{
				view: "label",
				id: 'dialog-title-' + sch.windows.optionsEvent.id,
				label: "",
			},
			{
				cols:[
					{view:'label', hidden:true, id:"toolbar-simulator-" + sch.windows.optionsEvent.id},
					{view:'label', hidden:true, id:"toolbar-time-" + sch.windows.optionsEvent.id}
				]
			},
			{
				view: "icon",
				icon: "wxi-close",
				id: 'toolbar-close-icon-' + sch.windows.optionsEvent.id,
				css: "alter",
				hotkey: "esc"
			},
		]
	},
	on:  {
		onBeforeShow: function () {
			sch.isDragMode = false;
			sch.bufferId = null;
			// Clear Dialog
			sch.clearOptionsDialog(sch.windows.optionsEvent.id);
			webix.ajax().sync().post('/RPC/takeoff/Booking/Store/Read', {'id':sch.current.event.eid}, function (res) {
				res = JSON.parse(res);
				res.event_data = JSON.parse(res.event_data);
				if (res.event_data === null) {res.event_data = {};}
				sch.res = res;
				$$('dialog-title-' + sch.windows.optionsEvent.id).setValue('ID ' + res.id);
				// Инициализация информацией о бронировании
				setValueofBookingInfo(res, sch.windows.optionsEvent.id);
				// Инициализация истории
				initEventHistory(sch.windows.optionsEvent.id, res.id);
				$$('tabview-' + sch.windows.optionsEvent.id).setValue('tab-booking-' + sch.windows.optionsEvent.id);
			});
		}
	},
	body: {
		rows: [
			{
				view:"tabview",
				id: 'tabview-' + sch.windows.optionsEvent.id,
				padding:0,
				height:530,
				width:800,
				cells:[
					{
						header:"Booking",
						body: infoEventBlock(sch.windows.optionsEvent.id)
					},
					{
						header:"History",
						body: eventHistory(sch.windows.optionsEvent.id)
					}
				]
			},
			{
				padding:10,
				cols:[
					{ 
						view:"button", 
						type:"form",
						id:"create-button-" + sch.windows.optionsEvent.id, 
						value:"Edit", 
						width:170, 
						align:'left',
						on:{
							onItemClick: function (){
								$$("window-" + sch.windows.editor.id).show();
								sch.scheduler.endLightbox(false, document.getElementById("window-" + sch.windows.optionsEvent.id));
								this.getTopParentView().hide();
							}
						}
					},
					{},
					{
						view:"button",
						id:'cancel-button-' + sch.windows.optionsEvent.id, 
						value:"Close", 
						width:150, 
						align:'right'
					}
				]
			}
		]
	}
};

/**
 * TAB-1 (основные поля) редактирования бронирования
 * @param dialogId - ID формы
 * @param synchronize - Следует ли синхронизировать время полета (Duration) с плашкой бронирования на календаре
 * @returns {{}}
 */
const eventEdition = function (dialogId, synchronize = true) {
	return {
		id:'tab1-' + dialogId,
		padding:10,
		rows:[
			{
				view:'fieldset',
				label:'Information',
				body:{
					cols:[
						{
							rows:[
								{view:'text', id:'voucher-' + dialogId, labelWidth:83, label:'Voucher ID', value:'', readonly:true, css:'hide-border hide-background'},
								{view:'text', id:'pin-' + dialogId, label:'PIN', value:'', readonly:true, css:'hide-border hide-background'},
								{view:'text', name:'id', id:'id-' + dialogId, label:'', value:'', hidden:true, readonly:true, css:'hide-border hide-background'}
							]
						},
						{width:10},
						{
							rows:[
								{view:'text', id:'uid-' + dialogId, label:'Admin', value:'', readonly:true, css:'hide-border hide-background'},
								{view:'text', id:'start-' + dialogId, label:'Start', value:'', readonly:true, css:'hide-border hide-background'}
							]
						}
					]
				}
			},
			{
				cols:[
					{
						view:"fieldset",
						label:"Contact",
						body:{
							rows:[
								{
									cols:[
										{ view:"text", readonly:true, label:"Name", name:'fio', id:'fio-' + dialogId, css:'hide-border hide-background'},
										{
											view:"icon",
											icon: 'edit',
											align:'right',
											css:'btn-primary',
											tooltip:'Change contact',
											width:40,
											on:{
												onItemClick:function () {
													$$('name-chc').setValue($$('fio-' + dialogId).getValue());
													$$('phone-chc').setValue($$('phone-' + dialogId).getValue());
													$$('email-chc').setValue($$('email-' + dialogId).getValue());
													$$("window-change-contact").customerType = 1;
													$$("window-change-contact").show();
													$$('name-chc').focus();
												}
											}
										}
									]
								},
								{ view:"text", readonly:true, label:"Phone", name:'phone', id:'phone-' + dialogId, validate:webix.rules.isNotEmpty, css:'hide-border hide-background'},
								{ view:"text", readonly:true, label:"Email", name:'email', id:'email-' + dialogId, validate:webix.rules.isEmail, css:'hide-border hide-background'}
							]
						}
					},
					{width:10},
					{
						view:"fieldset",
						label:"Additional contact",
						body:{
							rows:[
								{
									cols:[
										{ view:"text", readonly:true, label:"Name", name:'addition_fio', id:'addition-fio-' + dialogId, css:'hide-border hide-background'},
										{
											view:"icon",
											icon: 'edit',
											align:'right',
											css:'btn-primary',
											tooltip:'Change contact',
											width:40,
											on:{
												onItemClick:function () {
													let addFio   = $$('addition-fio-' + dialogId).getValue();
													let addPhone = $$('addition-phone-' + dialogId).getValue();
													let addEmail = $$('addition-email-' + dialogId).getValue();
													if (addPhone.length === 0 && addEmail.length === 0) {
														$$("window-add-extra-contact").show();
													} else {
														$$('name-chc').setValue(addFio);
														$$('phone-chc').setValue(addPhone);
														$$('email-chc').setValue(addEmail);
														$$("window-change-contact").customerType = 2;
														$$("window-change-contact").show();
													}
													$$('name-chc').focus();
												}
											}
										}
									]
								},
								{ view:"text", readonly:true, label:"Phone", name:'addition_phone', id:'addition-phone-' + dialogId, css:'hide-border hide-background'},
								{ view:"text", readonly:true, label:"Email", name:'addition_email', id:'addition-email-' + dialogId, validate:webix.rules.isEmail, css:'hide-border hide-background'}
							]
						}
					}
				]
			},
			{
				view:'textarea',
				id:'comment-' + dialogId,
				name:'comment',
				label:"Admin Comment",
				labelPosition:'top',
				height:70
			},
			{
				cols:[
					{
						rows:[
							eventType(dialogId, true),
							{}
						]
					},
					{width:10},
					{
						view:"fieldset",
						label:"Event duration",
						body: humanTimeSelect(dialogId, synchronize)
					}
				]
			},
			{
				view:'checkbox',
				labelRight:'VIP customer',
				css:'no-label',
				id:"vip-" + dialogId,
				name:'vip',
				on:{
					onChange:function (newV, oldV) {
						if (this.getValue()) {
							$$('vip-comment-' + dialogId).show();
						} else {
							$$('vip-comment-' + dialogId).hide();
						}
					}
				}
			},
			{
				view:'textarea',
				id:'vip-comment-' + dialogId,
				name:'vip_comment',
				label:"VIP comment",
				labelPosition:'top',
				height:70,
				hidden: true
			},
			{
				view:'checkbox',
				labelRight:'Nonresident',
				css:'no-label',
				id:"nonresident-" + dialogId,
				name:'nonresident'
			},
			{
				view:'checkbox',
				labelRight:'English speaking pilot',
				css:'no-label',
				id:"speak_english-" + dialogId,
				name:'speak_english'
			},
			{}
		]
	};
};

/**
 * Окно редактирования бронирования
 * Используются переменные: sch.current
 * 							sch.res
 */
const editEventForm = {
	view:"window",
	hidden: true,
	modal:true,
	id:"window-" + sch.windows.editor.id,
	position:"center",
	move:true,
	minHeight:720,
	width:800,
	head: {
		view:"toolbar",
		id: 'toolbar-' + sch.windows.editor.id,
		cols:[
			{
				view: "label",
				id: 'dialog-title-' + sch.windows.editor.id,
				label: "",
			},
			{
				view: "icon",
				icon: "wxi-close",
				css: "alter",
				click: function(){
					if (edit.updateEventVisualisation === true) {
						sch.scheduler.getEvent(sch.current.event.id).end_date = new Date(sch.current.event.start_date.getTime() + sch.overlap.getTime(sch.current.event.duration));
						sch.scheduler.updateEvent(sch.current.event.id);
					}
					this.getTopParentView().hide();
				},
				hotkey: "esc"
			}
		]
	},
	on:  {
		onShow: function () {
			setEventEdition(sch.res, sch.windows.editor.id);
			setFlyConditions(sch.res, sch.windows.editor.id);
			setAddtionConditions(sch.res, sch.windows.editor.id);
			$$('tabview-' + sch.windows.editor.id).setValue('tab1-' + sch.windows.editor.id);
			$$('dialog-title-' + sch.windows.editor.id).setValue('Edit ID ' + sch.current.event.eid);
		}
	},
	body: {
		rows:[
			{
				view:'form',
				id: 'form-' + sch.windows.editor.id,
				padding:0,
				elements:[
					{
						view:"tabview",
						id:'tabview-' + sch.windows.editor.id,
						cells:[
							{
								header:"Booking",
								body: eventEdition(sch.windows.editor.id)
							},
							{
								header:"Flight conditions",
								body: flyConditions(sch.windows.editor.id)
							},
							{
								header:'Additional conditions',
								body: addtionConditions(sch.windows.editor.id)
							}
						]
					}
				]
			},
			{
				padding:10,
				cols:[
					{ view:"button", type:"form", css:'btn-primary', id:"create-button-" + sch.windows.editor.id, value:"Save", width:170, align:'left',
						on:{
							onItemClick: function (){
								webix.html.removeCss($$('email-' + sch.windows.editor.id).getNode(), 'webix_invalid');
								webix.html.removeCss($$('addition-email-' + sch.windows.editor.id).getNode(), 'webix_invalid');
								// Валидация
								if (
									!$$('phone-' + sch.windows.editor.id).validate() ||
									($$('email-' + sch.windows.editor.id).getValue().trim().length > 0 && !$$('email-' + sch.windows.editor.id).validate()) ||
									($$('addition-email-' + sch.windows.editor.id).getValue().trim().length > 0 && !$$('addition-email-' + sch.windows.editor.id).validate())
								){
									return false;
								}
								let values = $$("form-" + sch.windows.editor.id).getValues();
								values.status = sch.current.event.status;
								values.type = bookType.getBookingType(values.type); // Thesaurus to BOOKINGTYPE
								let log = {
									prev_state: sch.current.event.status,
									event:'edit'
								};
								webix.ajax().sync().post('/RPC/takeoff/Booking/Store/Update', {'data':values, 'log':log}, function (id) {
									if (id > 0) {
										webix.message({text:"The booking is edited successfully.", type:'info'});
										$$("window-" + sch.windows.editor.id).hide();
										if (edit.updateEventVisualisation === true) {
											sch.updateEventData(sch.current.event, values);
										}
										if (srch.updateEventInfo === true && sch.windows.customer_search.items !== undefined) {
											srch.updateCurrentItem();
										}
										return true;
									} else {
										sch.msgForm('Editing error.', 'Error');
										return false;
									}
								});
							}
						}
					},
					{},
					{
						view:"button",
						id:'cancel-button-' + sch.windows.editor.id,
						css:"bt_cancel",
						value:"Cancel",
						width:150,
						align:'right',
						click: function () {
							if (edit.updateEventVisualisation === true) {
								sch.scheduler.getEvent(sch.current.event.id).end_date = new Date(sch.current.event.start_date.getTime() + sch.overlap.getTime(sch.current.event.duration));
								sch.scheduler.updateEvent(sch.current.event.id);
							}
							this.getTopParentView().hide();
						}
					}
				]
			}
		]
	}
};
