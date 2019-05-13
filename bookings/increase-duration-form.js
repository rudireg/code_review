const formIncreaseBooking = [
	{
		padding:10,
		rows:[
			{view:'label', hidden:true, id:"var-duration-" + sch.windows.increase_duration.id},
			{view:'datepicker', hidden:true, id:"var-end-date-" + sch.windows.increase_duration.id},
			{
				view:"fieldset",
				label:"Event duration",
				body: humanTimeSelect(sch.windows.increase_duration.id, true)
			},
			{
				view:'richselect',
				label:"Increase reason",
				id:'increase_reason_' + sch.windows.increase_duration.id,
				labelWidth:130,
				name:'increase_reason',
				value:sch.increaseReasonDefault,
				options:sch.increaseReasonList
			},
			{
				view:"textarea",
				id:"comment-" + sch.windows.increase_duration.id,
				height:150,
				name:'increase_comment',
				value: "",
				placeholder:'Enter comment',
				invalidMessage:"Type the comment",
				required:true
			},
			{
				cols:[
					{ view:"button", type:"form", css:'btn-primary', id:"increase-button-" + sch.windows.increase_duration.id, value:"Increase", width:170, align:'left',
						on:{
							onItemClick: function () {
								if (!$$('increase-form').validate()){
									webix.message('Type the comment.', 'error');
									return false;
								}
								let different;
								if (sch.current.event.end_date !== undefined) {
									different = sch.current.event.end_date - sch.current.event.start_date;
								} else {
									different = $$('time-select-' + sch.windows.increase_duration.id).getValue() * 1000 * 60;
								}
								if (different > 0) {
									different = different / 1000 / 60; // to minutes
									different = sch.overlap.minutesToHi(different);
								} else {
									different = null;
								}
								let duration = different? different : sch.current.event.duration;
								// Prepare data
								let newData = {
									id: sch.current.event.eid,
									status: sch.current.event.status,
									duration: duration
								};
								let log = {
									prev_state: sch.current.event.status,
									event: 'increase',
									increase_reason: $$('increase_reason_' + sch.windows.increase_duration.id).getText(),
									comment: $$("comment-" + sch.windows.increase_duration.id).getValue(),
									old_duration: (sch.overlap.getTime(sch.current.event.duration) / 1000 / 60) + ' minutes',
									new_duration: $$('time-select-' + sch.windows.increase_duration.id).getValue() + ' minutes',
									increase_reason_id: $$('increase_reason_' + sch.windows.increase_duration.id).getValue()
								};
								// Если увеличение времени с доплатой, помечаем booking как surcharge=true
								if (parseInt($$('increase_reason_' + sch.windows.increase_duration.id).getValue()) === 53) {
									newData.surcharge = true;
								}
								webix.ajax().post('/RPC/takeoff/Booking/Store/Surcharge', {'data':newData, 'log':log}, function (surchargeValue) {
									surchargeValue = parseInt(surchargeValue);
									if (surchargeValue > 0 || surchargeValue === 0) {
										if (sch.current.event.end_date !== undefined) {
											// Обновить отображение бронирования в календаре
											let updateLabels = {};
											updateLabels.duration  = duration + ':00';
											updateLabels.end_date  = sch.current.event.end_date;
											updateLabels.surcharge = surchargeValue;
											sch.updateEventData(sch.current.event, updateLabels, null);
										}
										$$("window-" + sch.windows.increase_duration.id).hide();
										webix.message({text:"The booking is increased successfully.", type:"info"});
										return true;
									} else {
										webix.alert({
											title: 'Error',
											ok:"OK",
											text: 'Error booking increase!',
											type: 'error'
										});
										return false;
									}
								}).fail(function (xhr) {
									webix.alert({
										title: 'Error',
										ok:"OK",
										text: "Error booking increase!!",
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
						id:'cancel-button-' + sch.windows.increase_duration.id,
						css:"bt_cancel",
						value:"Cancel",
						width:150,
						align:'right',
						on: {
							onItemClick: function () {
								let updateLabels = {};
								updateLabels.duration = $$("var-duration-" + sch.windows.increase_duration.id).getValue();
								updateLabels.end_date = $$("var-end-date-" + sch.windows.increase_duration.id).getValue();
								sch.updateEventData(sch.current.event, updateLabels, null);
								this.getTopParentView().hide();
							}
						}
					}
				]
			}
		]
	}
];

/**
 * Увеличение длительности бронирования
 */
const increaseDurationForm = {
	view:'window',
	hidden: true,
	modal:true,
	id:'window-' + sch.windows.increase_duration.id,
	position:'center',
	move:true,
	width: 500,
	height: 400,
	head: {
		view:"toolbar",
		id: "toolbar-" + sch.windows.increase_duration.id,
		cols:[
			{ view:"label", label: "", id:"toolbar-label-" + sch.windows.increase_duration.id, align:"left" },
			{
				view:"icon",
				id:"toolbar-close-icon-" + sch.windows.increase_duration.id,
				icon: 'wxi-close',
				align:"right",
				on: {
					onItemClick: function () {
						let updateLabels = {};
						updateLabels.duration = $$("var-duration-" + sch.windows.increase_duration.id).getValue();
						updateLabels.end_date = $$("var-end-date-" + sch.windows.increase_duration.id).getValue();
						sch.updateEventData(sch.current.event, updateLabels, null);
						this.getTopParentView().hide();
					}
				}
			}
		]
	},
	on:  {
		onShow: function () {
			let title = 'Increase duration for booking ID: ' + sch.current.event.eid;
			$$("toolbar-label-" + sch.windows.increase_duration.id).setValue(title);
			$$("comment-" + sch.windows.increase_duration.id).setValue('');
			$$('increase_reason_' + sch.windows.increase_duration.id).setValue(sch.increaseReasonDefault);
			// Запоминаем длительность и дату окончания для возврата в изначальное состояние при отмене или ошибке
			$$("var-duration-" + sch.windows.increase_duration.id).setValue(sch.current.event.duration);
			$$("var-end-date-" + sch.windows.increase_duration.id).setValue(sch.current.event.end_date);
			// Init counter
			let voucher_duration = sch.overlap.getTime(sch.current.event.duration) / 1000 / 60;
			let minutes = voucher_duration;
			if (sch.current.event.event_data) {
				let ed = JSON.parse(sch.current.event.event_data);
				if (ed.increase_duration) {
					minutes = sch.overlap.getTime(ed.voucher_duration) / 1000 / 60;
				}
			}
			$$('time-select-' + sch.windows.increase_duration.id).config.min = minutes;
			$$('time-select-' + sch.windows.increase_duration.id).setValue(voucher_duration);
		}
	},
	body: {
		view:"form",
		id: 'increase-form',
		elements: formIncreaseBooking
	}
};
