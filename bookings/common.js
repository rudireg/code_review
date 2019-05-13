"use strict";

const sch = {};
sch.arrDate = [];
sch.current = {};
sch.overlap = {};
sch.windows = {};
sch.actions = {};
sch.thesaurus = {};
sch.staffs = [];
sch.notices = [];
sch.staffUsers = {};
sch.staffUsers.items = [];
sch.reminders = {};
sch.reminders.items = [];
sch.windows.certEvent = {};
sch.windows.noneCertEvent = {};
sch.windows.certEvent.id = 'certEvent';
sch.windows.noneCertEvent.id = 'noneCertEvent';
sch.windows.optionsEvent = {};
sch.windows.optionsEvent.id = 'optionsEvent';
sch.windows.reminder = {};
sch.windows.reminder.id = 'reminder';
sch.windows.add_reminder = {};
sch.windows.add_reminder.id = 'add_reminder';
sch.windows.customer_search = {};
sch.windows.customer_search.id = 'customer_search';
sch.windows.buffer = {};
sch.windows.buffer.id = 'buffer';
sch.windows.service = {};
sch.windows.service.id = 'service';
sch.windows.moving = {};
sch.windows.moving.id = 'moving';
sch.windows.editor = {};
sch.windows.editor.id = 'editor';
sch.windows.cancel = {};
sch.windows.cancel.id = 'cancel';
sch.windows.complete = {};
sch.windows.complete.id = 'complete';
sch.windows.refund = {};
sch.windows.refund.id = 'refund';
sch.windows.attach_voucher = {};
sch.windows.attach_voucher.id = 'attach_voucher';
sch.windows.increase_duration = {};
sch.windows.increase_duration.id = 'increase_duration';

/**
 * Settings
 */
sch.settings = {};
// TODO - нужны настройки календаря для PWA (в локалсторадже)
sch.settings.calendar_start_time = 9; // global.App.calendarStartTime;
sch.settings.calendar_end_time   = 23; // global.App.calendarEndTime;

/**
 * Формат даты
 */
sch.formatYmd = webix.Date.dateToStr("%Y-%m-%d");
sch.formatdmY = webix.Date.dateToStr("%d-%m-%Y");
sch.formatYmdHi = webix.Date.dateToStr("%Y-%m-%d %H:%i");
sch.formatdmYHi = webix.Date.dateToStr("%d-%m-%Y %H:%i");
sch.formatYmdHis = webix.Date.dateToStr("%Y-%m-%d %H:%i:%s");
sch.formatHis = webix.Date.dateToStr("%H:%i:%s");
sch.formatHi = webix.Date.dateToStr("%H:%i");
sch.formatDjM = webix.Date.dateToStr("%D, %j %M");
sch.formatjM = webix.Date.dateToStr("%j %M"); // 20 Мар
sch.formatjF = webix.Date.dateToStr("%j %F"); // 20 Март
sch.formatjMY = webix.Date.dateToStr("%j %M %Y"); // 20 Мар 2018
sch.formatjMYHi = webix.Date.dateToStr("%j %M %Y %H:%i"); // 20 Мар 2018 12:30
sch.formatjMyHi = webix.Date.dateToStr("%j %M '%y %H:%i"); // 20 Мар '18 12:30

// Week days
sch.weekday = new Array(7);
sch.weekday[0] = "Sunday";
sch.weekday[1] = "Monday";
sch.weekday[2] = "Tuesday";
sch.weekday[3] = "Wednesday";
sch.weekday[4] = "Thursday";
sch.weekday[5] = "Friday";
sch.weekday[6] = "Saturday";

/**
 * Шаг минут
 * @type {number}
 */
sch.overlap.minuteStep = 30;

/**
 * Подчищаем мусор
 */
sch.clearGarbage = function () {
	sch.excludeDate = null;
	sch.isDragMode = false;
	sch.bufferId = null;
	delete sch.draggedEvent;
};

/**
 * Получить кол-во миллисекунд из формата: '00:30:00'
 * @param time - формат '00:30:00'
 * @returns {number}
 */
sch.overlap.getTime = function (time) {
	let tmp = new Date('Thu, 01 Jan 1970 ' + time + ' GMT');
	return tmp.getTime();
};

/**
 * Преобразовать кол-во миллисекунд из формата: '01:30:00' в формат: 1 час 30 минут
 * @param time - формат '00:30:00'
 * @returns {string}
 */
