var test = require( 'tape' );

var testIdx = 0;

var sectionRoot = { name: '/' };
var sectionAbout = { name: '/about' };
var sectionInfo = [ { name: '/info' }, { name: '/info2' } ];
var sectionGallery = { name: '/gallery/:image' };
var section404 = { name: '404' };
var router, useURLTimeout;

test( 'testing router', function( t ) {

	router = require( '../' )( {

		'/': sectionRoot,
		'/about': { section: sectionAbout, useURL: false },
		'/info': sectionInfo,
		'/gallery/:image': sectionGallery,
		'/redirect': '/',
		'404': section404,

		onRoute: function( section, req ) {

			switch( testIdx ) {

				case 0:
			
					t.equal( section, sectionRoot, 'section is /' );

					nextTest();
				break;

				case 1:

					t.equal( section, sectionInfo, 'section is /info' );

					nextTest();
				break;

				case 2:

					if(global.location) {
						t.notEqual(global.location.hash, '#!/about', 'hash should not be changed with useURL false');
					}

					nextTest();
				break;

				case 3:

					t.equal( section, sectionGallery, 'section is /gallery/:image' );
					t.equal( req.params.image, 'snake', 'param was correct' );
					t.equal( req.route, '/gallery/:image', 'route was correct for gallery' );

					nextTest();
				break;

				case 4:
					
					t.equal( req.route, '404', '404 route had info');
					t.equal( section, section404, 'section is 404' );

					nextTest();
				break;

				case 5:

					t.equal( section, sectionInfo, 'section is info' );

					nextTest();
				break;

				case 6:

					t.equal( section, sectionRoot, 'redirect worked' );

					nextTest();
				break;

				case 7:

					clearTimeout( useURLTimeout );

					t.equal( section, section404, 'went to 404 when trying to use url' );

					nextTest();
				break;
			}
		}
	});

	// if we're running in the browser ensure that the url is reset
	if( global.location ) {

		global.location.hash = '';
	}

	router.init();

	function nextTest() {

		testIdx++;

		switch( testIdx ) {

			case 1:

				router.go( '/info' );
			break;

			case 2:

				router.go('/about');
			break;

			case 3:

				router.go( '/gallery/snake' );
			break;

			case 4:

				router.go( '/something doesnt exist' );
			break;

			case 5:

				router.go( 'info' );
			break;

			case 6:

				router.go( '/redirect' );
			break;

			case 7:

				if( global.location ) {

					useURLTimeout = setTimeout( function() {

						t.fail( 'didn\'t go to 404 when going to route with useURL = false' );
						nextTest();
					}, 1000 );

					global.location.hash = '#!/about';
				} else {

					nextTest();
				}
			break;

			default:
				router.destroy();
				t.end();
			break;
		}
	}
});

test('test 404 redirect', function(t) {

	if( global.location ) {

		global.location.hash = '';
	}

	router = require( '../' )( {
		'/': sectionRoot,
		'/about': sectionAbout,
		'404': '/about',

		onRoute: function( section, req ) {

			if(req.route === '/') {
				router.go('something that doesnt exist');
			} else {
				t.equal(section, sectionAbout, 'redirected to about');
				t.end();
			}
		}
	});

	router.init();
});