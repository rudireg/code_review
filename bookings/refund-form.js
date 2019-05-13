/**
 * Возврат денег
 */
const refundForm = {
	view:'window',
	hidden: true,
	modal:true,
	id:'window-' + sch.windows.refund.id,
	position:'center',
	move:true,
	width: 500,
	height: 500,
	head: {
		view:"toolbar",
		id: "toolbar-" + sch.windows.refund.id,
		cols:[
			{ view:"label", label: "", id:"toolbar-label-" + sch.windows.refund.id, align:"left" },
			{
				view:"icon",
				id:"toolbar-close-icon-" + sch.windows.refund.id,
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
			let title = 'Refund for ID: ' + sch.current.event.eid + ' Voucher: ' + sch.current.event.voucher;
			$$("toolbar-label-" + sch.windows.refund.id).setValue(title);
			$$('voucher-id-refund-from-booking').setValue(sch.current.event.voucher);
			$$('form-refund-voucher-from-booking').clearValidation();
			$$('refund-comment-from-booking').setValue('');
			$$('refund-reason-from-booking').setValue(0);
		}
	},
	body: showRefundForm('from-booking', 'booking')
};