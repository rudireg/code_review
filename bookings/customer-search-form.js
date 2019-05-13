srch = {};
srch.updateEventInfo = true; // Следует ли обновлять представление события в блоке ИНФОРМАЦИЯ
srch.currentIndex = 0;

/**
 * Очистка формы переноса
 */
srch.clearCustomerSearchForm = function(formId) {
	$$('booking-list-' + formId).hide();
	$$('tabview-' + formId).hide();
	$$('search-cert-' + formId).setValue('');
	$$('search-phone-' + formId).setValue('');
	$$('search-cert-' + formId).focus();
	webix.html.removeCss($$('search-cert-' + formId).getNode(), 'webix_invalid');
	webix.html.removeCss($$('search-phone-' + formId).getNode(), 'webix_invalid');
	$$('edit-button-' + sch.windows.customer_search.id).hide();
};

/**
 * Инициализация списка бронирований
 * @param items
 * @param formId
 */
srch.initBookingList = function(items, formId) {
	let list = [];
	for (let i=0; i<items.length; ++i) {
		list.push({id:i+1, title:sch.formatjMyHi(items[i].start) + ' #<b>' + items[i].id + '</b>'});
	}
	$$('booking-list-' + formId).clearAll();
	$$('booking-list-' + formId).parse(JSON.stringify(list), 'json');
	$$('booking-list-' + formId).select(1);
};

srch.setCurrentEventForEdit = function (item) {
	sch.current.event = sch.res = item;
	sch.current.event.start_date = new Date(sch.current.event.start);
	sch.current.event.eid = sch.current.event.id;
};

/**
 * Обновить Информацию о текущем бронировании
 */
srch.updateCurrentItem = function () {
	if (srch.updateEventInfo === true && sch.windows.customer_search.items !== undefined) {
		webix.ajax().sync().post('/RPC/takeoff/Booking/Store/Read', {'id':sch.windows.customer_search.items[srch.currentIndex].id}, function (res) {
			if (res) {
				res = JSON.parse(res);
				res.event_data = JSON.parse(res.event_data);
				sch.windows.customer_search.items[srch.currentIndex] = res;
				srch.setCurrentEventForEdit(sch.windows.customer_search.items[srch.currentIndex]);
				sch.clearOptionsDialog(sch.windows.customer_search.id); // Clear Dialog
				setValueofBookingInfo(sch.windows.customer_search.items[srch.currentIndex], sch.windows.customer_search.id);
				initEventHistory(sch.windows.customer_search.id, sch.windows.customer_search.items[srch.currentIndex].eid);
			}
		});
	}
};

/**
 * Поиск бронирования
 * @param value
 * @param type
 */
srch.searchBookins = function(value, type) {
	webix.ajax().sync().post('/RPC/takeoff/Booking/Store/Search', {'value':value, 'type':type}, function (items) {
		items = JSON.parse(items);
		if (items && items.length > 0) {
			for(let i=0; i<items.length; ++i) {
				items[i].event_data = JSON.parse(items[i].event_data);
				if (items[i].event_data === null) {
					items[i].event_data = {};
				}
			}
			sch.windows.customer_search.items = items;
			$$('booking-list-' + sch.windows.customer_search.id).show();
			$$('tabview-' + sch.windows.customer_search.id).show();
			srch.initBookingList(items, sch.windows.customer_search.id);
			// Инициализация информацией о бронировании
			srch.setCurrentEventForEdit(items[0]);
			sch.clearOptionsDialog(sch.windows.customer_search.id); // Clear Dialog
			setValueofBookingInfo(items[0], sch.windows.customer_search.id);
			initEventHistory(sch.windows.customer_search.id, items[0].eid);
			$$('edit-button-' + sch.windows.customer_search.id).show();
			return true;
		} else {
			sch.msgForm("Nothing is found for the voucher: <b>" + value + "</b>", 'Info');
			srch.clearCustomerSearchForm(sch.windows.customer_search.id);
			if (type === 'cert') {
				$$('search-cert-' + sch.windows.customer_search.id).focus();
			} else {
				$$('search-phone-' + sch.windows.customer_search.id).focus();
			}
			$$('booking-list-' + sch.windows.customer_search.id).hide();
			$$('tabview-' + sch.windows.customer_search.id).hide();
			return false;
		}
	});
};

/**
 * Поиск клиента
 */
