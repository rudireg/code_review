/**
 * Очистка формы сервиса
 */
function clearFormService() {
	let id = sch.windows.service.id;
	$$("time-select-" + id).setValue('30');
	$$("time-select-view-" + id).setValue('30 minutes');
	$$("comment-" + id).setValue('');
}

/**
 * Окно добавления Буфера или ТО
 */
const addNewServiceEvent = {
	view:"window",
	hidden: true,
	modal:true,
	id:"window-" + sch.windows.service.id,
	position:"center",
	move:true,
	Height:600,
	width:800,
	head: getToolbarHeader(sch.windows.service.id),
	on:  {
		onShow: clearFormService
	},
	body: {
		rows: [
			{
				view: "form",
				id: "event-form-" + sch.windows.service.id,
				Height:600,
				width:800,
				elements:[
					{
						rows:[
							{
								cols:[
									{
										view:"radio",
										label:"Event type",
										labelWidth: 100,
										name: 'type',
										id: 'service-type-' + sch.windows.service.id,
										value: 'buffer',
										options:[
											{ "id":'buffer', "value":"Buffer" },
											{ "id":'maintenance', "value":"Service" }
										]
									},
									{}
								]
							},
							{
								view:"fieldset",
								label:"Event duration",
								body: humanTimeSelect(sch.windows.service.id, true)
							},
							{view:"textarea", height:80, placeholder:"Comment", name:'comment', id:"comment-" + sch.windows.service.id}
						]
					},
					{
						cols:[
							{},
							{ view:"button", type:"form", css:'btn-primary', id:"create-button-" + sch.windows.service.id, value:"Create", width:170, align:'left',
								on:{
									onItemClick: function (){
										if ($$("event-form-" + sch.windows.service.id).validate()) {
											let simId = (sch.current.event.section_id === 1)? 1:2;
											$$("event-form-" + sch.windows.service.id).setValues({uid:App.user.uid}, true);
											$$("event-form-" + sch.windows.service.id).setValues({simulator:simId}, true);
											$$("event-form-" + sch.windows.service.id).setValues({start:sch.current.event.start_date}, true);
											$$("event-form-" + sch.windows.service.id).setValues({duration:$$('time-select-' + sch.windows.service.id).getValue()}, true);
											let formVal = $$("event-form-" + sch.windows.service.id).getValues();
											formVal.status = 'new';
											let log = {
												prev_state: null,
												event: 'create_' + $$('service-type-' + sch.windows.service.id).getValue()
											};
											webix.ajax().post('/RPC/takeoff/Booking/Store/Add', {'data':formVal, 'log':log}, function (insertId) {
												if (insertId > 0) {
													sch.scheduler.endLightbox(true, document.getElementById("window-" + sch.windows.service.id));
													webix.message({text:"The booking has been created successfully.", type:'info'});
													// Обновить отображение бронирования в календаре
													sch.scheduler.getEvent(sch.current.event.id).eid = parseInt(insertId);
													sch.scheduler.getEvent(sch.current.event.id).status = 'new';
													sch.scheduler.getEvent(sch.current.event.id).text = $$('comment-' + sch.windows.service.id).getValue();
													sch.scheduler.getEvent(sch.current.event.id).duration = sch.overlap.minutesToHi($$('time-select-' + sch.windows.service.id).getValue());
													sch.scheduler.getEvent(sch.current.event.id).type = $$('service-type-' + sch.windows.service.id).getValue();
													sch.scheduler.updateEvent(sch.current.event.id); // update event
													$$("window-" + sch.windows.service.id).hide();
													sch.tmpEventId = null;
													return true;
												} else {
													sch.msgForm('Error booking adding!', 'Error');
													return false;
												}
											}).fail(function (xhr) {
												sch.msgForm('Error booking adding!!', 'Error');
												return false;
											});
										}
									}
								}
							},
							{ view:"button", id:'cancel-button-' + sch.windows.service.id, css:"bt_cancel", value:"Cancel", width:150, align:'right'}
						]
					}
				]
			},
			{}
		]
	}
};
