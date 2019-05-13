const completeForm = {
	view:'window',
	hidden: true,
	modal:true,
	id:'window-' + sch.windows.complete.id,
	position:'center',
	move:true,
	width: 500,
	height: 550,
	head: {
		view:"toolbar",
		id: "toolbar-" + sch.windows.complete.id,
		cols:[
			{ view:"label", label: "", id:"toolbar-label-" + sch.windows.complete.id, align:"left" },
			{
				view:"icon",
				id:"toolbar-close-icon-" + sch.windows.complete.id,
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
			let title = 'ID: ' + sch.current.event.eid;
			if (sch.current.event.voucher !== undefined) {
				title += ' Cert. ' + sch.current.event.voucher;
				// ID сертификата
				$$('voucher-' + sch.windows.complete.id).setValue(sch.current.event.voucher);
			} else {
				$$('voucher-' + sch.windows.complete.id).setValue('');
			}
			$$("toolbar-label-" + sch.windows.complete.id).setValue(title);
			// Инициализация даты и времени
			$$("start-date-" + sch.windows.complete.id).setValue(sch.current.event.start_date);
			$$("start-time-" + sch.windows.complete.id).setValue(sch.current.event.start_date);
			$$("end-time-" + sch.windows.complete.id).setValue(sch.current.event.end_date);
			// Симулятор
			$$('simulator-' + sch.windows.complete.id).setValue(sch.current.event.section_id);
			$$("pilot-" + sch.windows.complete.id).setValue(0);
			$$("rate-" + sch.windows.complete.id).setValue(false);
			$$("comment-" + sch.windows.complete.id).setValue('');
		}
	},
	body:{
		view:'form',
		padding: 10,
		rows:[
			{
				cols: [
					{
						view: "datepicker",
						name: "date",
						id: "start-date-" + sch.windows.complete.id,
						align: "left",
						label: "Flight date",
						format:"%d %M '%y",
						labelPosition: "top",
						width: 150,
					},
					{ width: 20 },
					{
						view:"datepicker",
						id: "start-time-" + sch.windows.complete.id,
						format:"%H:%i",
						type: "time",
						name: "start",
						label: "Start",
						labelPosition: "top",
						stringResult: true,
						minTime: sch.settings.calendar_start_time + ':00',
						maxTime: sch.settings.calendar_end_time + ':00',
					},
					{ width: 20 },
					{
						view:"datepicker",
						id: "end-time-" + sch.windows.complete.id,
						format:"%H:%i",
						type: "time",
						name: "finish",
						label: "Finish",
						labelPosition: "top",
						stringResult: true,
						minTime: sch.settings.calendar_start_time + ':30',
						maxTime: sch.settings.calendar_end_time + ':30',
					},
				]
			},
			{height:10},
			{
				cols: [
					{
						view: "fieldset",
						label: "Simulator and voucher ID",
						body: {
							cols: [
								{
									view: "radio",
									aligh: "right",
									width: 250,
									id:'simulator-' + sch.windows.complete.id,
									name: "simulator",
									value: "",
									options:[
										{ id: 1, value: "B737" },
										{ id: 2, value: "A320" }
									]
								},
								{ width: 20 },
								{
									view: "text",
									id:'voucher-' + sch.windows.complete.id,
									value: "",
									placeholder: "ID",
									name: "voucher",
									width: 120
								},
							]
						}
					},
				]
			},
			{ height: 10 },
			{
				cols: [
					{
						view: "richselect",
						name: "pilot",
						id: "pilot-" + sch.windows.complete.id,
						label: "Pilot",
						value: 0,
						options: "/RPC/takeoff/Pilots/Store/getList",
						required:true,
						invalidMessage:'Select the pilot'
					},
				]
			},
			{
				view: "checkbox",
				id: "rate-" + sch.windows.complete.id,
				name: "rate",
				label: "",
				labelRight: "Pilot school",
				value: 0
			},
			{
				view:'textarea',
				name:'comment',
				id: "comment-" + sch.windows.complete.id,
				height:80,
				value: '',
				placeholder:'Type comment'
			},
			{ height: 10 },
			{
				cols:[
					{ view:"button", type:"form", css:'btn-primary', id:"create-button-" + sch.windows.complete.id, value:"Apply", width:170, align:'left',
						on:{
							onItemClick: function (){
								if($$("pilot-" + sch.windows.complete.id).validate()) {
									machine.model.changeStateTo(sch.current.event.status);
									machine.model.dispatch('complete');
								}
							}
						}
					},
					{},
					{
						view:"button",
						id:'cancel-button-' + sch.windows.complete.id,
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