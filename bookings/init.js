/**
 * Получаем список пилотов
 */
function initPilotList() {
	let result = webix.ajax().sync().post("/RPC/takeoff/Pilots/Store/getList");
	sch.pilotList = JSON.parse(result.responseText);
}

/**
 * Получаем список администраторов
 */
function initAdminList() {
	let result = webix.ajax().sync().post("/RPC/takeoff/Staff/Store/getList");
	sch.adminList = JSON.parse(result.responseText);
}

/**
 * Получаем список причин увеличения длительности бронирования (increase_reason)
 */
function initIncreaseReason() {
	let result = webix.ajax().sync().post("/RPC/takeoff/Thesaurus/Store/Read", {type:'increase_reason'});
	sch.increaseReasonList = JSON.parse(result.responseText);
	sch.increaseReasonDefault = sch.increaseReasonList[0]['id']; // Значение по умолчанию
}