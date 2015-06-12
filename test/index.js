var test = require( 'tape' );

var testIdx = 0;

var sectionRoot = { name: '/' };
var sectionAbout = { name: '/about' };
var sectionInfo = [ { name: '/info' }, { name: '/info2' } ];
var sectionGallery = { name: '/gallery/:image' };
var section404 = { name: '404' };
var router;
var subRouter;
var useURLTimeout;

test( 'testing router', function( t ) {

	var tests = [
		function(section, req) {
			t.equal( section, sectionRoot, 'section is /' );
			router.go( '/info' );
		},

		function(section, req) {
			t.equal( section, sectionInfo, 'section is /info' );
			router.go('/about');
		},

		function(section, req) {
			if(global.location) {
				t.notEqual(global.location.hash, '#!/about', 'hash should not be changed with useURL false');
			}

			router.go( '/gallery/snake' );
		},

		function(section, req) {
			t.equal( section, sectionGallery, 'section is /gallery/:image' );
			t.equal( req.params.image, 'snake', 'param was correct' );
			t.equal( req.route, '/gallery/:image', 'route was correct for gallery' );

			router.go( '/something doesnt exist' );
		},

		function(section, req) {
			t.equal( req.route, '404', '404 route had info');
			t.equal( section, section404, 'section is 404' );

			router.go( 'info' );
		},

		function(section, req) {
			t.equal( section, sectionInfo, 'section is info' );

			router.go( '/redirect' );
		},

		function(section, req) {
			
			t.equal( section, sectionRoot, 'redirect worked' );

			if( global.location ) {

				useURLTimeout = setTimeout( function() {

					t.fail( 'didn\'t go to 404 when going to route with useURL = false' );
					endTests();
				}, 1000 );

				global.location.hash = '#!/about';
			} else {

				endTests();
			}
		},

		function(section, req) {
			clearTimeout( useURLTimeout );

			t.equal( section, section404, 'went to 404 when trying to use url' );

			endTests();
		}
	];

	var endTests = function() {
		t.end();
	};

	reset();

	router = require( '../' )( {

		'/': sectionRoot,
		'/about': { section: sectionAbout, useURL: false },
		'/info': sectionInfo,
		'/gallery/:image': sectionGallery,
		'/redirect': '/',
		'404': section404,

		onRoute: function( section, req ) {
			tests.shift()(section, req);
		}
	});

	router.init();
});

test('test 404 redirect', function(t) {

	reset();

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

test('test sub sections', function(t) {

	reset();

	var subTests = [
		function(section, req) {
			t.equal(section, '1', 'first section set');

			process.nextTick( function() {
				subRouter.go('/somethingThatDoesntExist');
			});
		},

		function(section, req) {
			t.equal(section, '404', 'sub 404d');

			process.nextTick( function() {
				subRouter.go('/2');
			});
		},

		function(section, req) {
			t.equal(section, '2', 'second section set');

			process.nextTick( function() {
				router.go('/other');
			});
		},

		function(section, req) {
			t.fail('should have not resolved sub section');
		}
	];
	var countInGallery = 0;


	router = require('../')( {
		'/': '/gallery/1',
		'/gallery/*': { section: 'gallery' },
		'/other': { section: 'other' },
		'404': { section: '404' },
		onRoute: function(section, req) {
			
			if(section === 'gallery') {

				subRouter = router.sub( {
					'/1': { section: '1' },
					'/2': { section: '2' },
					'404': { section: '404' },
					onRoute: function(section, req) {

						subTests.shift()(section, req);
					}
				});

				t.equal(++countInGallery, 1, 'been in gallery only once');
				t.ok(subRouter, 'received a sub router');
			} else if(section === 'other') {

				t.pass('went in other parent section and may have destroyed child');
				t.end();
		  } else {

				t.fail('resolved another url for parent: ' + section);
				t.end();
			}
		}
	});

	router.init();
});

function reset() {

	if(router) {
		router.destroy();
	}

	if( global.location ) {

		global.location.hash = '';
	}
}