sch.overlap.getHumanTime = function (time) {
	let getHourName = function (hour) {
		if (hour === 1) {return 'hour';}
		if (hour >=2 && hour <= 4) {return 'hours';}
		if (hour >=5) {return 'hours';}
		return ' ';
	};
	let seconds = sch.overlap.getTime(time) / 1000;
	let minutes = seconds / 60;
	let hours = parseInt(minutes / 60);
	let txt = minutes + ' minutes';
	if (hours > 0) {
		minutes = minutes - (hours * 60);
		txt = hours + ' ' + getHourName(hours) + ((minutes)? ' ' + minutes + ' minutes' : '');
	}
	return txt;
};

/**
 * Преобразовать кол-во миллисекунд из формата: '01:30:00' в формат: 1 h 30 m
 * @param time
 * @returns {string}
 */
sch.overlap.getShortHumanTime = function (time) {
	let getHourName = function (hour) {
		if (hour === 1) {return 'h';}
		if (hour >=2 && hour <= 4) {return 'h';}
		if (hour >=5) {return 'h';}
		return ' ';
	};
	let seconds = sch.overlap.getTime(time) / 1000;
	let minutes = seconds / 60;
	let hours = parseInt(minutes / 60);
	let txt = minutes + 'm';
	if (hours > 0) {
		minutes = minutes - (hours * 60);
		txt = hours + '' + getHourName(hours) + ((minutes)? ' ' + minutes + 'm' : '');
	}
	return txt;
};

/**
 * TODO: Сделать загрузку из БД. На данный момент, в коде есть места, где идет проверка по точному текстовому значению.
 * Список симуляторов
 */
sch.simulators = {
	'1':'B737',
	'2':'A320',
	'3':'fix',
	'4':'A320 & B737'
};

/**
 * Получить имя симулятора по его номеру ID
 * @param id
 * @returns {*}
 */
sch.getSimulatorNameById = function (id) {
	return sch.simulators[id];
};

/**
 * Проверка, существует ли в массиве объектов ключ с определенным значением
 * @param array - Массив для провеки
 * @param key - Ключ в массиве
 * @param val - Значение ключа
 * @returns {boolean}
 */
sch.isExistsPropertyInArray = function (array, key, val) {
	for (let i=0; i<array.length; ++i) {
		if (array[i][key] === val) {
			return true;
		}
	}
	return false;
};

/**
 * Получить объект из массива, при условии что объект имеет указанный ключ равный указаному значению
 * @param array Массив для провеки
 * @param key Ключ в массиве
 * @param val Значение ключа
 * @returns {*}
 */
sch.getDataIfExistsPropertyInArray = function (array, key, val) {
	val = parseInt(val);
	for (let i=0; i<array.length; ++i) {
		if (array[i][key] === val) {
			return array[i];
		}
	}
	return null;
};

/**
 * Преобразовать кол-во минут в формат 00:00
 * @param minutes
 * @returns {string}
 */
sch.overlap.minutesToHi = function (minutes) {
	let txt = '';
	if (minutes < 10) {
		txt = '00:0' + minutes;
	} else {
		txt = '00:' + minutes;
	}
	let hours = parseInt(minutes / 60);
	if (hours > 0) {
		minutes = minutes - (hours * 60);
		if (hours < 10) {hours = '0' + hours;}
		if (minutes < 10) {minutes = '0' + minutes;}
		txt = hours + ':' + minutes;
	}
	return txt;
};

/**
 * Сохранить (клонировать) событие - для запоминания его данных
 * @param event
 */
sch.saveEvent = function (event) {
	sch.saveEventValues = {};
	sch.saveEventValues.add_fio = event.add_fio;
	sch.saveEventValues.add_phone = event.add_phone;
	sch.saveEventValues.duration = event.duration;
	sch.saveEventValues.eid = event.eid;
	sch.saveEventValues.end_date = event.end_date;
	sch.saveEventValues.fio = event.fio;
	sch.saveEventValues.id = event.id;
	sch.saveEventValues.phone = event.phone;
	sch.saveEventValues.pin = event.pin;
	sch.saveEventValues.section_id = event.section_id;
	sch.saveEventValues.start_date = event.start_date;
	sch.saveEventValues.text = event.text;
	sch.saveEventValues.type = event.type;
	sch.saveEventValues.voucher = event.voucher;
	sch.saveEventValues.status = event.status;
};

/**
 * Проверка overlap
 * @param date
 * @returns {*}
 */
sch.overlap.check = function (date) {
	for (let i =0; i < sch.overlap.data.length; ++i) {
		// Если начало полета больше или равно существующему И если начало полета меньше
		if (date.start >= sch.overlap.data[i].start && date.start < sch.overlap.data[i].end) {
			return (date.start.getTime() / 1000); // Если занято
		}
		if (date.end > sch.overlap.data[i].start && date.end <= sch.overlap.data[i].end) {
			return (date.start.getTime() / 1000); // Если занято
		}
		if (sch.overlap.data[i].start >= date.start && sch.overlap.data[i].end <= date.end) {
			return (date.start.getTime() / 1000); // Если занято
		}
	}
	return null; // Возвращается если свободно место
};

