/**
 * использует элементы формы из файла: add-cert-booking-form.js
 */

/**
 * Очистка формы бронирования БЕЗ сертификата
 */
function clearFormNoneCert() {
	let id = sch.windows.noneCertEvent.id;
	$$('tabview-form-none-cert').setValue('booking-tab-' + id); // Set active first tab
	//First Tab
	$$('event-type-' + sch.windows.noneCertEvent.id).setValue(19); // flight
	$$("fio-" + id).setValue('');
	$$("phone-" + id).setValue('');
	$$("comments-" + id).setValue('');
	$$("addition-fio-form-" + id).hide();
	$$("addition-fio-" + id).setValue('');
	$$("addition-phone-" + id).setValue('');
	$$("is-addition-fio-" + id).setValue(false);
	$$("vip-customer-" + id).setValue(false);
	$$("nonresident-" + id).setValue(false);
	$$("recall-" + id).setValue(false);
	$$("vip-comment-" + id).setValue('');
	$$("vip-comment-" + id).hide();
	$$('fio-'+sch.windows.noneCertEvent.id).focus();
	// select-time
	$$("time-select-" + id).setValue('30');
	$$("time-select-view-" + id).setValue('30 minutes');
	//Second tab
	clearSecondTab(sch.windows.noneCertEvent.id);
	//Third tab
	clearThirdTab(sch.windows.noneCertEvent.id);
	//Buttons
	$$("create-button-" + sch.windows.noneCertEvent.id).enable();
}

/**
 * TAB-1 Данные для бронирования (Нет сертификата)
 */
const bookingNoneCert = function (id) {
	return {
		padding:10,
		id: 'booking-tab-' + id,
		rows:[
			{
				cols:[
					{
						rows:[
							{
								cols:[
									{view:"text", placeholder:"Name", name: "fio", id:"fio-" + id, validate:webix.rules.isNotEmpty, invalidMessage:"Enter a name"},
									{
										view:"text",
										placeholder:"Phone",
										name: "phone",
										id:"phone-" + id,
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
							{view:'checkbox', css:'no-label', labelRight:"Add contact", id:'is-addition-fio-' + id, name:'is_addition_fio',
								on:{
									onItemClick: function () {
										if($$('is-addition-fio-' + id).getValue()) {
											$$("addition-fio-form-" + id).show();
										} else {
											$$("addition-fio-form-" + id).hide();
										}
									}
								}
							},
							{
								id:'addition-fio-form-' + id,
								cols:[
									{view:"text", placeholder:"Name", name: "addition_fio", id:"addition-fio-" + id},
									{
										view:"text",
										placeholder:"Phone",
										name: "addition_phone",
										id:"addition-phone-" + id,
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
							{
								view:"fieldset",
								label:"Event duration",
								body: humanTimeSelect(id, true)
							},
							{view:"textarea", height:60, placeholder:"Comment", name:'comment', id:"comments-" + id},
							{
								cols:[
									eventType(sch.windows.noneCertEvent.id, true),
									{}
								]
							},
							{ view:"checkbox", css:'no-label', labelRight:"VIP customer", name:'vip', id:"vip-customer-" + id, tooltip:'Vip for: apology for the breakdown; famous person; simply VIP.',
								on:{
									onItemClick:function () {
										if($$('vip-customer-' + id).getValue()) {
											$$("vip-comment-" + id).show();
										} else {
											$$("vip-comment-" + id).hide();
										}
									}
								}
							},
							{view:"textarea", height:50, placeholder:"VIP comment", name:'vip_comment', id:"vip-comment-" + id},
							{ view:"checkbox", css:'no-label', labelRight:"Nonresident", id:"nonresident-" + id, name:'nonresident' },
							{ view:"checkbox", css:'no-label', labelRight:"English speaking pilot", id:"speak_english-" + id, name:'speak_english' },
						]
					}
				]
			},
			{} // Для выравнивания по высоте
		]
	};
};

/**
 * Окно бронирования (Нет сертификата)
 */
const addNewEventNoneCert = {
	view:"window",
	hidden: true,
	modal:true,
	id:"window-" + sch.windows.noneCertEvent.id,
	position:"center",
	move:true,
	minHeight:650,
	width:800,
	head: getToolbarHeader(sch.windows.noneCertEvent.id),
	on:  {
		onShow: clearFormNoneCert
	},
	body: {
		padding:-20,
		rows: [
			{
				view: "form",
				id: "add_new_event_form_none_cert",
				minHeight:650,
				width:800,
				elements:[
					{
						view:"tabview",
						id: 'tabview-form-none-cert',
						padding:0,
						cells:[
							{
								header:"Booking",
								body: bookingNoneCert(sch.windows.noneCertEvent.id)
							},
							{
								header:"Flight conditions",
								body: flyConditions(sch.windows.noneCertEvent.id)
							},
							{
								header:'Additional conditions',
								body: addtionConditions(sch.windows.noneCertEvent.id)
							}
						]
					},
					{
						padding:10,
						cols:[
							{},
							{ view:"button", type:"form", css:'btn-primary', id:"create-button-" + sch.windows.noneCertEvent.id, value:"Create booking", width:170, align:'left',
								on:{
									onItemClick: function (){
										let simId = (sch.current.event.section_id === 1)? 1:2;
										// $$('add_new_event_form_none_cert').setValues({uid:User.user.uid()}, true);
										$$('add_new_event_form_none_cert').setValues({simulator:simId}, true);
										$$('add_new_event_form_none_cert').setValues({start:sch.current.event.start_date}, true);
										$$('add_new_event_form_none_cert').setValues({duration:$$('time-select-' + sch.windows.noneCertEvent.id).getValue()}, true);

										if ($$("add_new_event_form_none_cert").validate()) {
											let formVal = $$('add_new_event_form_none_cert').getValues();
											formVal.status = 'new';
											formVal.type = bookType.getBookingType(formVal.type); // Thesaurus to BOOKINGTYPE
											let log = {
												prev_state: null,
												event: 'create'
											};
											webix.ajax().post('/RPC/takeoff/Booking/Store/Add', {'data':formVal, 'log':log}, function (insertId) {
												if (insertId > 0) {
													sch.scheduler.endLightbox(true, document.getElementById('add_new_event')); // Вызываем ПЕРВЫМ !!!
													// Обновить отображение бронирования в календаре
													let service = {};
													service.eid      = parseInt(insertId);
													service.pin      = null;
													service.voucher  = null;
													service.duration = null; // Duration будет выставлен из переменной: formVal
													sch.updateEventData(sch.current.event, formVal, service);
													delete sch.tmpEventId; // Удаляя временное хранение события - мы предотвращаем визуальное удаление из календаря
													$$("window-" + sch.windows.noneCertEvent.id).hide();
													webix.message({text:"The booking is created successfully.", type:"info"});
													return true;
												} else {
													sch.msgForm('Booking error!', 'Error');
													return false;
												}
											}).fail(function (xhr) {
												sch.msgForm('Booking error!!', 'Error');
												return false;
											});
										}
									}
								}
							},
							{ view:"button", id:'cancel-button-' + sch.windows.noneCertEvent.id, css:"bt_cancel", value:"Cancel", width:150, align:'right'}
						]
					}
				]
			}
		]
	}
};
