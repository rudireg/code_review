/**
 * Запуск Worker для обновления данных календаря
 */
if (!!window.Worker){
	let worker = new Worker('worker.js');
	worker.onmessage = function (e){
		let events = JSON.parse(e.data);
		if (events.length > 0) {
			for (let i=0; i<events.length; ++i) {
				updateSchedulerData(events[i]);
			}
		}
	};
	worker.onerror = function (e) {
		console.log('Worker error:');
		console.log(e.date);
	};
	worker.postMessage('update');
}

/**
 * Обновить данные в календаре
 * @param event
 */
function updateSchedulerData(event) {
		let isArchive = event.status === 'archive';
		let allEvents = sch.scheduler.getEvents();
		let ev = sch.getDataIfExistsPropertyInArray(allEvents, 'eid', event.eid);

		// Добавляем в календарь новое событе - Если такого события нет в клаендаре и событе не архивное
		if (ev === null && isArchive === false) {
			 event.start_date = sch.formatdmYHi(event.start_date);
			 event.end_date   = sch.formatdmYHi(event.end_date);
			 sch.scheduler.addEvent(event);
		} else if (isArchive === true) { // Если следует положить в архив
			let allEvents = sch.scheduler.getEvents();
			let tmp = sch.getDataIfExistsPropertyInArray(allEvents, 'eid', event.eid);
			if (tmp) {
				sch.scheduler.deleteEvent(tmp.id);
			}
		} else { // Обновить отображение бронирования в календаре
			let allEvents = sch.scheduler.getEvents();
			let tmp = sch.getDataIfExistsPropertyInArray(allEvents, 'eid', event.eid);
			if (tmp) {
				sch.updateEventData(tmp, event);
			}
		}
}