/**
 * Заблокировать не досупное время в календаре
 * @param formId - Добавочная к formId элементам формы.
 * @param date
 * @param exclude - date Исключить из впроверки
 */
sch.lockBusyHours = function (formId, date, exclude = null) {
	if (exclude === undefined) {exclude = null;}
	let timeValue = new Date(date);
	timeValue.setHours(sch.settings.calendar_start_time, 0, 0, 0);
	$$("new-date-" + formId).setValue(date);
	$$("datepicker-start-time-" + formId).disable();
	let sim = $$('simulator-id-' + formId).getValue();
	webix.ajax().sync().post('/RPC/takeoff/Booking/Timeslots/getBusySlots', {'date':date, 'simulator': sim}, function (res) {
		res = JSON.parse(res);
		if (exclude !== null) {
			for (let i=0; i<res.length; ++i) {
				if (res[i].id === parseInt(exclude)) {
					res.splice(i, 1);
					break;
				}
			}
		}
		sch.busyTime = sch.overlap.getBusyTime(res, sch.overlap.minuteStep, sch.tmpEvent.duration);
		if (sch.overlap.freeTime !== null) {
			timeValue.setHours(sch.overlap.freeTime.hours, sch.overlap.freeTime.minutes, 0, 0);
		}
		$$("datepicker-start-time-" + formId).setValue(timeValue);
		$$("datepicker-start-time-" + formId).enable();
	});
};

/**
 * Получить занятые временные фрагменты календаря (минуты)
 * @param list - Список занятых словтов
 * @param step - Шаг проверки времени
 * @param duration - Длительность предпологаемой вставки
 * @returns {Array}
 */
sch.overlap.getBusyTime = function (list, step = 30, duration = '00:30:00') {
	sch.overlap.freeTime = null;
	if (list.length < 1) {
		sch.overlap.freeTime = {hours: sch.settings.calendar_start_time, minutes: 0};
		return [];
	}
	sch.overlap.initBusy(list);

	let cur = new Date((list[0]).start);
	cur.setHours(sch.settings.calendar_start_time, 0, 0, 0);
	let endList = new Date((list[0]).start);
	endList.setHours(sch.settings.calendar_end_time, 0, 0, 0);

	let tmp = [];
	let res = null;
	while (cur.getTime() <= endList.getTime()) {
		res = sch.overlap.check({
			start: cur,
			end: new Date(cur.getTime() + sch.overlap.getTime(duration))
		});
		if (res !== null) {
			tmp.push(res);
		} else if (sch.overlap.freeTime === null && cur.getHours() >= sch.settings.calendar_start_time) {
			sch.overlap.freeTime = {
				hours: cur.getHours(),
				minutes: cur.getMinutes()
			};
		}
		cur = new Date(cur.getTime() + (step * 60 * 1000));
	}

	if (sch.overlap.freeTime === null) {
		sch.overlap.freeTime = {hours: sch.settings.calendar_start_time, minutes: 0};
	}

	return tmp;
};


/**
 * Инициализация overlap
 * @param list
 */
sch.overlap.initBusy = function (list) {
	sch.overlap.data = [];
	let start;
	let end;
	list.forEach(function (item, i, arr) {
		start = new Date(item.start);
		end   = new Date(start.getTime() + sch.overlap.getTime(item.duration));
		sch.overlap.data.push({
			id: item.id,
			start: start,
			end: end
		});
	});
};

/**
 * Проверяем имеет ли событие комментрии - для отображения значка ДОКУМЕНТ в плашке бронирования
 * @param ev - событие
 * @returns {boolean}
 */
sch.isHaveComment = function (ev) {
	if (ev.text.length > 0) {
		return true;
	}
	if (ev.event_data !== undefined && ev.event_data !== null) {
		let evd = JSON.parse(ev.event_data);
		if (evd.nonresident !== undefined && evd.nonresident === 1) {
			return true;
		}
	}
	return false;
};

/**
 * Проверка есть ли условия полета
 * @param ev
 * @returns {boolean}
 */
