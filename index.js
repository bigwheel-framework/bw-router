var on = require('dom-event');
var off = on.off;
var routes = require('routes');
var noop = function() {};

function router(settings) {

	if( !( this instanceof router ) ) {

		return new router(settings);
	}

	var s = this.s = settings || {};

	s.postHash = s.postHash || '!';
	s.onRoute = s.onRoute || function() {};

	this.router = routes();
}

router.prototype = {

	init: function() {

		var s = this.s;

		// figure out a start section
		if( s[ '/' ] === undefined ) {

			// find the first path which would be a section
			for(var i in s) {

				if( i[ 0 ] == '/' ) {

					s.start = i;

					break;
				}
			}
		} else {

			s.start = '/';
		}


		// now setup routes
		for(var i in s) {

			if( i[ 0 ] == '/' || i == '404') {

				this.router.addRoute(i, noop);
			}
		}

		this.onURL = this.onURL.bind(this);

		if( global.location ) {

			on(global, 'hashchange', this.onURL);
		}

		this.onURL(); // force a hash change to start things up
		
		return this;
	},

	destroy: function() {

		off(global, 'hashchange', this.onURL);
	},

	add: function(route, section) {

		var s = this.s;

		s[ route ] = section;

		return this;
	},

	go: function(routeStr) {

		var routeData;
		var section;
		var newURL;
		var doURLChange;

		if( routeStr.charAt(0) != '/' ) {
			routeStr = '/' + routeStr;
		}

		newURL = this.s.postHash + routeStr;
		routeData = this.getRouteData(routeStr) || this.getRouteData('404');
		section = this.getSection(routeData);
		doURLChange = this.useURL(section);

		// if this is not a section descriptor or it is a descriptor and we should updateURL
		if( global.location && doURLChange ) {

			global.location.hash = newURL;

			// Check if duplicate is set. The check is done here since, onhashchange event triggers 
			// only when url changes and therefore cannot check to allow duplicate/repeating route
			if(section.duplicate) {
				this.doRoute(routeData, section);
			}
		} else if( !global.location || !doURLChange ) {
			this.doRoute(routeData, section);
		}
	},

	doRoute: function(routeData, section) {

		var s = this.s;

		// check if this is a redirect
		if( typeof section == 'string' ) {

			this.go(section);
		} else { 
			// otherwise treat it as a regular section
			// if this is a object definition vs a section definition (regular section or array)
			s.onRoute(section.section || section, routeData);
		} 
	},

	getRouteData: function(routeStr) {

		return this.router.match(routeStr);
	},

	getSection: function(routeData) {

		if(routeData) {

			return this.s[ routeData.route ];
		} else {

			return null;
		}
	},

	useURL: function(section) {

		return section && 
			   ( section.section === undefined ||  // if this is not a section descriptor update url
			   ( section.section && section.useURL || section.useURL === undefined ) ); //is descriptor and has useURL or undefined
	},

	onURL: function() {

		var routeStr = '/';
		var routeData;
		var section;

		if(this.resolved !== global.location.hash) {

			this.resolved = global.location.hash;

			if( global.location && global.location.hash != '' ) {

				routeStr = global.location.hash.substr(1 + this.s.postHash.length);
			}

			routeData = this.getRouteData(routeStr) || this.getRouteData('404');
			section = this.getSection(routeData);

			// see if we can deep link into this section (either normal or 404 section)
			if( this.useURL(section) ) {
				this.doRoute(routeData, section);
			// else check if there's a 404 if so then go there
			} else if( this.s['404'] ){

				routeData = this.getRouteData('404');
				section = this.getSection(routeData);
				this.doRoute(routeData, section);
			}
		}
	}
};

module.exports = router;