const customerSearch = {
	view: "window",
	hidden: true,
	modal: true,
	id: "window-" + sch.windows.customer_search.id,
	position: "center",
	move: true,
	width: 800,
	head: {
		view: "toolbar",
		id: "toolbar-" + sch.windows.customer_search.id,
		cols: [
			{view: "label", label: "Booking search", align: "left"},
			{},
			{
				view: "icon",
				id: "toolbar-close-icon-" + sch.windows.customer_search.id,
				icon: 'wxi-close',
				align: "right",
				hotkey: "esc",
				on: {
					onItemClick: function () {
						this.getTopParentView().hide();
					}
				}
			}
		]
	},
	on: {
		onShow: function() {
			srch.clearCustomerSearchForm(sch.windows.customer_search.id);
			sch.clearGarbage();
		},
		onHide: function () {
			edit.updateEventVisualisation = true; // Возвращаем синхронизацию редактирования с отображением календаря
			delete sch.windows.customer_search.items;
		}
	},
	body: {
		height: 580,
		width: 800,
		rows:[
			{
				view:'form',
				id:'form-' + sch.windows.customer_search.id,
				elements:[
					{view:'text', hidden:true, value:'', id:'type-search-' + sch.windows.customer_search.id},
					{
						cols:[
							{
								view:'text',
								name:'cert',
								id:'search-cert-' + sch.windows.customer_search.id,
								label:'by Voucher ID',
								validate:webix.rules.isNotEmpty,
								labelWidth:100,
								on:{
									onEnter: function () {
										this.setValue(this.getValue().trim());
										if(this.validate()) {
											srch.searchBookins(this.getValue(), 'cert');
										}
									},
									onfocus: function () {
										$$('type-search-' + sch.windows.customer_search.id).setValue('cert');
									}
								}
							},
							{width:20},
							{
								view:'text',
								name:'phone',
								id:'search-phone-' + sch.windows.customer_search.id,
								label:'by Phone',
								labelWidth:75,
								align: "right",
								validate:webix.rules.isNotEmpty,
								on:{
									onEnter: function () {
										this.setValue(this.getValue().trim());
										if(this.validate()) {
											srch.searchBookins(this.getValue(), 'phone');
										}
									},
									onfocus: function () {
										$$('type-search-' + sch.windows.customer_search.id).setValue('phone');
									}
								}
							},
							{width:20},
							{
								view:'text',
								name:'booking',
								id:'search-booking-' + sch.windows.customer_search.id,
								label:'by Booking ID',
								labelWidth:100,
								validate:webix.rules.isNotEmpty,
								on:{
									onEnter: function () {
										this.setValue(this.getValue().trim());
										if(this.validate()) {
											srch.searchBookins(this.getValue(), 'booking');
										}
									},
									onfocus: function () {
										$$('type-search-' + sch.windows.customer_search.id).setValue('booking');
									}
								}
							}
						]
					},
					{
						view:"list",
						id:'booking-list-' + sch.windows.customer_search.id,
						template:"#title#",
						select:true,
						scroll:"x",
						layout:"x",
						data:[],
						on:{
							onSelectChange:function (newV, oldV) {
								srch.currentIndex = newV -1;
								srch.setCurrentEventForEdit(sch.windows.customer_search.items[srch.currentIndex]);
								sch.clearOptionsDialog(sch.windows.customer_search.id); // Clear Dialog
								setValueofBookingInfo(sch.res, sch.windows.customer_search.id);
								initEventHistory(sch.windows.customer_search.id, sch.res.eid);
							}
						}
					},
					{
						view:"tabview",
						id: 'tabview-' + sch.windows.customer_search.id,
						padding:0,
						cells:[
							{
								header:"Booking",
								body: infoEventBlock(sch.windows.customer_search.id)
							},
							{
								header:'History',
								body: eventHistory(sch.windows.customer_search.id)
							}
						]
					}
				]
			},
			{
				padding:10,
				cols:[
					{
						view:"button",
						id:'edit-button-' + sch.windows.customer_search.id,
						value:"Edit",
						width:150,
						align:'left',
						on: {
							onItemClick: function () {
								let allEvents = sch.scheduler.getEvents();
								let tmp = sch.getDataIfExistsPropertyInArray(allEvents, 'eid', sch.windows.customer_search.items[srch.currentIndex].id);
								if (tmp === null) {
									edit.updateEventVisualisation = false; // Нам не нужно визуальное обновление плашки в календаре
								} else {
									sch.current.event = tmp;
									edit.updateEventVisualisation = true; // Нам не нужно визуальное обновление плашки в календаре
								}
								$$("window-" + sch.windows.editor.id).show();
							}
						}
					},
					{},
					{ view:"button", type:"form", css:'btn-primary', id:"create-button-" + sch.windows.customer_search.id, value:"Find", width:170, align:'left',
						on:{
							onItemClick: function () {
								let type = $$('type-search-' + sch.windows.customer_search.id).getValue();
								let value = '';
								switch (type) {
									case 'cert':
										$$('search-cert-' + sch.windows.customer_search.id).setValue($$('search-cert-' + sch.windows.customer_search.id).getValue().trim());
										value = $$('search-cert-' + sch.windows.customer_search.id).getValue();
										break;
									case 'phone':
										$$('search-phone-' + sch.windows.customer_search.id).setValue($$('search-phone-' + sch.windows.customer_search.id).getValue().trim());
										value = $$('search-phone-' + sch.windows.customer_search.id).getValue();
										break;
									case 'booking':
										$$('search-booking-' + sch.windows.customer_search.id).setValue($$('search-booking-' + sch.windows.customer_search.id).getValue().trim());
										value = $$('search-booking-' + sch.windows.customer_search.id).getValue();
										break;
								}
								value = value.trim();
								if (value.length < 1) {
									webix.alert("You have to specify a search data.");
									return false;
								}
								srch.searchBookins(value, type);
							}
						}
					},
					{
						view:"button",
						css:"bt_cancel",
						value:"Close",
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
