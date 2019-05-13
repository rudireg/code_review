/**
 * Окно содержит список напоминаний за 1 день
 */
const reminderInfo = {
	view:"window",
	hidden: true,
	modal:true,
	id:"window-" + sch.windows.reminder.id,
	position:"center",
	move:true,
	height:600,
	width:800,
	head: {
		view: "toolbar",
		margin: -4,
		cols: [
			{
				view: "label",
				id: 'dialog-title-' + sch.windows.reminder.id,
				label: "Reminder list",
			},
			{
				view: "icon",
				icon: "wxi-close",
				css: "alter",
				click: function(){ this.getTopParentView().hide(); },
				hotkey: "esc"
			},
		],
	},
	on:  {
		onShow: function () {},
		onHide: function () {
			$$('list-' + sch.windows.reminder.id).clearAll();
			$$("dataview-" + sch.windows.reminder.id).clearAll();
		},
		onBeforeShow: function () {
			let date = sch.windows.reminder.currDate;
			let items = (sch.reminders.items[date] !== undefined)? sch.reminders.items[date] : [];
			$$('list-' + sch.windows.reminder.id).clearAll();
			$$('dialog-title-' + sch.windows.reminder.id).setValue("Reminder list on " + date);
			if (items.length > 0) {
				let selectId = items[0].id;
				for (let inx in items) {
					items[inx]['phone'] = sch.formatPhone(items[inx]['phone']);
				}
				$$('list-' + sch.windows.reminder.id).parse(JSON.stringify(items), 'json');
				$$('list-' + sch.windows.reminder.id).select(selectId);
			}
		}
	},
	body: {
		padding: 15,
		rows:[
			{
				cols:[
					{
						view: "list",
						id: 'list-' + sch.windows.reminder.id,
						dynamic: true,
						width: 250,
						select:true,
						template: "#shot_simulator_name# #admin_duration# - #fio#",
						on: {
							onSelectChange: function (id) {
								let date = sch.windows.reminder.currDate;
								for (let i=0; i<sch.reminders.items[date].length; ++i) {
									if (parseInt(sch.reminders.items[date][i].id) === parseInt(id[0])) {
										$$("dataview-" + sch.windows.reminder.id).clearAll();
										$$("dataview-" + sch.windows.reminder.id).parse(JSON.stringify(sch.reminders.items[date][i]));
										break;
									}
								}
							}
						}
					},
					{
						view:"dataview",
						id:"dataview-" + sch.windows.reminder.id,
						xCount:1,
						yCount:1,
						template:
						"<div class='reminder-block'>" +
						"<div style='display:none;'>Notice ID: <span id='notice_id'>#notice_id#</span></div>" +
						"<div>Voucher ID: <strong>#voucher# </strong></div>" +
						"<div>Simulator: <strong>#simulator_name# </strong></div>" +
						"<div>Fly time (cert.): <strong>#humanDuration# </strong></div>" +
						"<div>Fly time (admin): <strong>#admin_duration# </strong></div>" +
						"<div>Status: <strong>#status#</strong></div>" +
						"<div>Customer: <strong>#fio#</strong></div>" +
						"<div>Phone: <input readonly class='bolder none-border' type='text' value='#phone#'/></div>" +
						"<div>Email: <input readonly class='bolder none-border' type='text' value='#email#'/></div>" +
						"<div><textarea id='textarea-comment-data' onclick='document.getElementById(\"edit-notice-comment\").style.display = \"block\";' style='height:40px;width:340px;'>#comment#</textarea></div>" +
						"<div style='width: 150px;height: 38px;float: left;' class='webix_el_box'><button onclick='updateNoticeComment();' style='height: 100%;width: 100%;border-radius: 5px; display: none;' id='edit-notice-comment' class='webixtype_base'>Save comment</button></div>" +
						"<div>",
						type:{
							width: 500,
							height: 500
						},
						editable:true,
						editor:'text',
						editValue:'comment',
					}
				]
			},
			{
				cols:[
					{
						view:"icon",
						id:"button-add-" + sch.windows.reminder.id,
						icon:"fas fa-plus",
						type:"base",
						align:'left',
						click: function(){
							$$("window-" + sch.windows.add_reminder.id).show();
						}
					},
					{
						view:"icon",
						id:"button-delete-" + sch.windows.reminder.id,
						icon:"fas fa-trash",
						type:"base",
						css:'color-red',
						align:'left',
						click: function(){
							webix.confirm({
								text:"The reminder will be removed.\nContinue?",
								callback: function(result){
									if (result === true) {
										let selectedId = $$('list-' + sch.windows.reminder.id).getSelectedId();
										if (selectedId > 0) {
											webix.ajax().sync().post('/RPC/takeoff/Booking/Reminder/Delete', {'id':selectedId}, function (res) {
												if (res === 'true') {
													let date = sch.windows.reminder.currDate;
													sch.updateReminderForm(date);
													if (sch.reminders.items[date] === undefined || sch.reminders.items[date].length < 1) {
														document.querySelector("#staff-notice-icon-block-" + date).classList.remove("color-red");
														document.querySelector("#staff-notice-icon-block-" + date).classList.add("color-gray");
													}
													webix.message({text:"The reminder is deleted.", type:"info"});
												}
											});
										}
									}
								}
							});
						}
					},
					{},
					{
						view:"button",
						id:"button-" + sch.windows.reminder.id,
						value:"Close",
						type:"base",
						align:'right',
						inputWidth:100,
						click: function(){ this.getTopParentView().hide(); }
					}
				]
			}
		]
	}
};

