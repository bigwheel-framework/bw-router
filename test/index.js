var router = require( '../' )( {

	'/': { name: '/' },
	'/about': { section: { name: '/about' }, useURL: false },
	'/info': [ { name: '/info' }, { name: '/info2' } ],
	'/gallery/:image': { name: '/gallery/:image' },
	'404': { name: '404' },

	onRoute: function( section, req ) {

		console.log( 'req:', req )
		console.log( 'section:', section );
		console.log( '---------------' );
	}
}).init();

window.onmouseup = function() {

	router.go( 'about' );
}