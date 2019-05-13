/**
 * Контексное меню добавления: Буфера, бронирования без сертификата
 */
const addContextMenu = {
	view:"contextmenu",
	hidden: true,
	id:'add-context-menu',
	width: 300,
	data:[
		{ value:"Create a booking by voucher ID", id:1 },
		{ value:"Create a booking without voucher ID", id:2 },
		{ $template:"Separator" },
		{ value:"Create a buffer", id:3 },
		{ value:"Create a service", id:4 }
	],
	on:{
		onBeforeShow: function (data) {
			sch.hideContextMenus();
		},
		onMouseOut: function () {
			this.hide();
		},
		onItemClick:function(id, e){
			switch (id) {
				case '1':
					sch.tmpEventId = sch.scheduler.addEvent({
						start_date: new Date(sch.action_data.date),
						end_date: new Date(sch.action_data.date + (30*60*1000)),
						section_id: sch.action_data.section,
						fio: '',
						phone:'',
						pin:'',
						eid:''
					});
					sch.scheduler.showLightbox(sch.tmpEventId, sch.windows.certEvent.id);
					break;
				case '2':
					sch.tmpEventId = sch.scheduler.addEvent({
						start_date: new Date(sch.action_data.date),
						end_date: new Date(sch.action_data.date + (30*60*1000)),
						section_id: sch.action_data.section,
						fio: '',
						phone:'',
						pin:'',
						eid:''
					});
					sch.scheduler.showLightbox(sch.tmpEventId, sch.windows.noneCertEvent.id);
					break;
				case '3':
					sch.tmpEventId = sch.scheduler.addEvent({
						start_date: new Date(sch.action_data.date),
						end_date: new Date(sch.action_data.date + (30*60*1000)),
						section_id: sch.action_data.section,
						fio: '',
						phone:'',
						pin:'',
						eid:'',
						type:'buffer'
					});
					sch.scheduler.showLightbox(sch.tmpEventId, sch.windows.service.id);
					$$('service-type-' + sch.windows.service.id).setValue('buffer');
					break;
				case '4':
					sch.tmpEventId = sch.scheduler.addEvent({
						start_date: new Date(sch.action_data.date),
						end_date: new Date(sch.action_data.date + (30*60*1000)),
						section_id: sch.action_data.section,
						fio: '',
						phone:'',
						pin:'',
						eid:'',
						type:'maintenance'
					});
					sch.scheduler.showLightbox(sch.tmpEventId, sch.windows.service.id);
					$$('service-type-' + sch.windows.service.id).setValue('maintenance');
					break;
			}
		}
	}
};

sch.contextMenu = {};
sch.contextMenu.rebooking = "<i class='fa fa-arrow-right font-sz-18'></i> Rebooking";
sch.contextMenu.options = "<i class='fa fa-info font-sz-18 w-15'></i> Booking options";
sch.contextMenu.complete = "<i class='fa fa-check font-sz-18 color-green'></i> Complete the flight";
sch.contextMenu.cancel = "<i class='fa fa-times font-sz-18 color-red'></i> Cancel the booking";
sch.contextMenu.archive = "<i class='fa fa-archive font-sz-18 w-15'></i> &nbsp;Archive";
sch.contextMenu.refund = "<i class='fa fa-dollar font-sz-18 w-15'></i> &nbsp;Money refund";
sch.contextMenu.attach_voucher = "<i class='fa fa-plus font-sz-18 w-15'></i> &nbsp;Attach voucher";
sch.contextMenu.increase_duration = "<i class='fa fa-clock-o font-sz-18 w-15'></i> &nbsp;Increase duration";

/**
 * Какое Контексное меню показывать для разных статусов.
 */
