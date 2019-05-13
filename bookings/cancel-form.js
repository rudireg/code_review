/**
 * Реализация ф-ции Отмены бронирования.
 * Возможный статусы отмены:
 'fail', -- полет не состоялся по вине клиента
 'refund', -- отмена и возврат денег за полет (по неким основаниям, подробности в логе)
 'technical', -- полет отменен или перенесен по причине поломки симулятора (красный цвет таймслота)
 'majeure', -- перенос или отмена полета по ув. причине клиента (подробности в логе)
 */
sch.actions.cancel = function () {
	let status = $$('cancel-case-' + sch.windows.cancel.id).getValue();
	switch (status) {
		case '1':
			status = 'fail';
			break;
		case '2':
			status = 'majeure';
			break;
		case '3':
			status = 'technical';
			break;
	}
	let data = {
		id: sch.current.event.eid,
		status: status
	};
	let log = {
		prev_state: sch.current.event.status,
		event: 'cancel',
		cancel: $$('cancel-case-' + sch.windows.cancel.id).getValue(),
		comment: $$("comment-" + sch.windows.cancel.id).getValue()
	};
	if (log.cancel === '2') {
		log.reason = $$('reason-' + sch.windows.cancel.id).getValue();
	}
	webix.ajax().post('/RPC/takeoff/Booking/Store/Update', {'data':data, 'log': log}, function (updatedId) {
		if (updatedId > 0) {
			webix.message({text:"The booking is canceled successfully.", type:'info'});
			// Нужно ли визуальное обновление плашки в календаре
			let allEvents = sch.scheduler.getEvents();
			let tmp = sch.getDataIfExistsPropertyInArray(allEvents, 'eid', sch.current.event.eid);
			if (tmp !== null) {
				sch.scheduler.getEvent(tmp.id).status = status;
				sch.scheduler.updateEvent(tmp.id);
			}
			$$("window-" + sch.windows.cancel.id).hide();
			return true;
		} else {
			sch.msgForm('Cancel error.', 'Error');
			return false;
		}
	}).fail(function (xhr) {
		sch.msgForm('Cancel error.', 'Error');
		return false;
	});
};

/**
 * Отмена бронирования
 */
const cancelEventForm = {
	view: 'window',
	hidden:true,
	modal: true,
	id:"window-" + sch.windows.cancel.id,
	position:"center",
	move:true,
	head: {
		view:"toolbar",
		id: 'toolbar-' + sch.windows.cancel.id,
		cols:[
			{
				view: "label",
				id: 'dialog-title-' + sch.windows.cancel.id,
				label: "",
			},
			{
				view: "icon",
				icon: "wxi-close",
				css: "alter",
				click: function(){
					this.getTopParentView().hide();
				},
				hotkey: "esc"
			}
		]
	},
	on:  {
		onShow: function () {
			$$('dialog-title-' + sch.windows.cancel.id).setValue('Booking cancellation. ID: ' + sch.current.event.eid + ' #' + sch.current.event.voucher);
			$$('reason-' + sch.windows.cancel.id).setValue(0);
			$$('reason-' + sch.windows.cancel.id).hide();
			$$('cancel-case-' + sch.windows.cancel.id).setValue(1);
			$$('cancel-case-' + sch.windows.cancel.id).focus();
			$$("comment-" + sch.windows.cancel.id).setValue('');
			$$('cancel-form-' + sch.windows.cancel.id).clearValidation();
		}
	},
	body:{
		view:'form',
		id:'cancel-form-' + sch.windows.cancel.id,
		width:400,
		rows:[
			{
				padding:10,
				rows:[
					{view:'label', label:'Reason for cancellation.'},
					{
						view: 'select',
						id: 'cancel-case-' + sch.windows.cancel.id,
						name: 'cancel_case',
						value: 1,
						options: sch.thesaurus.cancel,
						on:{
							onChange: function () {
								if (this.getValue() === '2') { // Увжительная причина
									$$('reason-' + sch.windows.cancel.id).setValue(0);
									$$('reason-' + sch.windows.cancel.id).show();
									$$('reason-' + sch.windows.cancel.id).focus();
								} else {
									$$('reason-' + sch.windows.cancel.id).hide();
									$$("comment-" + sch.windows.cancel.id).focus();
								}
							}
						}
					},
					{
						view:"select",
						name:'reason',
						id:'reason-' + sch.windows.cancel.id,
						value: 0,
						options: sch.thesaurus.reason,
						invalidMessage:'Select a reason',
						validate: function (value) {
							if ($$('cancel-case-' + sch.windows.cancel.id).getValue() === '2') {
								return (parseInt(value) > 0);
							}
						}
					},
					{
						view:"textarea",
						placeholder:"Comment",
						name:'comment',
						id:"comment-" + sch.windows.cancel.id
					}
				]
			},
			{},
			{
				padding:10,
				cols:[
					{ view:"button", type:"form", css:'btn-primary', id:"create-button-" + sch.windows.cancel.id, value:"Apply", width:150, align:'left',
						on:{
							onItemClick: function (){
								if($$('cancel-form-' + sch.windows.cancel.id).validate()) {
									machine.model.changeStateTo(sch.current.event.status);
									machine.model.dispatch('cancel');
								}
							}
						}
					},
					{},
					{
						view:"button",
						id:'cancel-button-' + sch.windows.cancel.id,
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