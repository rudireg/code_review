// Booking calendar app runner

// Required from PWA !
// if ('serviceWorker' in navigator) {
// 	navigator.serviceWorker.register('sw.js?v1', {
// 		scope: '.' // <--- THIS BIT IS REQUIRED
// 	}).then(function(registration) {
// 		// Registration was successful
// 		console.log('ServiceWorker registration successful with scope: ', registration.scope);
// 	}, function(err) {
// 		// registration failed :(
// 		console.log('ServiceWorker registration failed: ', err);
// 	});
// }


webix.ready(function(){kanri_setAppConfig(function() {

	webix.require([ '/erp/bookings/common.js',
					'/erp/bookings/init.js',
					'/erp/bookings/common-forms.js',
					'/erp/bookings/machine.js',
					'/erp/bookings/scheduler.js'
	], function () {
		let promise = new Promise((resolve, reject) => {
			sch.thesaurus.load(); // Загрузка словаря
			resolve(1);
		})
			.then(response => {
				return new Promise((resolve, reject) => {
					initPilotList();
					resolve(1);
				});
			})
			.then(response => {
				return new Promise((resolve, reject) => {
					initAdminList();
					resolve(1);
				});
			})
			.then(response => {
				return new Promise((resolve, reject) => {
					initIncreaseReason();
					resolve(1);
				});
			})
			.then(response => {
				return new Promise((resolve, reject) => {
					webix.require([ '/erp/bookings/add-cert-booking-form.js',
						'/erp/bookings/add-none-cert-booking-form.js',
						'/erp/bookings/add-buffer-to-form.js',
						'/erp/bookings/top-date-controls.js',
						'/erp/bookings/property-edit-form.js',
						'/erp/bookings/moving-form.js',
						'/erp/bookings/cancel-form.js',
						'/erp/bookings/refund-form.js',
						'/erp/bookings/increase-duration-form.js',
						'/erp/bookings/attach-voucher-form.js',
						'/erp/bookings/complete-form.js',
						'/erp/bookings/customer-search-form.js',
						'/erp/bookings/context-menu.js',
						'/erp/bookings/update-events.js'
					], function () {
						resolve(1);
					});
				});
			})
			.then(response => {

				webix.ui({
					id: "dhx-scheduler-module",
					rows: [
						{
							view: "dhx-scheduler",
							date: new Date(),
							mode: "weekunit",
							days: 7,
							init: function () {},
							ready: function () {
								let scheduler = this.getScheduler();
								scheduler.config.load_date = "%Y-%m-%d";
								scheduler.setLoadMode('week');
								scheduler.load("/RPC/takeoff/Booking/Store/Select", "json");
							}
						}
					]
				});

				doInitComponents();
			});
	});
})});

function doInitComponents() {

	try {
		webix.ui(addNewEvent);
		webix.ui(addNewEventNoneCert);
		webix.ui(addNewServiceEvent);
		webix.ui(optionsEvent);
		webix.ui(movingEvent);
		webix.ui(completeForm);
		webix.ui(refundForm);
		webix.ui(attachVoucherForm);
		webix.ui(reminderInfo);
		webix.ui(addNewReminder);
		webix.ui(dbStatePopup);
		webix.ui(inlineEditCommentPopup);
		webix.ui(staffUsersPopup);
		webix.ui(userInfoPopup);
		webix.ui(historyDataPopup);
		webix.ui(addContextMenu);
		webix.ui(editContextMenu);
		webix.ui(deleteContextMenu);
		webix.ui(addExtraContact);
		webix.ui(changeContactForBooking);
		webix.ui(editEventForm);
		webix.ui(customerSearch);
		webix.ui(helpStatusInfo);
		webix.ui(cancelEventForm);
		webix.ui(increaseDurationForm);
	} catch (e) {
		console.log(e);
	}
}