var routes = require('routes');
var EventEmitter = require('events').EventEmitter;
var loc = new (require('location-bar'))();
var noop = function() {};

function router(settings) {

	if( !( this instanceof router ) ) {

		return new router(settings);
	}

	var s = this.s = settings || {};

	s.postHash = s.postHash || '!';

	this.lastRoute = null;
	this.childRouter = null;
	this.childFullRoute = null;
	this.childBaseRoute = null;
	this.router = routes();

	EventEmitter.call(this);
}

var p = router.prototype = Object.create(EventEmitter.prototype);

p.init = function() {

	var s = this.s;
	var i;

	// figure out a start section
	if( s[ '/' ] === undefined ) {

		// find the first path which would be a section
		for(i in s) {

			if( i[ 0 ] == '/' ) {

				s.start = i;

				break;
			}
		}
	} else {

		s.start = '/';
	}


	// now setup routes
	for(i in s) {

		if( i[ 0 ] == '/' || i == '404') {

			this.router.addRoute(i, noop);
		}
	}

	this.onURL = this.onURL.bind(this);

	if( global.location ) {
		loc.start({pushState: this.s.pushState!==undefined ? this.s.pushState : true, root: this.s.root || '/'});
		this.hasPushState = loc.hasPushState();
		loc.onChange(this.onURL);
		loc.loadUrl();
	} else {
		this.onURL();
	}
	
	return this;
};

p.destroy = function() {

	if(global.location) {
		loc.stop();
	}
};

p.add = function(route, section) {

	var s = this.s;

	s[ route ] = section;

	return this;
};

p.go = function(routeStr,options) {

	var routeData;
	var section;
	var newURL;
	var doURLChange;

	if( routeStr.charAt(0) != '/' ) {
		routeStr = '/' + routeStr;
	}

	newURL = (this.hasPushState ? '' : this.s.postHash) + routeStr;
	routeData = this.getRouteData(routeStr) || this.getRouteData('404');
	section = this.getSection(routeData);
	doURLChange = this.useURL(section);

	// if this is not a section descriptor or it is a descriptor and we should updateURL
	if( global.location && doURLChange ) {
		var url = this.hasPushState ? global.location.pathname : global.location.hash.replace(/^#/, '');
		if(url != newURL) {
			loc.update(newURL,{
				trigger: (options && options.silent) ? false : true,
				replace: (options && options.replace) ? true : false
			});
		} else if(section.duplicate || !section.useURL) {
			// Check if duplicate is set. The check is done here since, onhashchange event triggers 
			// only when url changes and therefore cannot check to allow duplicate/repeating route

			// Additionally check if useURL is set to false. If not, the route is not triggered by
			// url changes
			this.doRoute(routeData, section, routeStr);
		} 
	} else if( !global.location || !doURLChange ) {
		this.doRoute(routeData, section, routeStr);
	}
};

p.doRoute = function(routeData, section, path) {

	var s = this.s;

	// check if this is a redirect
	if( typeof section == 'string' ) {

		this.go(section);
	} else { 

		if(routeData.route !== this.lastResolvedRoute || section.duplicate) {

			this.lastResolvedRoute = routeData.route;

			// otherwise treat it as a regular section
			// if this is a object definition vs a section definition (regular section or array)
			this.emit('route', {
				section: section,
				route: routeData,
				path: path
			});
		}
	} 
};

p.getRouteData = function(routeStr) {

	var routeData = this.router.match(routeStr);

	if(routeData) {
		this.lastRoute = routeData.route;
	}

	return routeData;
};

p.getSection = function(routeData) {

	if(routeData) {
		var hasWildcard = routeData.route && (routeData.route.match(/.*[\[\]@!$&:'()*+,;=].*/g) || routeData.route instanceof RegExp);
		var sec = this.s[ routeData.route ];
		if (hasWildcard && sec.duplicate===undefined) {
			if (!sec.section) {
				return {section: sec, duplicate: true};
			} else {
				sec.duplicate = true;
				return sec;
			}
		}	else {
			return sec;
		}
	} else {

		return null;
	}
};

p.useURL = function(section) {

	return section && 
		   ( section.section === undefined ||  // if this is not a section descriptor update url
		   ( section.section && section.useURL || section.useURL === undefined ) ); //is descriptor and has useURL or undefined
};

p.onURL = function(url) {
	var routeStr = '/';
	var routeData;
	var section;

	if( global.location && url!==undefined && url!==null ) {

		if (url.charAt(0) != '/') url = '/' + url;
		// if we've already looked at this url then just get out of this function
		if(url === this.resolved) {
			return;
		}

		this.resolved = url;
		routeStr = (this.hasPushState || url.length<2) ? url : url.substr(1 + this.s.postHash.length);
	}

	routeData = this.getRouteData(routeStr) || this.getRouteData('404');
	section = this.getSection(routeData);

	// see if we can deep link into this section (either normal or 404 section)
	if( this.useURL(section) ) {
		this.doRoute(routeData, section, routeStr);
	// else check if there's a 404 if so then go there
	} else if( this.s['404'] ){

		routeData = this.getRouteData('404');
		section = this.getSection(routeData);
		this.doRoute(routeData, section, routeStr);
	}
};

module.exports = router;