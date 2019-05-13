//todo: Нельзя делать 4 подряд идущие получасовые бронирования

webix.require('/-/webix/kanri/calendar-time.js', true);

// Неделю начинать с ПН или с текущей даты.
// TODO сделать управление настройкой параметра через PWA 
// let startCalendarFromMonday = true; // (global.App.fromMonday == 1);
let startCalendarFromMonday = App.fromMonday;

/**
 * Шаблон для отображения Tooltip
 */
function setShowTooltipTemplate() {
	let formatHi = webix.Date.dateToStr("%H:%i");
	sch.scheduler.templates.tooltip_text = function(start, end, event) {
		let tooltipBody = "<div id='tooltip_text_body' style='max-width:500px;font-size:16px;'>";
		// Школа пилотов
		if (event.type === 'school') {
			tooltipBody += "<div style='margin-bottom:7px;'><span style='padding-right:10px;color:red;'>Pilot school</span>";
			tooltipBody += "</div>";
		}
		// Доплата за полет surcharge
		if (parseInt(event.surcharge) > 0) {
			tooltipBody += "<div style='margin-bottom:7px;'><span style='padding-right:10px;color:red;'>Surcharge:</span>";
			tooltipBody += "<span style='color:#000;padding-right:10px;'>" + event.surcharge + " rub</span>";
			tooltipBody += "</div>";
		}
		// Дополнительная информация по бронированию
		if (event.event_data !== null && event.event_data !== undefined) {
			let eventData = JSON.parse(event.event_data);
			// Если бронирование сделано через сайт методом online-booking
			if (eventData.online_booking !== undefined && eventData.online_booking === 1) {
				tooltipBody +=  "<div style='color:#ff4444;margin-bottom:7px;'>Online booking from site</div>";
			}
			// Speak English
			if (eventData.speak_english && parseInt(eventData.speak_english) === 1) {
				tooltipBody +=  "<div style='color:#ff4444;margin-bottom:7px;'>English speaking pilot</div>";
			}
		}
		// Статус
		if (event.type !== 'buffer' && event.type !== 'maintenance') {
			let statusText = '';
			switch (event.status) {
				case 'new':
					statusText = 'new booking';
					break;
				case 'technical_rebooking':
					statusText = 'technical moving of booking';
					break;
				case 'rebooking':
					statusText = 'moving of booking';
					break;
				case 'complete':
					statusText = 'the flight is completed';
					break;
				case 'fail':
					statusText = 'customer negligence';
					break;
				case 'refund':
					statusText = 'refund';
					break;
				case 'majeure':
					statusText = 'a respectful reason';
					break;
				case 'technical':
					statusText = 'technical problem';
					break;
				default:
					statusText = 'not defined';
					break;
			}
			tooltipBody += "<div style='margin-bottom:7px;'><span style='padding-right:10px;'>Booking ID:</span>";
			tooltipBody += "<span style='color:#000;padding-right:10px;'>" + event.eid + "</span>";
			tooltipBody += "</div>";
			if (event.voucher) {
				tooltipBody += "<div style='margin-bottom:7px;'><span style='padding-right:10px;'>Voucher:</span>";
				tooltipBody += "<span style='color:#000;padding-right:10px;'>" + event.pin + '&mdash;' + event.voucher + "</span>";
				tooltipBody += "</div>";
			}
			tooltipBody += "<div style='margin-bottom:7px;'><span style='padding-right:10px;'>Status:</span>";
			tooltipBody += "<span style='color:#000;padding-right:10px;'>" + event.status + " ("+ statusText +")</span>";
			tooltipBody += "</div>";
			// Контакт 1
			if ((event.fio !== null && event.fio !== undefined) || (event.phone !== null && event.phone !== undefined)) {
				tooltipBody += "<div style='margin-bottom:7px;'><span style='padding-right:10px;'>Contact:</span>";
				// Имя
				if (event.fio !== null && event.fio !== undefined) {
					tooltipBody += "<span style='color:#000;padding-right:10px;'>" + event.fio + "</span>";
				}
				// Телефон
				if (event.phone !== null && event.phone !== undefined) {
					tooltipBody += "<span style='color:#000;padding-right:10px;'>" + sch.formatPhone(event.phone) + "</span>";
				}
				tooltipBody += "</div>";
			}
			// Контакт 2
			if ((event.add_fio !== null && event.add_fio !== undefined) || (event.add_phone !== null && event.add_phone !== undefined)) {
				tooltipBody += "<div style='margin-bottom:7px;'><span style='padding-right:10px;'>Add. contact:</span>";
				// Имя
				if (event.add_fio !== null && event.add_fio !== undefined) {
					tooltipBody += "<span style='color:#000;padding-right:10px;'>" + event.add_fio + "</span>";
				}
				// Телефон
				if (event.add_phone !== null && event.add_phone !== undefined) {
					tooltipBody += "<span style='color:#000;padding-right:10px;'>" + sch.formatPhone(event.add_phone) + "</span>";
				}
				tooltipBody += "</div>";
			}
		}
		// Длительность
		tooltipBody += "<div style='margin-bottom:7px;'><span style='padding-right:10px;'>Duration:</span><span style='color:#000;padding-right:10px;'>" + formatHi('1970.01.01 ' + event.duration) + "</span></div>";
		// Комментарий
		if (event.text !== null && event.text !== undefined && event.text.length > 0) {
			tooltipBody +=  "<div style='float:left;padding-right:10px;'>Comment</div>" +
				            "<div style='float:left;color:#000;'>" + event.text + "</div>";
		}
		tooltipBody += "</div>";
		return tooltipBody;
	};
}