/**
 * Обновить комментарий напоминания
 */
function updateNoticeComment () {
	let comment = document.getElementById('textarea-comment-data').value;
	let id= parseInt(document.getElementById('notice_id').innerText);
	let data = {'id':id, 'comment':comment};
	webix.ajax().sync().post('/RPC/takeoff/Booking/Reminder/Update', {'data':data}, function (res) {
		document.getElementById("edit-notice-comment").style.display = "none";
		if (res === 'true') {
			webix.message({text:"Успешно обновили комментарий."});
			let date = sch.windows.reminder.currDate;
			for (let i=0; i<sch.reminders.items[date].length; ++i) {
				if (parseInt(sch.reminders.items[date][i].id) === id) {
					sch.reminders.items[date][i].comment = comment;
					break;
				}
			}
		} else {
			webix.alert({text:"Ошибка обновления комментария.", type:'error'});
		}
	});
}

/**
 * Окно добавления нового напоминания
 */
const addNewReminder = {
	view:"window",
	hidden: true,
	modal:true,
	id:"window-" + sch.windows.add_reminder.id,
	position:"center",
	move:true,
	width:400,
	head: {
		view: "toolbar",
		margin: -4,
		cols: [
			{
				id: 'label-' + sch.windows.add_reminder.id,
				view: "label",
				label: "To create a reminder"
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
			$$('label-' + sch.windows.add_reminder.id).setValue('To create a reminder on: ' + sch.windows.reminder.currDate);
			$$('form-' + sch.windows.add_reminder.id).clear();
			$$('sert-id-' + sch.windows.add_reminder.id).focus();
			$$('detail-' + sch.windows.add_reminder.id).hide();
			$$("time-select-" + sch.windows.add_reminder.id).setValue('30');
			$$("time-select-view-" + sch.windows.add_reminder.id).setValue('30 minutes');
			$$('name-' + sch.windows.add_reminder.id).setValue('');
			$$('phone-' + sch.windows.add_reminder.id).setValue('');
			$$('email-' + sch.windows.add_reminder.id).setValue('');
			$$('new-comments-' + sch.windows.add_reminder.id).setValue('');
			webix.html.removeCss($$('phone-' + sch.windows.add_reminder.id).getNode(), 'webix_invalid');
			webix.html.removeCss($$('email-' + sch.windows.add_reminder.id).getNode(), 'webix_invalid');
			$$('simulator-' + sch.windows.add_reminder.id).setValue(2);
		}
	},
	body: {
		rows:[
			{
				view:"form",
				width: 600,
				id: 'form-' + sch.windows.add_reminder.id,
				elements:[
					{
						view: 'text',
						value: '',
						name: 'new_remind_sert_id',
						label:'Voucher ID',
						labelWidth:120,
						id: 'sert-id-' + sch.windows.add_reminder.id,
						validate: webix.rules.isNotEmpty,
						on:{
							onEnter:function () {
								if(this.validate()) {
									webix.ajax().sync().post('/RPC/takeoff/Vouchers/Store/getGiftProperty', {'id': this.getValue()}, function (res) {
										res = JSON.parse(res);
										console.log(res);
										sch.windows.add_reminder.gift = res;
										if ($$('detail-' + sch.windows.add_reminder.id).isVisible()) {
											$$('new-comments-' + sch.windows.add_reminder.id).setValue('');
										}
										$$('detail-' + sch.windows.add_reminder.id).show();
										$$('code-' + sch.windows.add_reminder.id).setValue(res.code);
										$$('status-' + sch.windows.add_reminder.id).setValue(res.status);
										$$('duration_title-' + sch.windows.add_reminder.id).setValue(res.duration_title);
										$$('comments-' + sch.windows.add_reminder.id).setValue(res.comment);
										if (res.comment === null) {
											$$('comments-' + sch.windows.add_reminder.id).hide();
										} else {
											$$('comments-' + sch.windows.add_reminder.id).show();
										}
										// Отображаем имя, телефон и email того пользователя, на котором было создано последнее бронирование
										let customer ='';
										let fio   ='';
										let email ='';
										let phone ='';
										if (res.duplicateVouchers.length > 0) {
											customer = res.duplicateVouchers[0]['customer'];
											fio   = res.duplicateVouchers[0]['fio'];
											email = res.duplicateVouchers[0]['email'];
											phone = res.duplicateVouchers[0]['phone'];
										} else {
											customer = res.customer;
											fio   = res.fio;
											email = res.email;
											phone = res.phone;
										}
										$$('name-' + sch.windows.add_reminder.id).setValue(fio);
										$$('email-' + sch.windows.add_reminder.id).setValue(email);
										$$('phone-' + sch.windows.add_reminder.id).setValue(sch.formatPhone(phone));
										// Инициализируем админское время продолжительности полета
										$$('time-select-' + sch.windows.add_reminder.id).setValue(res.duration);
										webix.html.removeCss($$('phone-' + sch.windows.add_reminder.id).getNode(), 'webix_invalid');
										webix.html.removeCss($$('email-' + sch.windows.add_reminder.id).getNode(), 'webix_invalid');
									});
								}
							}
						}
					},
					{
						id:'detail-' + sch.windows.add_reminder.id,
						rows:[
							{
								height:30,
								cols:[
									{view:'label', label:'Status:', width:90},
									{view:'label', label:'', css:'bolder', id:'status-' + sch.windows.add_reminder.id, align:'left'}
								]
							},
							{
								height:30,
								cols:[
									{view:'label', label:'Code:', width:90},
									{view:'label', label:'', css:'bolder', id:'code-' + sch.windows.add_reminder.id, align:'left'}
								]
							},
							{
								height:30,
								cols:[
									{view:'label', label:'Flight:', width:90},
									{view:'label', label:'', css:'bolder', id:'duration_title-' + sch.windows.add_reminder.id, align:'left'}
								]
							},
							{
								view:'textarea',
								css: 'no-border',
								id: 'comments-' + sch.windows.add_reminder.id,
								readonly: true
							}
						]
					},
					{
						view: "select",
						name: "Simulator",
						labelWidth:120,
						id: 'simulator-' + sch.windows.add_reminder.id,
						label: "Simulator",
						value:2,
						options: "/RPC/takeoff/Simulators/Store/GetList",
					},
					{
						view: 'text',
						value: '',
						label:'Name:',
						labelWidth:120,
						id: 'name-' + sch.windows.add_reminder.id
					},
					{
						view: 'text',
						value: '',
						label:'Phone:',
						labelWidth:120,
						id: 'phone-' + sch.windows.add_reminder.id,
						name: 'phone'
					},
					{
						view: 'text',
						value: '',
						label:'Email:',
						labelWidth:120,
						id: 'email-' + sch.windows.add_reminder.id,
						name: 'email',
						validate: webix.rules.isEmail
					},
					{
						view:'textarea',
						id: 'new-comments-' + sch.windows.add_reminder.id,
						placeholder: 'Write a comment'
					},
					humanTimeSelect(sch.windows.add_reminder.id),
					{},
					{
						view:"button",
						id:"button-adding-" + sch.windows.add_reminder.id,
						value:"Create",
						type:"form",
						align:'right',
						width:100,
						click: function(){
							// Если указан ID сертификата
							if ($$('detail-' + sch.windows.add_reminder.id).isVisible()) {
								if ($$('sert-id-' + sch.windows.add_reminder.id).validate()) {
									let params = {
										'start':     sch.windows.reminder.currDate,
										'simulator': $$('simulator-' + sch.windows.add_reminder.id).getValue(),
										'voucher':   $$('sert-id-' + sch.windows.add_reminder.id).getValue(),
										'comment':   $$('new-comments-' + sch.windows.add_reminder.id).getValue().trim(),
										'confirmed': false,
										'admin_duration': $$('time-select-' + sch.windows.add_reminder.id).getValue() * 60,
										'name':  $$('name-' + sch.windows.add_reminder.id).getValue().trim(),
										'phone': $$('phone-' + sch.windows.add_reminder.id).getValue().trim(),
										'email': $$('email-' + sch.windows.add_reminder.id).getValue().trim(),
									};
									webix.ajax().post('/RPC/takeoff/Booking/Reminder/Add', params, function (res) {
										if (res >= 0) {
											// Обновляем данные окна - содержащего список напоминаний
											sch.updateReminderForm(sch.windows.reminder.currDate);
											$$("window-" + sch.windows.add_reminder.id).hide();
											webix.message({text:"The reminder is successfully created.", type:"info"});
										} else {
											webix.alert({text:"Error of creating the reminder.", type:"error"});
										}
									}).fail(function (xhr) {
										if (xhr.status > 700) {
											webix.alert({text:xhr.responseText, type:"error"});
										} else {
											webix.alert({text:"Error of creating the reminder.", type:"error"});
										}
									});
								}
							} else {
								if ($$('sert-id-' + sch.windows.add_reminder.id).getValue().trim().length > 0) {
									if (false === confirm("You specified the voucher ID but did not press ENTER.\nContinue?")) {
										$$('sert-id-' + sch.windows.add_reminder.id).focus();
										return false;
									}
								}
								if (!$$('phone-' + sch.windows.add_reminder.id).validate()) {
									return false;
								}
								let email = $$('email-' + sch.windows.add_reminder.id).getValue().trim();
								if (email.length > 0 && !$$('email-' + sch.windows.add_reminder.id).validate()) {
									return false;
								}
								let params = {
									'start':     sch.windows.reminder.currDate,
									'simulator': $$('simulator-' + sch.windows.add_reminder.id).getValue(),
									'comment':   $$('new-comments-' + sch.windows.add_reminder.id).getValue().trim(),
									'admin_duration': $$('time-select-' + sch.windows.add_reminder.id).getValue() * 60,
									'name':  $$('name-' + sch.windows.add_reminder.id).getValue().trim(),
									'phone': $$('phone-' + sch.windows.add_reminder.id).getValue().trim(),
									'email': email
								};
								if (email.length < 3) {delete params.email;}
								webix.ajax().post('/RPC/takeoff/Booking/Reminder/Add', params, function (res) {
									if (res >= 0) {
										// Обновляем данные окна - содержащего список напоминаний
										sch.updateReminderForm(sch.windows.reminder.currDate);
										$$("window-" + sch.windows.add_reminder.id).hide();
										webix.message({text:"The reminder is created successfully.", type:"info"});
									} else {
										webix.message({text:"Error of creating the reminder!", type:"error"});
									}
								}).fail(function (xhr) {
									if (xhr.status > 700) {
										webix.alert({text:xhr.responseText, type:"error"});
									} else {
										webix.alert({text:"Error of creating the reminder!!", type:"error"});
									}
								});
							}
						}
					}
				]
			}
		]
	}
};

/**
 * Форма управления рассписанием работы сотрудников
 */
const staffUsersPopup = {
	view: "popup",
	position:"center",
	id: "staff-users-popup",
	body: {
		view:'form',
		id:"staff-users-layout",
		rows:[
			{view:'label', id:'staff-users-popup-date', hidden:true, value:''},
			{
				rows:[
					{

						view:"multicombo",
						name: "staff-users-layout-admin",
						id:"staff-users-layout-admin",
						label:"Administrators",
						labelPosition:"top",
						options: sch.adminList
					},
					{
						view:"multicombo",
						name: "staff-users-layout-pilot",
						id:"staff-users-layout-pilot",
						label:"Pilots",
						labelPosition:"top",
						options: sch.pilotList
					}
				]
			},
			{
				cols:[
					{ view:"button", type:"form", css:'btn-primary', id:"button_stuff_create", value:"Save", width:120, align:'left',
						on:{
							onItemClick:function(){
								let date = new Date($$('staff-users-popup-date').getValue()); //.current_popup_date + ' 10:00:00';
								date.setHours(10, 0, 0, 0);
								let arr = $$('staff-users-layout-admin').getValue() + ',' + $$('staff-users-layout-pilot').getValue();
								arr = arr.split(',') ;
								let users = [];
								for(let i=0; i<arr.length; ++i) {
									if (arr[i].length > 0) {
										users.push(arr[i]);
									}
								}
								webix.ajax().post('/RPC/takeoff/Staff/Store/Add', {'users':users, 'date':date, 'clear':true}, function (res) {
									let userIconId = sch.formatYmd(new Date(date));
									if (users.length > 0) {
										document.querySelector("#staff-users-icon-block-" + userIconId).classList.remove("color-gray");
										document.querySelector("#staff-users-icon-block-" + userIconId).classList.add("color-green");
									} else {
										document.querySelector("#staff-users-icon-block-" + userIconId).classList.remove("color-green");
										document.querySelector("#staff-users-icon-block-" + userIconId).classList.add("color-gray");
									}
									$$('staff-users-popup').hide();
								}).fail(function (xhr) {
									sch.msgForm('Error of adding the employee.', 'Error');
									return false;
								});
							}
						}
					},
					{ view:"button", id:'button_staff_cancel', css:"bt_cancel", value:"Cancel", width:100, align:'right',
						on:{
							onItemClick: function () {
								this.getTopParentView().hide();
							}
						}
					}
				]
			}
		]
	},
	on: {
		onShow:function () {
			// Инициализация данными
			let date = $$('staff-users-popup-date').getValue();
			date = sch.formatYmd(new Date(date));
			webix.ajax().sync().post('/RPC/takeoff/Staff/Store/getStaffByDate', {'date':date}, function (res) {
				res = JSON.parse(res);
				if (res.length < 1) {
					$$('staff-users-layout-admin').setValue('');
					$$('staff-users-layout-pilot').setValue('');
					$$('staff-users-layout-admin').enable();
					$$('staff-users-layout-pilot').enable();
					$$('button_stuff_create').enable();
					document.querySelector("#staff-users-icon-block-" + date).classList.remove("color-green");
					document.querySelector("#staff-users-icon-block-" + date).classList.add("color-gray");
				} else {
					let admins = [];
					let pilots = [];
					res.forEach(function(item) {
						if (sch.isExistsPropertyInArray(sch.adminList, 'id', item.uid)) {
							admins.push(item.uid);
						} else if (sch.isExistsPropertyInArray(sch.pilotList, 'id', item.uid)) {
							pilots.push(item.uid);
						}
					});
					$$('staff-users-layout-admin').setValue(admins.join(','));
					$$('staff-users-layout-pilot').setValue(pilots.join(','));
					// Если дата в прошлом то отключаем кнопку редактирования списка сотрудников
					let nowDate  = new Date();
					let itemDate = new Date(date);
					nowDate.setHours(0, 0, 0, 0);
					itemDate.setHours(0, 0, 0, 0);
					if (itemDate.getTime() < nowDate.getTime()) {
						$$('button_stuff_create').disable();
					} else {
						$$('button_stuff_create').enable();
					}
					document.querySelector("#staff-users-icon-block-" + date).classList.remove("color-gray");
					document.querySelector("#staff-users-icon-block-" + date).classList.add("color-green");
				}
			});
		}
	}
};