sch.isHaveFlyConditions = function (ev) {
	if (ev.event_data !== undefined && ev.event_data !== null) {
		let evd = JSON.parse(ev.event_data);
		if (
			evd.need_pilot !== undefined && evd.need_pilot.length > 0 ||
			evd.dont_need_pilot !== undefined && evd.dont_need_pilot.length > 0 ||
			evd.need_airport !== undefined && evd.need_airport.length > 0 ||
			evd.change_people !== undefined && evd.change_people === 1 ||
			evd.start_plane !== undefined && evd.start_plane === 1 ||
			evd.client_aerofob !== undefined && evd.client_aerofob === 1 ||
			evd.short_instruction !== undefined && evd.short_instruction === 1 ||
			evd.need_checklist !== undefined && evd.need_checklist === 1 ||
			evd.experienced_pilot !== undefined && evd.experienced_pilot === 1 ||
			evd.need_schema !== undefined && evd.need_schema === 1 ||
			evd.light_fly !== undefined && evd.light_fly === 1 ||
			evd.speak_english !== undefined && evd.speak_english === 1 ||
			evd.client_drive !== undefined && evd.client_drive === 1
		) {
			return true;
		}
	}
	return false;
};

/**
 * Проверка есть ли дополнительные условия
 * @param ev
 * @returns {boolean}
 */
sch.isHaveAdditionalConditions = function (ev) {
	if (ev.event_data !== undefined && ev.event_data !== null) {
		let evd = JSON.parse(ev.event_data);
		if (
			evd.only_check !== undefined && evd.only_check === 1 ||
			evd.card_print !== undefined && evd.card_print === 1 ||
			evd.more_pay !== undefined && evd.more_pay === 1 ||
			evd.recall !== undefined && evd.recall === 1
		) {
			return true;
		}
	}
	return false;
};

/**
 * Обновить внешнее представление бронирования
 * @param event - Событие
 * @param values - Данные события
 * @param service - Сервисные данные события (pin, voucher etc.)
 */
sch.updateEventData = function (event = null, values = null, service = null) {
	if (event === null) {return;}
	// Сервисные данные
	if (service !== null) {
		let serviceFields = ['eid', 'pin', 'voucher'];
		serviceFields.forEach(function (field) {
			if (service[field] !== undefined && service[field] !== null) {
				sch.scheduler.getEvent(event.id)[field] = service[field];
			}
		});
		if (service.duration !== undefined && service.duration !== null && service.duration.time !== undefined) {
			sch.scheduler.getEvent(event.id).duration = sch.overlap.minutesToHi(service.duration.time);
		}
	}
	// Сопровождающие данные
	if (values !== null) {
		let dateFields = ['start_date', 'end_date'];
		dateFields.forEach(function (field) {
			if (values[field] !== undefined && values[field] !== null) {
				sch.scheduler.getEvent(event.id)[field] = new Date(values[field]);
			}
		});
		let fields = ['status', 'section_id', 'duration', 'text', 'vip_comment', 'type', 'fio', 'phone', 'comment', 'add_fio', 'add_phone', 'surcharge'];
		fields.forEach(function (field) {
			if (values[field] !== undefined && values[field] !== null) {
				sch.scheduler.getEvent(event.id)[field] = values[field];
			}
		});
		// vip
		if (values['vip'] !== undefined && values['vip'] !== null) {
			sch.scheduler.getEvent(event.id)['vip'] = !!values['vip'];
		}
		if (values.duration !== undefined && values.duration !== null && values.duration > 0) {
			sch.scheduler.getEvent(event.id).end_date = new Date(event.start_date.getTime() + (values.duration * 60 * 1000));
			sch.scheduler.getEvent(event.id).duration = sch.overlap.minutesToHi(values.duration);
		}
		// Event JSON DATA
		let ed = {};
		if (event.event_data !== undefined && event.event_data !== null && typeof event.event_data !== "object") {
			ed = JSON.parse(event.event_data);
		}
		let jsonFields = ['need_pilot', 'dont_need_pilot', 'need_airport', 'card_print', 'change_people', 'client_aerofob', 'client_drive',
						  'light_fly', 'more_pay', 'need_checklist', 'need_schema', 'nonresident', 'only_check', 'recall', 'short_instruction',
						  'speak_english', 'start_plane', 'experienced_pilot'];
		jsonFields.forEach(function (field) {
			if (values[field] !== undefined && values[field] !== null) {
				ed[field] = values[field];
			}
		});
		sch.scheduler.getEvent(event.id).event_data = JSON.stringify(ed);
	}
	// Update event
	sch.scheduler.updateEvent(event.id);
};

/**
 * Загружаем словарь thesaurus из БД
 */
sch.thesaurus.load = function () {
	webix.ajax().sync().post('/RPC/takeoff/Thesaurus/Store/Select', {}, function (res) {
		sch.thesaurus = JSON.parse(res);
	});
};

