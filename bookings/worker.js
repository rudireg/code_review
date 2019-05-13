onmessage = function(ev)
{
	importScripts("transport.js");
	let transport = new AJAXprovider();
	let reqDate = formatDate(new Date());
	let nextDate, args, xhr;
	setInterval(function() {
		nextDate = formatDate(new Date());
		args = 'time=' + reqDate;
		xhr = transport.postRequest('/RPC/takeoff/Booking/Store/SelectUpdatedEvents', args, false);
		reqDate = nextDate;
		if (xhr.status === 200) {
			postMessage(xhr.responseText);
		}
	}, 60000);
};

/**
 * Форматируем дату и время
 * @param d
 * @returns {string}
 */
function formatDate(d) {
	return d.getFullYear() + '-' +
		(((d.getMonth() + 1)<10)?'0':'') + (d.getMonth() + 1) + '-' +
		(d.getDate()<10?'0':'') + d.getDate() + ' ' +
		(d.getHours()<10?'0':'') + d.getHours() + ':' +
		(d.getMinutes()<10?'0':'') + d.getMinutes() + ':' +
		(d.getSeconds()<10?'0':'') + d.getSeconds();
}
