var test = require( 'tape' );

var testIdx = 0;

var sectionRoot = { name: '/' };
var sectionAbout = { name: '/about' };
var sectionInfo = [ { name: '/info' }, { name: '/info2' } ];
var sectionGallery = { name: '/gallery/:image' };
var section404 = { name: '404' };
var router, useURLTimeout;

test( 'testing router', function( t ) {

	if( global.location ) {
		
		t.plan( 9 );
	} else {

		t.plan( 8 );
	}
		

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

					t.equal( section, sectionGallery, 'section is /gallery/:image' );
					t.equal( req.params.image, 'snake', 'param was correct' );
					t.equal( req.route, '/gallery/:image', 'route was correct for gallery' );

					nextTest();
				break;

				case 3:

					t.equal( section, section404, 'section is 404' );

					nextTest();
				break;

				case 4:

					t.equal( section, sectionInfo, 'section is info' );

					nextTest();
				break;

				case 5:

					t.equal( section, sectionRoot, 'redirect worked' );

					nextTest();
				break;

				case 6:

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

				router.go( '/gallery/snake' );
			break;

			case 3:

				router.go( '/something doesnt exist' );
			break;

			case 4:

				router.go( 'info' );
			break;

			case 5:

				router.go( '/redirect' );
			break;

			case 6:

				if( global.location ) {

					useURLTimeout = setTimeout( function() {

						t.fail( 'didn\'t go to 404 when going to route with useURL = false' );
					}, 33 );

					global.location.hash = '#!/about';
				}
			break;
		}
	}
});