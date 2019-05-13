/**
 * Привязка ваучера к бронированию
 */
const attachVoucherForm = {
	view:'window',
	hidden: true,
	modal:true,
	id:'window-' + sch.windows.attach_voucher.id,
	position:'center',
	move:true,
	width: 500,
	height: 600,
	head: {
		view:"toolbar",
		id: "toolbar-" + sch.windows.attach_voucher.id,
		cols:[
			{ view:"label", label: "", id:"toolbar-label-" + sch.windows.attach_voucher.id, align:"left" },
			{
				view:"icon",
				id:"toolbar-close-icon-" + sch.windows.attach_voucher.id,
				icon: 'wxi-close',
				align:"right",
				on: {
					onItemClick: function () {
						this.getTopParentView().hide();
					}
				}
			}
		]
	},
	on:  {
		onShow: function () {
			let title = 'Attach voucher for booking ID: ' + sch.current.event.eid;
			$$("toolbar-label-" + sch.windows.attach_voucher.id).setValue(title);
			$$('voucher-id-' + sch.windows.attach_voucher.id).setValue('');
			$$('voucher-id-' + sch.windows.attach_voucher.id).focus();
			$$("attach-button-" + sch.windows.attach_voucher.id).disable();
			$$("property-" + sch.windows.attach_voucher.id).setValues({});
		}
	},
	body:{
		padding:10,
		rows:[
			{
				view:"text",
				labelWidth:100,
				id:'voucher-id-' + sch.windows.attach_voucher.id,
				value:'',
				placeholder:'Voucher ID',
				label:"Voucher ID",
				on:{
					onEnter: function () {
						// Reset colors of property
						$$("property-" + sch.windows.attach_voucher.id).getItem("status").css = '';
						$$("property-" + sch.windows.attach_voucher.id).updateItem("status");
						$$("property-" + sch.windows.attach_voucher.id).getItem("duration_title").css = '';
						$$("property-" + sch.windows.attach_voucher.id).updateItem("duration_title");
						$$("property-" + sch.windows.attach_voucher.id).setValues({});

						let voucherId = this.getValue().trim();
						webix.ajax().post('/RPC/takeoff/Vouchers/Store/getGiftProperty', {'id':voucherId}, function (voucher) {
							sch.current.voucher = voucher = JSON.parse(voucher);
							if (voucher) {
								$$("property-" + sch.windows.attach_voucher.id).setValues(voucher);
								if (voucher['status'] === 'booking') {
									$$("property-" + sch.windows.attach_voucher.id).getItem("status").css = "color-red";
									$$("property-" + sch.windows.attach_voucher.id).updateItem("status");
									webix.alert({
										title: 'Info',
										ok:"OK",
										text: 'Voucher is already used.',
										type: 'error'
									});
									return false;
								}
								// Проверка активации (смарт ваучер)
								if (voucher['activate_date'] !== null) {
									if ((new Date()).getTime() < (new Date(voucher['activate_date'])).getTime()) {
										$$("property-" + sch.windows.attach_voucher.id).getItem("activate_date").css = "color-red";
										$$("property-" + sch.windows.attach_voucher.id).updateItem("activate_date");
										webix.alert({
											title: 'Info',
											ok:"OK",
											text: 'Smart voucher is not activated yet.',
											type: 'error'
										});
										return false;
									}
								}
								if (voucher['status'] !== 'aviso' && voucher['status'] !== 'paid') {
									$$("property-" + sch.windows.attach_voucher.id).getItem("status").css = "color-red";
									$$("property-" + sch.windows.attach_voucher.id).updateItem("status");
									webix.alert({
										title: 'Info',
										ok:"OK",
										text: 'Voucher is not paid',
										type: 'error'
									});
									return false;
								}
								// Проверка совпадения длительности
								let voucherDuration = parseInt(voucher.duration); // Minutes
								let bookingDuration = sch.overlap.getTime(sch.current.event.duration) / 1000 / 60; // Minutes

								// Сумируем общее кол-во часов активных бронирований
								let sumDuration =0;
								voucher.duplicateVouchers.forEach(function (item) {
									if (item.status === 'new' || item.status === 'rebooking' || item.status === 'technical_rebooking') {
										sumDuration += sch.overlap.getTime(item.duration) / 1000 / 60;
									}
								});
								let freeMinutes = voucherDuration - sumDuration;
								if (bookingDuration > freeMinutes) {
									// Красим duration в красный цвет
									$$("property-" + sch.windows.attach_voucher.id).getItem("duration_title").css = "color-red";
									$$("property-" + sch.windows.attach_voucher.id).updateItem("duration_title");
									webix.alert({
										title: 'Info',
										ok:"OK",
										text: 'The booking duration is longer than free minutes of the voucher.',
										type: 'error'
									});
									return false;
								}
								// Делаем кнпоку привязки сертификата доступной для пользователя
								$$("attach-button-" + sch.windows.attach_voucher.id).enable();
								return true;
							} else {
								webix.alert({
									title: 'Info',
									ok:"OK",
									text: 'Error voucher getting!',
									type: 'error'
								});
								return false;
							}
						}).fail(function (xhr) {
							webix.alert({
								title: 'Info',
								ok:"OK",
								text: 'Error voucher getting!!',
								type: 'error'
							});
							return false;
						});
					}
				}
			},
			{
				view:"property",
				id:"property-" + sch.windows.attach_voucher.id,
				elements:[
					{ label:"Voucher", type:"label" },
					{ label:"ID", type:"text", id:"id"},
					{ label:"Status", type:"text", id:"status"},
					{ label:"Title", type:"text", id:"title"},
					{ label:"Code", type:"text", id:"code"},
					{ label:"Used", type:"text", id:"used"},
					{ label:"Customer", type:"text", id:"customer"},
					{ label:"Duration", css:'', type:"text", id:"duration_title"},
					{ label:"Email", type:"text", id:"email"},
					{ label:"Activate date", type:"text", id:"activate_date"},
					{ label:"Expires", type:"text", id:"expires"},
					{ label:"FIO", type:"text", id:"fio"},
					{ label:"Phone", type:"text", id:"phone"},
					{ label:"Price", type:"text", id:"price"},
					{ label:"Referrer", type:"text", id:"referrer"}
				]
			},
			{
				cols:[
					{ view:"button", type:"form", css:'btn-primary', id:"attach-button-" + sch.windows.attach_voucher.id, value:"Attach", width:170, align:'left',
						on:{
							onItemClick: function () {
								// Задаем бронированию номер сертификата
								let newData = {
									id: sch.current.event.eid,
									voucher: sch.current.voucher.id,
									status: sch.current.event.status
								};
								let log = {
									prev_state: sch.current.event.status,
									event: 'attach',
									comment: 'Attached voucher id: ' + sch.current.voucher.id
								};
								webix.ajax().post('/RPC/takeoff/Booking/Store/Update', {'data':newData, 'log':log}, function (bookingId) {
									if (bookingId) {
										// Обновить отображение бронирования в календаре
										let service = {};
										service.eid      = parseInt(sch.current.event.eid);
										service.pin      = sch.current.voucher.pin;
										service.voucher  = sch.current.voucher.id;
										sch.updateEventData(sch.current.event, null, service);
										$$("window-" + sch.windows.attach_voucher.id).hide();
										webix.message({text:"The voucher is attached successfully.", type:"info"});
										return true;
									} else {
										webix.alert({
											title: 'Error',
											ok:"OK",
											text: 'Error booking update for attaching voucher ID!',
											type: 'error'
										});
										return false;
									}
								}).fail(function (xhr) {
									webix.alert({
										title: 'Error',
										ok:"OK",
										text: "Error booking update for attaching voucher ID!!",
										type: 'error'
									});
									return false;
								});
							}
						}
					},
					{},
					{
						view:"button",
						id:'cancel-button-' + sch.windows.attach_voucher.id,
						css:"bt_cancel",
						value:"Cancel",
						width:150,
						align:'right',
						on: {
							onItemClick: function () {
								this.getTopParentView().hide();
							}
						}
					}
				]
			}
		]
	}
};