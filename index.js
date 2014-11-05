var eventlistener = require( 'eventlistener' ),
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

			if( i[ 0 ] == '/' ) {

				this.router.addRoute( i, noop );
			}
		}

		eventlistener.add( window, 'hashchange', this.onURL.bind( this ) );

		// force a hash change to start things up
		this.onURL();
	},

	add: function( route, section ) {

		var s = this.s;

		s[ route ] = section;

		return this;
	},

	go: function( to ) {

		if( to[ 0 ] != '/' )
			to = '/' + to;

		window.location.hash = this.s.postHash + to;
	},

	doRoute: function( data ) {

		var s = this.s,
			section;

		if( data ) {

			section = s[ data.route ];
		}

		if( section ) {

			// check if this is a redirect
			if( typeof section == 'string' )
				this.go( section );
			// otherwise treat it as a regular section
			else
				s.onRoute( section, data );
		} else if( s[ '404' ] ) {

			s.onRoute( s[ '404' ], data );
		}
	},

	onURL: function() {

		var cRoute = '/';

		if( window.location.hash != '' ) {

			cRoute = window.location.hash.substr( 1 + this.s.postHash.length );
		}

		this.doRoute( this.router.match( cRoute ) );
	}
};

module.exports = router;