/**
 * Список сотрудников
 */
sch.loadStaffUsers = function (fromDate = new Date(), count = 7) {
	let toDate = new Date(fromDate.getTime() + (3600 * 24 * (count-1) * 1000));
	webix.ajax().sync().post('/RPC/takeoff/Staff/Store/getStaffByPeriodDate', {'from':fromDate, 'to':toDate}, function (res) {
		res = JSON.parse(res);
		if (res.length < 1) {
			return true;
		}
		let ymd;
		for (let i=0; i<res.length; ++i) {
			ymd = sch.formatYmd(new Date(res[i].worktime));
			if (sch.staffUsers.items[ymd] === undefined) {
				sch.staffUsers.items[ymd] = [];
				sch.staffUsers.items.length ++;
			}
			sch.staffUsers.items[ymd].push(res[i]);
		}
	});
};

/**
 * Получаем список уведомлений (из таблицы bookings_reminders)
 */
sch.loadReminders = function (fromDate = new Date(), count = 7) {
	webix.ajax().sync().post('/RPC/takeoff/Booking/Reminder/Select', {'date':fromDate, 'count':count}, function (res) {
		res = JSON.parse(res);
		if (res.length < 1) {
			return true;
		}
		for (let i=0; i<res.length; ++i) {
			// Заменяем null на ""
			res[i].booking  = res[i].booking || '';
			res[i].voucher  = res[i].voucher || '';
			res[i].admin_duration = (res[i].admin_duration)? sch.overlap.getHumanTime(res[i].admin_duration) : '';
			res[i].duration = res[i].duration || '';
			res[i].humanDuration = (res[i].duration)? sch.overlap.getHumanTime(res[i].duration) : '';
			res[i].status   = res[i].status || '';
			res[i].fio      = res[i].fio || '';
			res[i].phone    = res[i].phone || '';
			res[i].email    = res[i].email || '';
			res[i].comment  = res[i].comment || '';
			switch(res[i].simulator) {
				case 1:
					res[i].shot_simulator_name = '<b style="color:#01579B;">B</b>';
					break;
				case 2:
					res[i].shot_simulator_name = '<b style="color:#0cb42e;">A</b>';
					break;
				case 4:
					res[i].shot_simulator_name = '<b><span style="color:#0cb42e;">A</span>&<span style="color:#01579B;">B</span></b>';
			}

			let index = res[i].start;
			if (sch.reminders.items[index] === undefined) {
				sch.reminders.items[index] = [];
				sch.reminders.items.length ++;
			}
			sch.reminders.items[index].push(res[i]);
		}
	});
};

/**
 * Проверить наличие работников
 * @param date - Дата в формате 2018-06-11
 * @returns {boolean}
 */
sch.isInLoadStaffUsers = function (date) {
	return sch.staffUsers.items[date] !== undefined;
};

/**
 * Проверить наличие напоминания
 * @param date - Дата в формате 2018-06-11
 * @returns {boolean}
 */
sch.isInLoadReminders = function (date) {
	return sch.reminders.items[date] !== undefined;
};

/**
 * Получить данные по работникам и напоминаниям
 * @param startDate Дата начала
 */
sch.startLoadStaffReminder = function (startDate) {
	sch.loadReminders(startDate ,7);  // Загружаем напоминания
	sch.loadStaffUsers(startDate ,7); // Загружаем работников
	// Создаем НОВЫЙ массив дат
	sch.arrDate = [];
	for (let i=0; i<7; i++) {
		let date = new Date(startDate.getTime() + 3600 * 24 * 1000 * i);
		let id = sch.formatYmd(date);
		sch.arrDate.push(id);
	}
};

/**
 * Расскрасить цвета напоминаний
 */
sch.setColorsOfStaffReminder = function () {
	sch.arrDate.forEach(function (date) {
		// Staff
		if (sch.isInLoadStaffUsers(date)) {
			document.querySelector("#staff-users-icon-block-" + date).classList.remove("color-gray");
			document.querySelector("#staff-users-icon-block-" + date).classList.add("color-green");
		} else {
			document.querySelector("#staff-users-icon-block-" + date).classList.remove("color-green");
			document.querySelector("#staff-users-icon-block-" + date).classList.add("color-gray");
		}
		// Reminder
		if (sch.isInLoadReminders(date)) {
			document.querySelector("#staff-notice-icon-block-" + date).classList.remove("color-gray");
			document.querySelector("#staff-notice-icon-block-" + date).classList.add("color-red");
		} else {
			document.querySelector("#staff-notice-icon-block-" + date).classList.remove("color-red");
			document.querySelector("#staff-notice-icon-block-" + date).classList.add("color-gray");
		}
	});
};

