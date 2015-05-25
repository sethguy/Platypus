(function () {

	return platformer.createComponentClass({

		id: "logic-hero",
		
		constructor: function (definition) {
			var state = this.state = this.owner.state;
			state.swing = false;
			state.swingHit = false;
			
			this.teleportDestination = undefined;
			this.justTeleported = false;
			
			//platformer.Vector.assign(this.owner, 'position', 'x', 'y', 'z');
		},
		
		events:{
			"handle-logic": function () {			
			},
			
			"portal-waiting": function (portal) {
				portal.trigger('activate-portal');
			}

		}
	});
}());