/**
 * Webix protoUI
 */
webix.protoUI({
	name:"dhx-scheduler",
	defaults:{
		tabs:["weekunit", "single_unit"]
	},
	getScheduler:function(waitScheduler){
		return waitScheduler ? this._waitScheduler : this._scheduler;
	},
	setEventDuration:function(){
		alert('this setEventDuration');
	},
	$init:function(config){
		this._waitScheduler = webix.promise.defer();
		this.$ready.push(function(){
			let tabs = this.config.tabs;
			let updateBtn = "<i class='fa fa-spinner booking-search' title='Booking Search' onclick='updateSchedulerEvents();'></i>";
			let searchBtn = "<i class='fa fa-search booking-search' title='Booking Search' onclick='showSearchForm();'></i>";
			let html = ["<div class='dhx_cal_container' style='width:100%; height:100%;'>" +
							"<div class='dhx_cal_navline' style='margin-left:15px;'>" +
								// "<div class='dhx_update_button'>"+updateBtn+"</div>" +
								"<div class='dhx_cal_today_button'></div>" +
								"<div class='dhx_cal_prev_button'>&nbsp;</div>" +
								"<div class='dhx_cal_next_button'>&nbsp;</div>" +
								"<div class='dhx_cal_date'></div>"];

			if (tabs) {
				let left = 220; // Смещение меню в пикселях
				for (let i=0; i<tabs.length; i++) {
					html.push("<div style='left:" + left + "px;' class='dhx_cal_tab" +
						((i===0)? " dhx_cal_tab_first":"") +
						((i===tabs.length-1)? " dhx_cal_tab_last":"") +
						"' name='" + tabs[i] + "_tab' ></div>");
					left += 80; // Инкремент смещения меню в пикселях
				}
			}

			html.push("<div class='dhx_search_button'>"+searchBtn+"</div>");
			html.push("</div><div class='dhx_cal_header'></div><div class='dhx_cal_data'></div></div>");
			html.push("<div id='staff-dom-container'></div>");
			this.$view.innerHTML = html.join("");

			//because we are not messing with resize model
			//if setSize will be implemented - below line can be replaced with webix.ready
			webix.delay(webix.bind(this._render_once, this));
		});
		this.attachEvent("onDestruct", function(){
			let sch = this.getScheduler();
			if (sch) {
				scheduler.cancel_lightbox();
			}
		});
	},
	$setSize: function(x,y){
		if(webix.ui.view.prototype.$setSize.call(this,x,y)){
			if(this._scheduler)
				this._scheduler.setCurrentView();
		}
	},
	_render_once:function(){
		webix.require("/-/webix/scheduler/dhtmlxscheduler_material.css");
		webix.require([
			"/-/webix/scheduler/dhtmlxscheduler.js",
			"/-/webix/scheduler/locale/locale_en.js",
			"/-/webix/scheduler/ext/dhtmlxscheduler_limit.js",
			"/-/webix/scheduler/ext/dhtmlxscheduler_tooltip.js",
			"/-/webix/scheduler/ext/dhtmlxscheduler_collision.js",
			"/-/webix/scheduler/ext/dhtmlxscheduler_minical.js",
			"/-/webix/scheduler/ext/dhtmlxscheduler_readonly.js",
			"/-/webix/scheduler/ext/dhtmlxscheduler_units.js"
		], function() {
			let scheduler = sch.scheduler = this._scheduler = window.Scheduler ? Scheduler.getSchedulerInstance() : window.scheduler;

			scheduler.config.xml_date = "%Y-%m-%d %H:%i";
			scheduler.config.first_hour = sch.settings.calendar_start_time;
			scheduler.config.last_hour = parseInt(sch.settings.calendar_end_time) + 1;
			scheduler.config.multi_day = false;
			scheduler.locale.labels.weekunit_tab = "Week";
			scheduler.locale.labels.single_unit_tab = "Day";
			scheduler.locale.labels.section_custom = "Section";
			scheduler.locale.labels.new_event = "";
			scheduler.config.details_on_create = false;
			scheduler.config.details_on_dblclick = false;
			scheduler.config.drag_create = false;
			scheduler.config.drag_move = true;
			scheduler.config.drag_out = false; // Запрещаем перетаскивать событие на занятое место
			scheduler.config.time_step = 30;
			scheduler.config.select = false; // shows/hides the select bar in the event's box
			scheduler.config.separate_short_events = true;
			scheduler.config.container_autoresize = true;
			scheduler.config.fix_tab_position = false;
			scheduler.config.show_loading = true;
			scheduler.config.scroll_hour = sch.settings.calendar_start_time;

			// Сохраняем данные захваченного Drag события
			scheduler.attachEvent("onBeforeDrag", function (id, mode, e){
				sch.isDragMode = true;
				sch.draggedEvent = scheduler.getEvent(id); // При Drag-Drop - изменяемые данные события
				// Отключаем расягивание для событий которые не являются буфером или ТО
				if (mode === 'resize' && sch.draggedEvent.type !== 'buffer' && sch.draggedEvent.type !== 'maintenance') {
					return false;
				}
				sch.saveEvent(sch.draggedEvent); // Клонирование события (пригодится для сравнения его данных с новым) Хранится в sch.saveEventValues
				return true;
			});

			// Событие после завершения Drop события
			scheduler.attachEvent("onDragEnd", function(id, mode, e){
				if (id === null || (mode !== 'move' && mode !== 'resize')) {return false;}
				// Если при перетаскивании событие встало назад на свое место
				if (sch.draggedEvent === undefined || sch.draggedEvent.start_date === undefined ||
					sch.saveEventValues === undefined || sch.saveEventValues.start_date === undefined ||
					(sch.draggedEvent.start_date.getTime() === sch.saveEventValues.start_date.getTime() &&
					sch.draggedEvent.section_id === sch.saveEventValues.section_id)
				){
					if (mode !== 'resize') {
						return false;
					}
				}
				//sch.current.event = sch.draggedEvent;
				sch.current.event = sch.scheduler.getEvent(sch.draggedEvent.id);
				// Проверка изменился ли тип тренажера
				if (sch.saveEventValues.type !== 'buffer' && sch.saveEventValues.type !== 'maintenance') {
					if (sch.saveEventValues.section_id !== sch.draggedEvent.section_id) {
						let newSimName = (sch.draggedEvent.section_id === 1)? 'B737' : 'A320';
						webix.confirm({
							text:"The simulator type will be changed to <b>" + newSimName + "</b><br>Continue?",
							callback: function(result){
								if (!result) {
									sch.resetEventPosition(id);
									return false;
								}
								sch.showLightBoxForDrag(id);
							}
						});
					} else {
						sch.showLightBoxForDrag(id);
					}
				} else {
					sch.actions.doDragEndBuffer(sch.draggedEvent); // Перенос буфера без подтверждающего окна
				}
			});

			// Background Color for Sunday and Saturday
			scheduler.addMarkedTimespan({
				zones:"fullday",
				days:[0, 6], // limits Sunday and Saturday
				css: "dhx_scale_holder_holiday"
			});

			// Расширяем высоту дней. Отображаем время слевой стороны
			let step = 15;
			let format = scheduler.date.date_to_str("%H:%i");
			scheduler.config.hour_size_px = (60/step)*22;
			scheduler.templates.hour_scale = function(date){
				let html = '';
				for (let i=0; i < 60/step; i++) {
					html += "<div style='height:22px;line-height:22px;font-size:14px;'><b>"+ ((i&1)?'&nbsp;':format(date))+"</b></div>";
					date = scheduler.date.add(date, step, 'minute');
				}
				return html;
			};

			// имена секций для тренажеров
			let sections = App.simulators;

			scheduler.config.lightbox.sections = [
				{name:"description", height:130, map_to:"text", type:"textarea" , focus:true},
				{name:"custom", height:23, type:"select", options:sections, map_to:"section_id" },
				{name:"time", height:72, type:"time", map_to:"auto"}
			];

			scheduler.createUnitsView({
				name:"weekunit",
				property:"section_id",
				list:sections,
				days:7
			});

			// Неделю начинать с ПН или с текущей даты.
			if (startCalendarFromMonday === true) {
				scheduler.date.weekunit_start = function(date){
					let shift = date.getDay();
					if (shift === 0) { shift = 6; }
					else { shift--; }
					return this.date_part(this.add(date,-1*shift,"day"));
				};
			} else {
				scheduler.date.weekunit_start = function(date) {
					return this.date_part(this.add(date, 0, 'day'));
				};
			}
			scheduler.date.get_weekunit_end = function(start_date) {
				return scheduler.date.add(start_date, 14, "day");
			};
			scheduler.date.add_weekunit = function(date, inc){
				return scheduler.date.add(date, inc*7, "day");
			};

			// Context menu
			scheduler.attachEvent("onContextMenu", function (id, e){
				sch.scheduler.dhtmlXTooltip.hide();
				sch.bufferId = id;
				// Позиционирование
				let x = e.pageX;
				let y = e.pageY;
				if (($$('add-context-menu').$width + x) > window.innerWidth) {
					x = window.innerWidth - $$('add-context-menu').$width - 30;
				}
				if (($$('add-context-menu').$height + y) > window.innerHeight) {
					y = window.innerHeight - $$('add-context-menu').$height - 30;
				}

				sch.action_data = scheduler.getActionData(e);
				sch.bufferEvent = e;
				if (id === null) {
					$$('add-context-menu').show();
					$$('add-context-menu').setPosition(x-15, y-15);
				} else {
					let tmpEvent = sch.scheduler.getEvent(id);
					if (tmpEvent.type === 'buffer' || tmpEvent.type === 'maintenance') {
						$$('delete-context-menu').show();
						$$('delete-context-menu').setPosition(x-15, y-15);
					} else {
						$$('edit-context-menu').show();
						$$('edit-context-menu').setPosition(x-15, y-15);
					}
				}
				return false;
			});

			scheduler.createUnitsView({
				name:"single_unit",
				property:"section_id",
				list:sections
			});

			// Шапка boing либо airbus
			scheduler.templates.weekunit_scale_text = function(key, label, unit) {
				let cls = (key === 1)? 'boing-label' : 'airbus-label';
				return "<div class='" + cls + "'>" + label + "</div>";
			};

			// Формируем шаблон для Tooltip события
			setShowTooltipTemplate();

			// Event body text события
			scheduler.templates.event_text = function(start, end, event) {
				let txt = '';
				if (event.type === 'buffer' || event.type === 'maintenance') {
					txt = '<span>' + sch.formatHi(event.start_date) + '-' + sch.formatHi(event.end_date) + '</span>';
					txt += '<span style="color:red;font-size:10px;">&nbsp;(' + sch.overlap.getShortHumanTime(event.duration) + ')</span>';
					txt += '<br><span>' + event.text + '</span>';
				} else {
					let durationColor = (event.status === 'technical' || event.status === 'refund'  || event.status === 'fail' || event.status === 'majeure')?'#000':'red';
					txt = '<span>' + scheduler.templates.event_date(start) + ' - ' + scheduler.templates.event_date(end) + '</span>';
					txt += '<span style="color:' + durationColor + ';font-size:10px;">&nbsp;(' + sch.overlap.getShortHumanTime(event.duration) + ')</span><br>';
					if (event.fio !== null) {
						txt += '<span>' + event.fio + '</span><br>';
					}
					if (event.phone !== null) {
						txt += '<span>' + sch.formatPhone(event.phone) + '</span>';
					}
				}
				return txt;
			};

			// Стили для событий
			scheduler.templates.event_class = function(start, end, ev){
				if (ev.type === 'buffer') {
					return ' buffer-event ';
				} else if (ev.type === 'maintenance') {
					return ' maintenance-event ';
				}
				let css = '';
				let event_data = null;
				if (ev.event_data !== undefined && ev.event_data !== null) {
					event_data = JSON.parse(ev.event_data);
				}
				switch (ev.status) {
					case 'complete':
						if (ev.section_id === 1) {
							css = ' boing-complete-event ';
						} else {
							css = ' airbus-complete-event ';
						}
						break;
					case 'fail':
						css = ' fail-event ';
						break;
					case 'majeure':
						css = ' majeure-event ';
						break;
					case 'technical':
						css = ' technical-event ';
						break;
					case 'refund':
						css = ' refund-event ';
						break;
					default:
						if (ev.section_id === 1) {
							css = ' boing-event ';
						} else if (ev.section_id === 2) {
							css = ' airbus-event ';
						}
						if (ev.voucher === null || ev.voucher === undefined) {
							css += ' event-opacity-50 ';
						}
						if (ev.status === 'technical_rebooking') {
							css += ' technical_rebooking ';
						}
						if (ev.vip === true) {
							css += ' vip_event ';
						}
						if (event_data !== undefined && event_data !== null && event_data.online_booking === 1) {
							css += ' online-booking ';
						}
						if (parseInt(ev.surcharge) > 0) {
							css += ' surcharge ';
						}
						if (ev.type === 'school') {
							css += ' school-pilot ';
						}
				}
				return css;
			};

			// Текст для Header события
			scheduler.templates.event_header = function(start, end, ev){
				let txt = "<span>";
				if (ev.type === 'buffer') {
					txt += "<span>Buffer</span>";
				} else if (ev.type === 'maintenance') {
					txt += "<span>Service</span>";
				} else if (ev.voucher === null || ev.voucher === undefined) {
					txt += "<span style='color:#e11812;font-weight: 300;'>No Cert.</span>";
				} else {
					// txt += '<span>' + ev.pin + "-" + ev.voucher + '</span>';
					txt += '<span>' + ev.voucher + '</span>';
				}
				if (ev.vip === true) {
					txt += "<i class='fa fa-star color-gold'></i>";
				}
				// Проверяем, нужно ли установить значек ДОКУМЕНТ на плашке бронирования
				if (sch.isHaveComment(ev)) {
					txt += "&nbsp;<i class='fa fa-file color-brown'></i>";
				}
				// Проверка если ли условия полета
				if (sch.isHaveFlyConditions(ev)) {
					txt += "&nbsp;<i class='fa fa-plane color-black'></i>";
				}
				// Проверка есть ли дополнительные условия
				if (sch.isHaveAdditionalConditions(ev)) {
					txt += "&nbsp;<i class='fa fa-plus color-black'></i>";
				}
				// Обображаем статус бронрования
				if (ev.type !== 'buffer' && ev.type !== 'maintenance') {
					switch (ev.status) {
						case 'new':
							break;
						case 'technical_rebooking':
						case 'rebooking':
							txt += "&nbsp;<i class='fa fa-arrow-right color-blue'></i>";
							break;
						case 'complete':
							break;
						case 'fail':
							txt += "&nbsp;<i class='fa fa-frown-o color-black'></i>";
							break;
						case 'refund':
							txt += "&nbsp;<i class='fa fa-dollar color-black'></i>";
							break;
						case 'majeure':
							txt += "&nbsp;<i class='fa fa-heartbeat color-green'></i>";
							break;
						case 'technical':
							txt += "&nbsp;<i class='fa fa-cog color-green'></i>";
							break;
						default:
							txt += "&nbsp;<i class='fa fa-question color-red'></i>";
					}
				}
				txt += "</span>";
				return txt;
			};

			// Шаблон для отображения дня недели в сетке календаря
			scheduler.templates.week_scale_date = function(date) {
				let id = scheduler.date.date_to_str('%Y-%m-%d')(date);
				//Установить текущий день зеленым цветом
				let dateColor = '';
				if (id === scheduler.date.date_to_str('%Y-%m-%d')(new Date())) {
					dateColor = 'current-day';
				} else { // Установить выходные дни красным цветом
					let shift = date.getDay();
					if (shift === 6 || shift === 0) {
						dateColor = 'holiday';
					}
				}
				// Определение цвета
				let colorStaff = sch.isInLoadStaffUsers(id)? ' color-green ' : ' color-gray ';
				let colorReminder = sch.isInLoadReminders(id)? ' color-red ' : ' color-gray ';

				return '<i id="staff-users-icon-block-' + id + '" class="fa fa-user font-sz-15 ' + colorStaff + ' staff-icon-place" onclick="sch.showStaffContent(\'' + date + '\')"></i>' + // Место для списка сотрудников
					   '<div class="top-day-date-place ' + dateColor + '">' + sch.formatDjM(date) + '</div>' + // Место для даты
					   '<i id="staff-notice-icon-block-' + id + '" class="fa fa-exclamation-triangle font-sz-15 ' + colorReminder + ' notice-icon-place" onclick="sch.showNoticeContent(\'' + date + '\')"></i>'; // Место для списка напоминаний
			};

			scheduler.attachEvent("onXLE", function (){
				sch.startLoadStaffReminder(scheduler._date);
				sch.setColorsOfStaffReminder();
			});

			scheduler.attachEvent("onDblClick", function (id, e) {
				sch.current.event = sch.scheduler.getEvent(id);
				if (sch.current.event.type === 'buffer' || sch.current.event.type === 'maintenance') {
					return false;
				}
				sch.scheduler.showLightbox(id, sch.windows.optionsEvent.id, true);
				return false;
			});

			scheduler.config.lightbox.sections = [
				{ name:"description", height:450, type:"textarea", map_to:"text", focus:true},
				{ name:"location",    height:43, type:"textarea", map_to:"event_location"},
				{ name:"time",        height:72, type:"time",     map_to:"auto"}
			];

			let html = function(id) { return document.getElementById(id); }; //just a helper

			scheduler.showLightbox = function(id, win_id = sch.windows.certEvent.id, edit = false) {
				let ev = scheduler.getEvent(id);
				let simName = '';
				if (ev.section_id === 1) {
					simName = 'B737';
					webix.html.removeCss($$("toolbar-" + win_id).getNode(), "airbus-background");
					$$("toolbar-" + win_id).define("css", "boeing-background");
				} else {
					simName = 'A320';
					webix.html.removeCss($$("toolbar-" + win_id).getNode(), "boeing-background");
					$$("toolbar-" + win_id).define("css", "airbus-background");
				}
				// Если создание нового события
				let date_options = { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false };
				if (edit === false) {
					$$("toolbar-simulator-" + win_id).setValue(simName);
					// Конфигурируем минуты
					let date = new Date(ev.start_date);
					if (date.getMinutes() < 30) {
						date.setMinutes(0, 0, 0);
					} else {
						date.setMinutes(30, 0, 0);
					}
					let txt = date.toLocaleString('en-US', date_options);
					txt = sch.weekday[date.getDay()] + ', ' + txt;
					$$("toolbar-time-" + win_id).setValue(txt);
					//to set new end date
					ev.start_date = date;
					ev.end_date = new Date(date.getTime() + (30 * 60 * 1000));
					//to update visible event box
					scheduler.updateEvent(id);
					sch.current.event = ev;
				} else { // Если рдактирование, например перенос
					$$("toolbar-simulator-" + win_id).setValue('ID: ' + ev.eid + ', ' + simName);
					let date = new Date(ev.start_date);
					let txt = date.toLocaleString('en-US', date_options);
					txt = txt.replace(/.,/, '');
					txt = sch.weekday[date.getDay()] + ', ' + txt;
					$$("toolbar-time-" + win_id).setValue(txt);
				}
				// Show
				scheduler.startLightbox(id, html(win_id));
				$$("window-" + win_id).show();
			};

			initCloseCancelButtons(sch.windows.certEvent.id);
			initCloseCancelButtons(sch.windows.noneCertEvent.id);
			initCloseCancelButtons(sch.windows.service.id);
			initCloseCancelButtons(sch.windows.optionsEvent.id);

			if (this.config.init) {
				this.config.init.call(this);
			}

			scheduler.init(this.$view.firstChild, (this.config.date||new Date()), (this.config.mode||"week"));
			if (this.config.ready) {
				this.config.ready.call(this);
			}

			this._waitScheduler.resolve(scheduler);

		}, this);
	}
}, webix.EventSystem, webix.ui.view);