/**
 * Установка цвета симулятора
 * @param type null|string  Допустивые значения: (boing|airbus|airbus-boing|static)
 */
sch.setSimulatorColor = function (type = null) {
	webix.html.removeCss($$("db_simulator").getNode(), "boing-color");
	webix.html.removeCss($$("db_simulator").getNode(), "airbus-color");
	webix.html.removeCss($$("db_simulator").getNode(), "airbus-boing-color");
	webix.html.removeCss($$("db_simulator").getNode(), "static-color");
	if (type !== null) {
		$$("db_simulator").define("css", type + "-color");
	}
};

/**
 * Установка цвета статуса
 * @param nodeId - ID обекта для которого устанавливается цвет.
 * @param color - цвет Допустивые значения:(red|yellow|green).
 */
sch.setStatusColor = function (nodeId, color = null) {
	webix.html.removeCss($$(nodeId).getNode(), "status-color-red");
	webix.html.removeCss($$(nodeId).getNode(), "status-color-yellow");
	webix.html.removeCss($$(nodeId).getNode(), "status-color-green");
	if (color !== null) {
		$$(nodeId).define("css", "status-color-" + color);
	}
};

sch.showStaffContent = function (date) {
	$$('staff-users-popup-date').setValue(date);
	$$('staff-users-popup').show();
};

sch.showNoticeContent = function (date) {
	sch.windows.reminder.currDate = sch.formatYmd(new Date(date));
	//$$('reminder-date-' + sch.windows.reminder.id).setValue(date);
	$$("window-" + sch.windows.reminder.id).show();
};

/**
 * Форма информирования об ошибке
 * @param text - текст сообщения
 * @param title - Заголовок
 */
sch.msgForm = function (text, title = 'Info') {
	webix.alert({
		title: title,
		ok:"OK",
		text: text
	});
};

/**
 * Форматирование телефона
 * @param phone
 * @returns {*}
 */
sch.formatPhone = function (phone) {
	if (phone === undefined || phone === null || phone.length < 1) {return '';}
	let match = phone.match(/([0-9]{1})([0-9]{3})([0-9]{3})([0-9]{2})([0-9]{2})/);
	if (match) {
		return '+' + match[1] + ' (' + match[2] + ') ' + match[3] + '-' + match[4] + '-' + match[5];
	}
	return 	phone;
};

/**
 * Получить имя пилота по его ID
 * @param id
 * @returns {string}
 */
sch.getPilotNameById = function (id) {
	for (let i=0; i<sch.pilotList.length; ++i) {
		if (sch.pilotList[i].id === parseInt(id)) {
			return sch.pilotList[i].value;
		}
	}
	return '';
};

/**
 * Обновить форму содержащая напоминания за 1 день
 * @param date
 */
sch.updateReminderForm = function (date) {
	webix.ajax().sync().post('/RPC/takeoff/Booking/Reminder/Select', {'date':date, 'count':1}, function (res) {
		res = JSON.parse(res);
		$$('list-' + sch.windows.reminder.id).clearAll();
		$$("dataview-" + sch.windows.reminder.id).clearAll();
		if (sch.reminders.items[date] !== undefined) {
			delete sch.reminders.items[date];
			sch.reminders.items.length --;
		}
		if (res.length > 0) {
			sch.reminders.items[date] = [];
			sch.reminders.items.length ++;
			for (let i=0; i<res.length; ++i) {
				// Заменяем null на ""
				res[i].booking  = res[i].booking || '';
				res[i].voucher  = res[i].voucher || '';
				res[i].admin_duration = (res[i].admin_duration)? sch.overlap.getHumanTime(res[i].admin_duration) : '';
				res[i].duration = res[i].duration || '';
				res[i].humanDuration = (res[i].duration)? sch.overlap.getHumanTime(res[i].duration) : '';
				res[i].status   = res[i].status || '';
				res[i].fio      = res[i].fio || '';
				res[i].phone    = sch.formatPhone(res[i].phone) || '';
				res[i].email    = res[i].email || '';
				res[i].comment  = res[i].comment || '';
				switch(res[i].simulator) {
					case 1:
						res[i].shot_simulator_name = '<b style="color:#01579B;">B</b>';
						break;
					case 2:
						res[i].shot_simulator_name = '<b style="color:#0cb42e;">A</b>';
						break;
					case 4:
						res[i].shot_simulator_name = '<b><span style="color:#0cb42e;">A</span>&<span style="color:#01579B;">B</span></b>';
				}
				sch.reminders.items[date].push(res[i]);
			}
			$$('list-' + sch.windows.reminder.id).parse(JSON.stringify(sch.reminders.items[date]), 'json');
			$$('list-' + sch.windows.reminder.id).select(sch.reminders.items[date][0].id);
			// поменять цвет
			document.querySelector("#staff-notice-icon-block-" + date).classList.remove("color-gray");
			document.querySelector("#staff-notice-icon-block-" + date).classList.add("color-red");
		} else {
			delete sch.reminders.items[date];
			// поменять цвет
			document.querySelector("#staff-notice-icon-block-" + date).classList.remove("color-red");
			document.querySelector("#staff-notice-icon-block-" + date).classList.add("color-gray");
		}
	});
};