const editContextMenu = {
	view:"contextmenu",
	hidden: true,
	id:'edit-context-menu',
	width: 270,
	data:[],
	on:{
		onBeforeShow: function (data) {
			sch.hideContextMenus();
			this.clearAll();
			let ev = sch.scheduler.getEvent(sch.bufferId);
			let menuItems = [];
			switch (ev.status) {
				case 'new':
				case 'technical_rebooking':
				case 'rebooking':
					menuItems = [
						{value: sch.contextMenu.rebooking, id:1},
						{value: sch.contextMenu.options, id:2},
						{$template: "Separator"},
						{value: sch.contextMenu.complete, id:3},
						{$template: "Separator"},
						{value: sch.contextMenu.cancel, id:4},
					];
					if (ev.voucher !== undefined && ev.voucher !== null) {
						menuItems.push({value: sch.contextMenu.refund, id:6});
						menuItems.push({value: sch.contextMenu.increase_duration, id:8});
					} else {
						menuItems.push({value: sch.contextMenu.attach_voucher, id:7});
					}
					this.parse(menuItems);
					break;
				case 'complete':
					this.parse([
						{value: sch.contextMenu.options, id:2},
					]);
					break;
				case 'fail':
				case 'majeure':
				case 'technical':
					menuItems = [
						{value: sch.contextMenu.options, id:2},
						{value: sch.contextMenu.rebooking, id:1},
						{value: sch.contextMenu.archive, id:5}
					];
					if (ev.voucher !== undefined && ev.voucher !== null) {
						menuItems.push({$template: "Separator"});
						menuItems.push({value: sch.contextMenu.refund, id:6});
					}
					this.parse(menuItems);
					break;
				case 'refund':
					this.parse([
						{value: sch.contextMenu.options, id:2},
						{value: sch.contextMenu.archive, id:5}
					]);
					break;
			}
		},
		onMouseOut: function () {
			this.hide();
		},
		onItemClick:function(id, e){
			sch.current.event = sch.tmpEvent = sch.scheduler.getEvent(sch.bufferId);
			switch (id) {
				case '1': // Перенос бронирования
					sch.isDragMode = false;
					sch.excludeDate = sch.tmpEvent.eid;
					sch.scheduler.showLightbox(sch.bufferId, sch.windows.moving.id, true);
					$$('simulator-id-' + sch.windows.moving.id).setValue(sch.tmpEvent.section_id);
					break;
				case '2': // Свойства бронирования
					sch.scheduler.showLightbox(sch.bufferId, sch.windows.optionsEvent.id, true);
					break;
				case '3': // Полёт состоялся
					webix.confirm({
						text:"To set the status: The flight is complete?",
						callback: function(result){
							if (result) {
								$$('window-' + sch.windows.complete.id).show();
							}
						}
					});
					break;
				case '4': // Отмена полёта
					webix.confirm({
						text:"Cancel the flight?",
						callback: function(result){
							if (result) {
								$$("window-" + sch.windows.cancel.id).show();
							}
						}
					});
					break;
				case '5':
					webix.confirm({
						text:"Continue archiving?",
						callback: function(result){
							if (result) {
								machine.model.changeStateTo(sch.current.event.status);
								machine.model.dispatch('archive');
							}
						}
					});
					break;
				case '6':
					webix.confirm({
						text:"Continue money refund?",
						callback: function(result){
							if (result) {
								$$('window-' + sch.windows.refund.id).show();
							}
						}
					});
					break;
				case '7':
					$$('window-' + sch.windows.attach_voucher.id).show();
					break;
				case '8':
					$$('window-' + sch.windows.increase_duration.id).show();
					break;
			}
		}
	}
};

/**
 * Контекстное меню удаления Буфера или ТО
 */
const deleteContextMenu = {
	view:"contextmenu",
	hidden: true,
	id:'delete-context-menu',
	width: 270,
	data:[
		{ value:"<i class='fa fa-times font-sz-18 color-red'></i> Delete", id:1 }
	],
	on:{
		onBeforeShow: function (data) {
			sch.hideContextMenus();
		},
		onMouseOut: function () {
			this.hide();
		},
		onItemClick:function(id, e){
			sch.current.event = sch.tmpEvent = sch.scheduler.getEvent(sch.bufferId);
			switch (id) {
				case '1':
					webix.confirm({
						text:"Are you sure you want to delete?",
						callback: function(result){
							if (result) {
								let data = {
									'id':sch.tmpEvent.eid,
									'status': 'archive'
								};
								let log = {
									prev_state: sch.current.event.status,
									event: 'delete'
								};
								webix.ajax().sync().post('/RPC/takeoff/Booking/Store/Delete', {'data':data, 'log':log}, function (res) {
									if (res) {
										sch.scheduler.deleteEvent(sch.bufferId);
									}
								});
							}
						}
					});
				break;
			}
		}
	}
};