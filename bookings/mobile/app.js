
// register service worker from PWA

// Required from PWA !
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('sw.js?v1', {
		scope: '.' // <--- THIS BIT IS REQUIRED
	}).then(function(registration) {
		// Registration was successful
		console.log('ServiceWorker registration successful with scope: ', registration.scope);
	}, function(err) {
		// registration failed :(
		console.log('ServiceWorker registration failed: ', err);
	});
}

scheduler.config.readonly = true;
// template for class name of event container
scheduler.templates.event_class =  function(obj, type){
	let css = '';
	if (obj.without_pilots !== undefined && obj.without_pilots !== null) {
		css = ' without-pilots ';
	}
	if (obj.type === undefined) {
		return '';
	} else {
		switch (obj.type) {
			case 'buffer':
				return 'bg-buffer' + css;
			case 'maintenance':
				return 'bg-maintenance' + css;
			case 'flight':
				if (parseInt(obj.simulator) === 1) {
					return 'bg-boeing' + css;
				} else {
					return 'bg-airbus' + css;
				}
				break;
			case 'school':
				return 'bg-school' + css;
			default:
				return css;
		}
	}
};

webix.ready(function(){
	webix.Touch.fastClick = false; // Для избежания перепрыгивания по датам
	//the method allows to adjust a main view to screen size
	webix.ui.fullScreen();
	//object constructor
	webix.ui({
		view: "scheduler",
		id: "scheduler"
	});
	$$("scheduler").load("/RPC/takeoff/Booking/Mobile/Export/Select", "json");
	$$('scheduler').$$('buttons').setValue('day');

	// Время с 9:00 до 22:00
	var list = $$("scheduler").$$("dayList");
	list.config.firstHour = 9;
	list.config.lastHour = 22;
	list.refresh();
});