/**
 * Создаем массив иконок уведомлений (Позволяет: добавить|просмотреть уведомления)
 */
sch.getNotice = function (date) {
	let	css = (sch.reminders.items[date] !== undefined && sch.reminders.items[date].length > 0)? 'color-red' : 'color-gray';
	if (sch.notices[date] === undefined) {
		sch.notices[date] = webix.ui({
			view:'icon',
			id: 'staff-notice-icon-' + date,
			icon:'exclamation-triangle',
			container: 'staff-notice-icon-block-' + date,
			height: 30,
			width:30,
			css: css + ' top-icon-size',
			on:{
				onItemClick:function(id, e){
					sch.windows.reminder.currDate = id.replace('staff-notice-icon-', ''); // Получаем выбранную дату
					$$("window-" + sch.windows.reminder.id).show();
				}
			}
		});
		sch.notices.length ++;
	}
	return sch.notices[date];
};

/**
 * Удалить UI объекты из шапки календаря
 * При каждом перелистовании недели, объекты должны создаваться заново
 */
sch.destructNoticeObjects = function () {
	// Удаляем объекты Напоминаний
	if (sch.notices !== undefined) {
		for (let index in sch.notices) {
			sch.notices[index].destructor();
		}
		delete sch.notices;
	}
	sch.notices = [];

	// Удаляем объекты Сотрудников
	if (sch.staffs !== undefined) {
		for (let index in sch.staffs) {
			sch.staffs[index].destructor();
		}
		delete sch.staffs;
	}
	sch.staffs = [];
};

/**
 * Очистка формы бронирования полета по номеру сертификата
 */
sch.clearForm = function(formId) {
	$$('tabview-form').setValue('booking-tab-' + formId); // Set active first tab
	$$("duplicate-bookings-view").clearAll();
	$$("duplicate-bookings-count").setValue('');
	// First Tab
	$$('event-type-' + sch.windows.certEvent.id).setValue(19); // flight
	$$("voucher-" + formId).setValue('');
	$$("voucher-" + formId).focus();
	$$("fio").setValue('');
	$$("phone").setValue('');
	$$("comments").setValue('');
	$$("addition_fio_form").hide();
	$$("addition_fio").setValue('');
	$$("addition_phone").setValue('');
	$$("vip_customer").setValue(false);
	$$("speak_english-" + formId).setValue(false);
	$$("nonresident").setValue(false);
	$$("recall-" + formId).setValue(false);
	$$("db_id").setValue('Voucher code');
	$$("db_simulator").setValue('Simulator');
	sch.setSimulatorColor(); // Clear simulator colors
	$$("db_fio_copy").show();
	$$("db_phone_copy").show();
	$$("db_fio").setValue('Name');
	$$("db_phone").setValue('Phone');
	$$("db_comments").setValue('');
	$$("db-state-expire").setValue('');
	sch.setStatusColor('db-state-expire'); // Clear state colors
	$$("db-state-status").setValue('');
	$$("db-state-booking").setValue('');
	$$("db-state-pilot").setValue('');
	sch.setStatusColor('db-state-status'); // Clear state colors
	$$("db_state").define("icon","check-circle");
	$$("db_state").refresh();
	sch.setStatusColor('db_state'); // Clear state colors
	sch.setStatusColor('voucher-' + formId);
	$$("db_duration").setValue('Time');
	$$("vip_comment").setValue('');
	$$("vip_comment").hide();
	$$('is_addition_fio').setValue(0);
	// Second tab
	clearSecondTab(sch.windows.certEvent.id);
	// Third tab
	clearThirdTab(sch.windows.certEvent.id);
	// Buttons
	$$("create-button-" + sch.windows.certEvent.id).disable();
	$$("set-technical-rebooking-status-" + sch.windows.certEvent.id).setValue(0);
};

/**
 * Выборочная Очистка формы бронирования. Очистке подлежат лишь данные пришедшие с сервера.
 */
