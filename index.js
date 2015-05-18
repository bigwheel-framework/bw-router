var on = require( 'dom-event' ),
	off = on.off,
	routes = require( 'routes' );

var noop = function() {};

function router( settings ) {

	if( !( this instanceof router ) ) {

		return new router( settings );
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
			for( var i in s ) {

				if( i[ 0 ] == '/' ) {

					s.start = i;

					break;
				}
			}
		} else {

			s.start = '/';
		}


		// now setup routes
		for( var i in s ) {

			if( i[ 0 ] == '/' || i == '404') {

				this.router.addRoute( i, noop );
			}
		}

		this.onURL = this.onURL.bind( this );

		if( global.location ) {

			on( global, 'hashchange', this.onURL );
		}

		this.onURL(); // force a hash change to start things up
		
		return this;
	},

	destroy: function() {

		off( global, 'hashchange', this.onURL );
	},

	add: function( route, section ) {

		var s = this.s;

		s[ route ] = section;

		return this;
	},

	go: function( routeStr ) {

		if( routeStr[ 0 ] != '/' )
			routeStr = '/' + routeStr;

		var routeData = this.getRouteData( routeStr ) || this.getRouteData('404'),
			section = this.getSection( routeData );

		// if this is not a section descriptor or it is a descriptor and we should updateURL
		if( global.location && this.useURL( section ) )
			global.location.hash = this.s.postHash + routeStr;
		else
			this.doRoute( routeData, section );
	},

	doRoute: function( routeData, section ) {

		var s = this.s;

		// Check if we are a duplicate section
		if( routeData.route != this.lastRoute || section.duplicate ) {
			
			// check if this is a redirect
			if( typeof section == 'string' ) {

				this.go( section );
			// otherwise treat it as a regular section
			} else {

				// if this is a object definition vs a section definition
				if( section.section ) {

					s.onRoute( section.section, routeData );
				// this is a regular section or array
				} else {

					s.onRoute( section, routeData );
				}
			}
			
			this.lastRoute = routeData.route;
		}
	},

	getRouteData: function( routeStr ) {

		return this.router.match( routeStr );
	},

	getSection: function( routeData ) {

		if( routeData ) {

			return this.s[ routeData.route ];
		} else {

			return null;
		}
	},

	useURL: function( section ) {

		return section && 
			   ( section.section === undefined ||  // if this is not a section descriptor update url
			   ( section.section && section.useURL || section.useURL === undefined ) ); //is descriptor and has useURL or undefined
	},

	onURL: function() {

		var routeStr = '/',
			routeData, section;

		if( global.location && global.location.hash != '' ) {

			routeStr = global.location.hash.substr( 1 + this.s.postHash.length );
		}

		routeData = this.getRouteData( routeStr ) || this.getRouteData('404');
		section = this.getSection( routeData );

		// see if we can deep link into this section
		if( this.useURL( section ) )
			this.doRoute( routeData, section );
	}
};

module.exports = router;