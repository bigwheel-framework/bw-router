var router = require( '../' )( {

	'/': 'root',
	'/about': 'about',
	'/info': 'info',
	'/gallery/:image': 'image',
	'404': '404',

	onRoute: function() {

		console.log( arguments );
	}
}).init();