sch.clearServerFormData = function(formId) {
	$$("duplicate-bookings-view").clearAll();
	$$("duplicate-bookings-count").setValue('');
	// First Tab
	$$('event-type-' + sch.windows.certEvent.id).setValue(19); // flight
	$$("db_id").setValue('Voucher code');
	$$("db_simulator").setValue('Simulator');
	sch.setSimulatorColor(); // Clear simulator colors
	$$("db_fio_copy").show();
	$$("db_phone_copy").show();
	$$("db_fio").setValue('Name');
	$$("db_phone").setValue('Phone');
	$$("db_comments").setValue('');
	$$("db-state-expire").setValue('');
	sch.setStatusColor('db-state-expire'); // Clear state colors
	$$("db-state-status").setValue('');
	$$("db-state-booking").setValue('');
	$$("db-state-pilot").setValue('');
	sch.setStatusColor('db-state-status'); // Clear state colors
	$$("db_state").define("icon","check-circle");
	$$("db_state").refresh();
	sch.setStatusColor('db_state'); // Clear state colors
	sch.setStatusColor('voucher-' + formId);
	$$("db_duration").setValue('Time');
	// Buttons
	$$("create-button-" + sch.windows.certEvent.id).disable();
};

/**
 * Очистка диалогового окна свойств бронирования
 */
sch.clearOptionsDialog = function (dialogId) {
	webix.html.removeCss($$('vip-' + dialogId).getNode(), 'color-red');
	$$('vip-' + dialogId).define('css', 'color-gray');
	$$('yes-pilot-opt-' + dialogId).setValue('');
	$$('not-pilot-opt-' + dialogId).setValue('');
	$$('airport-opt-' + dialogId).setValue('');
	$$('list-options-' + dialogId).setValue('');
	$$('admin-comment-' + dialogId).setValue('');
	$$('transference-block-' + dialogId).hide();
};

/**
 * На входе массив с данными, на выходе строка вида: 1,2,3,4
 * @param data
 * @returns {Array}
 */
sch.convertOptList = function (data) {
	let res = [];
	let map = {};
	map.speak_english = 25;
	map.nonresident = 26;
	map.recall = 27;
	map.change_people = 28;
	map.start_plane = 29;
	map.client_aerofob = 30;
	map.short_instruction = 31;
	map.need_checklist = 32;
	map.client_drive = 33;
	map.need_schema = 34;
	map.light_fly = 35;
	map.experienced_pilot = 36;
	map.only_check = 37;
	map.card_print = 38;
	map.more_pay = 39;

	for (let index in data) {
		if (data.hasOwnProperty(index) && data[index] === 1) {
			if (map.hasOwnProperty(index)) {
				res.push(map[index]);
			}
		}
	}
	res = res.join(',');
	return res;
};

/**
 * Вернуть событие в исходное положение
 * @param id
 */
sch.resetEventPosition = function (id) {
	if (sch.saveEventValues !== undefined && sch.saveEventValues.start_date !== undefined) {
		sch.scheduler.getEvent(id).start_date = sch.saveEventValues.start_date;
		sch.scheduler.getEvent(id).end_date   = sch.saveEventValues.end_date;
		sch.scheduler.getEvent(id).section_id = sch.saveEventValues.section_id;
		sch.scheduler.updateEvent(id);
	}
	sch.saveEventValues = {};
	sch.draggedEvent = {};
};

/**
 * Подготовка к отображению диалоговго окна для переноса
 * @param id
 */
sch.showLightBoxForDrag = function (id) {
	sch.bufferId = id;
	sch.tmpEvent = sch.scheduler.getEvent(id);
	if (sch.tmpEvent === undefined) {
		webix.alert({text:"Error of opening the dialog box: sch.showLightBoxForDrag"});
		return false;
	}
	$$("new-date-" + sch.windows.moving.id).setValue(sch.draggedEvent.start_date);
	$$('simulator-id-' + sch.windows.moving.id).setValue(sch.draggedEvent.section_id);
	sch.scheduler.showLightbox(sch.bufferId, sch.windows.moving.id, true);
	sch.overlap.freeTime = null;
	sch.excludeDate = sch.saveEventValues.eid;
	sch.lockBusyHours(sch.windows.moving.id, sch.draggedEvent.start_date, sch.excludeDate);
	$$("datepicker-start-time-" + sch.windows.moving.id).setValue(sch.draggedEvent.start_date);
};

/**
 * Сокрытие всех контекстных меню
 */
sch.hideContextMenus = function () {
	$$('add-context-menu').hide();
	$$('edit-context-menu').hide();
	$$('delete-context-menu').hide();
};

